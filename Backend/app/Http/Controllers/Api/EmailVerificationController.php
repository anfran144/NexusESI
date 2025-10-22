<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\EmailVerificationMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

/**
 * Controller para gestionar la verificación de correo electrónico mediante OTP
 */
final class EmailVerificationController extends Controller
{
    private const OTP_EXPIRATION_MINUTES = 15;

    private const MAX_ATTEMPTS = 5;

    private const RATE_LIMIT_KEY_PREFIX = 'email-verification:';

    private const RATE_LIMIT_MAX_ATTEMPTS = 3;

    private const RATE_LIMIT_DECAY_MINUTES = 1;

    /**
     * Enviar OTP para verificación de correo electrónico
     */
    public function sendVerificationOtp(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|exists:users,email',
            ], [
                'email.required' => 'El correo electrónico es obligatorio.',
                'email.email' => 'El formato del correo electrónico no es válido.',
                'email.exists' => 'No existe un usuario con este correo electrónico.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $email = $request->email;

            // Rate limiting: Prevenir spam de solicitudes
            $rateLimitKey = self::RATE_LIMIT_KEY_PREFIX.$email;
            if (RateLimiter::tooManyAttempts($rateLimitKey, self::RATE_LIMIT_MAX_ATTEMPTS)) {
                $seconds = RateLimiter::availableIn($rateLimitKey);

                return response()->json([
                    'success' => false,
                    'message' => 'Demasiadas solicitudes. Por favor, espera antes de intentar nuevamente.',
                    'retry_after' => $seconds,
                ], 429);
            }

            $user = User::where('email', $email)->first();

            // Verificar si el email ya está verificado
            if ($user->email_verified_at !== null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Este correo electrónico ya ha sido verificado.',
                ], 400);
            }

            // Generar OTP seguro
            $otp = $this->generateSecureOtp();

            // Eliminar tokens anteriores de verificación para este email
            DB::table('password_reset_tokens')
                ->where('email', $email)
                ->where('type', 'email_verification')
                ->delete();

            // Crear nuevo token de verificación
            DB::table('password_reset_tokens')->insert([
                'email' => $email,
                'token' => Hash::make($otp),
                'attempts' => 0,
                'type' => 'email_verification',
                'created_at' => Carbon::now(),
                'last_attempt_at' => null,
            ]);

            // Enviar email con OTP
            try {
                Mail::to($email)->send(new EmailVerificationMail(
                    $user->name,
                    $otp,
                    self::OTP_EXPIRATION_MINUTES
                ));
            } catch (\Exception $e) {
                // Log del error pero no exponer detalles al usuario
                \Log::error('Error al enviar email de verificación', [
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Error al enviar el código de verificación. Por favor, intenta nuevamente.',
                ], 500);
            }

            // Incrementar el contador de rate limiting
            RateLimiter::hit($rateLimitKey, self::RATE_LIMIT_DECAY_MINUTES * 60);

            return response()->json([
                'success' => true,
                'message' => 'Código de verificación enviado exitosamente',
                'data' => [
                    'email' => $email,
                    'user_name' => $user->name,
                    // Solo mostrar OTP en desarrollo
                    'otp' => config('app.env') === 'local' ? $otp : null,
                    'expires_in' => self::OTP_EXPIRATION_MINUTES,
                ],
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error en sendVerificationOtp', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.',
            ], 500);
        }
    }

    /**
     * Verificar OTP y marcar email como verificado
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'otp' => 'required|string|size:6|regex:/^[0-9]{6}$/',
            ], [
                'email.required' => 'El correo electrónico es obligatorio.',
                'email.email' => 'El formato del correo electrónico no es válido.',
                'otp.required' => 'El código OTP es obligatorio.',
                'otp.size' => 'El código OTP debe tener exactamente 6 dígitos.',
                'otp.regex' => 'El código OTP solo puede contener números.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $email = $request->email;
            $otp = $request->otp;

            // Buscar el token de verificación
            $tokenRecord = DB::table('password_reset_tokens')
                ->where('email', $email)
                ->where('type', 'email_verification')
                ->first();

            if (! $tokenRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró un código de verificación válido para este email.',
                ], 404);
            }

            // Verificar intentos máximos
            if ($tokenRecord->attempts >= self::MAX_ATTEMPTS) {
                DB::table('password_reset_tokens')
                    ->where('email', $email)
                    ->where('type', 'email_verification')
                    ->delete();

                return response()->json([
                    'success' => false,
                    'message' => 'Has excedido el número máximo de intentos. Por favor, solicita un nuevo código.',
                ], 403);
            }

            // Verificar expiración
            $expirationTime = Carbon::parse($tokenRecord->created_at)
                ->addMinutes(self::OTP_EXPIRATION_MINUTES);

            if ($expirationTime->isPast()) {
                DB::table('password_reset_tokens')
                    ->where('email', $email)
                    ->where('type', 'email_verification')
                    ->delete();

                return response()->json([
                    'success' => false,
                    'message' => 'El código de verificación ha expirado. Por favor, solicita uno nuevo.',
                ], 410);
            }

            // Verificar el OTP
            if (! Hash::check($otp, $tokenRecord->token)) {
                // Incrementar contador de intentos
                DB::table('password_reset_tokens')
                    ->where('email', $email)
                    ->where('type', 'email_verification')
                    ->update([
                        'attempts' => $tokenRecord->attempts + 1,
                        'last_attempt_at' => Carbon::now(),
                    ]);

                $remainingAttempts = self::MAX_ATTEMPTS - ($tokenRecord->attempts + 1);

                return response()->json([
                    'success' => false,
                    'message' => 'Código de verificación incorrecto.',
                    'remaining_attempts' => max(0, $remainingAttempts),
                ], 401);
            }

            // OTP válido: Marcar email como verificado
            $user = User::where('email', $email)->first();
            $user->email_verified_at = Carbon::now();
            $user->save();

            // Eliminar el token usado
            DB::table('password_reset_tokens')
                ->where('email', $email)
                ->where('type', 'email_verification')
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Correo electrónico verificado exitosamente',
                'data' => [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'email' => $user->email,
                    'verified_at' => $user->email_verified_at->format('Y-m-d H:i:s'),
                ],
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error en verifyEmail', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.',
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
