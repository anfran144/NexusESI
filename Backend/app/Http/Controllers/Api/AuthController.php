<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\EmailVerificationMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Registrar un nuevo usuario
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'institution_id' => 'required|integer|exists:instituciones,id',
        ], [
            'name.required' => 'El nombre es obligatorio.',
            'name.string' => 'El nombre debe ser una cadena de texto.',
            'name.max' => 'El nombre no puede tener más de 255 caracteres.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El correo electrónico debe tener un formato válido.',
            'email.unique' => 'Este correo electrónico ya está registrado.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
            'institution_id.required' => 'Debes seleccionar una institución.',
            'institution_id.integer' => 'La institución seleccionada no es válida.',
            'institution_id.exists' => 'La institución seleccionada no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Los datos proporcionados no son válidos. Por favor, revisa la información ingresada.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Verificar que la institución esté activa
        $institution = \App\Models\Institucion::find($request->institution_id);
        if (! $institution || $institution->estado !== 'activo') {
            return response()->json([
                'success' => false,
                'message' => 'La institución seleccionada no está disponible para registro.',
                'errors' => [
                    'institution_id' => ['La institución seleccionada no está activa.'],
                ],
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'institution_id' => $request->institution_id,
            'status' => 'pending_approval', // Estado por defecto para nuevos registros
        ]);

        // Opcionalmente enviar email de verificación si está habilitado
        $emailVerificationEnabled = config('app.email_verification_on_registration', false);
        $verificationOtp = null;

        if ($emailVerificationEnabled) {
            try {
                // Generar OTP para verificación de email
                $otp = $this->generateSecureOtp();

                // Guardar OTP en base de datos
                DB::table('password_reset_tokens')->insert([
                    'email' => $user->email,
                    'token' => Hash::make($otp),
                    'attempts' => 0,
                    'type' => 'email_verification',
                    'created_at' => Carbon::now(),
                    'last_attempt_at' => null,
                ]);

                // Enviar email de verificación
                Mail::to($user->email)->send(new EmailVerificationMail(
                    $user->name,
                    $otp,
                    15 // minutos de expiración
                ));

                // Solo mostrar OTP en desarrollo
                $verificationOtp = config('app.env') === 'local' ? $otp : null;
            } catch (\Exception $e) {
                \Log::error('Error al enviar email de verificación en registro', [
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]);
                // No bloquear el registro si falla el envío de email
            }
        }

        // Cargar la relación con la institución para la respuesta
        $user->load(['institution', 'institution.ciudad', 'institution.ciudad.estado', 'institution.ciudad.estado.pais']);

        $responseData = [
            'success' => true,
            'message' => '¡Gracias por registrarte! Tu cuenta está pendiente de aprobación por un administrador del sistema.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'status_display' => $user->status === 'pending_approval' ? 'Pendiente de Aprobación' : $user->status,
                'institution' => $user->institution ? [
                    'id' => $user->institution->id,
                    'nombre' => $user->institution->nombre,
                    'identificador' => $user->institution->identificador,
                    'ciudad' => $user->institution->ciudad->nombre ?? null,
                    'estado' => $user->institution->ciudad->estado->nombre ?? null,
                    'pais' => $user->institution->ciudad->estado->pais->nombre ?? null,
                ] : null,
                'created_at' => $user->created_at,
            ],
            'registration_status' => 'pending_approval',
            'next_steps' => 'Un administrador del sistema revisará tu solicitud y te notificará por correo electrónico cuando tu cuenta sea aprobada.',
        ];

        // Agregar información de verificación de email si está habilitado
        if ($emailVerificationEnabled) {
            $responseData['email_verification'] = [
                'required' => true,
                'otp_sent' => true,
                'otp' => $verificationOtp, // Solo en desarrollo
                'message' => 'Se ha enviado un código de verificación a tu correo electrónico.',
            ];
        }

        return response()->json($responseData, 201);
    }

    /**
     * Iniciar sesión
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Los datos proporcionados no son válidos. Por favor, revisa la información ingresada.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        try {
            if (! $token = JWTAuth::attempt($credentials)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Las credenciales proporcionadas no coinciden con nuestros registros. Por favor, verifica tu correo electrónico y contraseña.',
                ], 401);
            }
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor al procesar la autenticación. Por favor, inténtalo de nuevo más tarde.',
            ], 500);
        }

        $user = Auth::user();

        return response()->json([
            'success' => true,
            'message' => 'Inicio de sesión exitoso',
            'user' => $user->getProfileData(),
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.ttl') * 60,
        ]);
    }

    /**
     * Cerrar sesión
     */
    public function logout(Request $request)
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());

            return response()->json([
                'success' => true,
                'message' => 'Sesión cerrada exitosamente',
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor al cerrar la sesión. Por favor, inténtalo de nuevo más tarde.',
            ], 500);
        }
    }

    /**
     * Obtener información del usuario autenticado
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $request->user()->getProfileData(),
            ],
        ]);
    }

    /**
     * Refrescar token
     */
    public function refresh(Request $request)
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());

            return response()->json([
                'success' => true,
                'message' => 'Token refrescado exitosamente',
                'data' => [
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => config('jwt.ttl') * 60,
                ],
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al refrescar el token',
            ], 500);
        }
    }

    /**
     * Generar un OTP seguro de 6 dígitos
     */
    private function generateSecureOtp(): string
    {
        try {
            $otp = random_int(100000, 999999);

            return str_pad((string) $otp, 6, '0', STR_PAD_LEFT);
        } catch (\Exception $e) {
            // Fallback en caso de error con random_int
            return str_pad((string) mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);
        }
    }
}
