<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Mail\PasswordResetSuccessMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Controller para gestionar la recuperación de contraseña mediante OTP
 */
final class ForgotPasswordController extends Controller
{
    private const OTP_EXPIRATION_MINUTES = 15;

    private const RESET_TOKEN_EXPIRATION_MINUTES = 15;

    private const MAX_ATTEMPTS = 5;

    private const RATE_LIMIT_KEY_PREFIX = 'forgot-password:';

    private const RATE_LIMIT_MAX_ATTEMPTS = 3;

    private const RATE_LIMIT_DECAY_MINUTES = 1;

    /**
     * Enviar OTP para recuperación de contraseña
     */
    public function sendOtp(Request $request): JsonResponse
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

            // Verificación adicional de seguridad: usuario debe estar activo o pendiente
            if (! in_array($user->status, ['active', 'pending_approval'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta cuenta no está disponible para recuperación de contraseña.',
                ], 403);
            }

            // Generar OTP seguro
            $otp = $this->generateSecureOtp();

            // Eliminar OTPs anteriores para este email
            DB::table('password_reset_tokens')
                ->where('email', $email)
                ->where('type', 'password_reset')
                ->delete();

            // Crear nuevo OTP
            DB::table('password_reset_tokens')->insert([
                'email' => $email,
                'token' => Hash::make($otp),
                'attempts' => 0,
                'type' => 'password_reset',
                'created_at' => Carbon::now(),
                'last_attempt_at' => null,
            ]);

            // Enviar email con OTP usando SendGrid
            try {
                Mail::to($email)->send(new OtpMail(
                    $user->name,
                    $otp,
                    self::OTP_EXPIRATION_MINUTES
                ));
            } catch (\Exception $e) {
                // Log del error pero no exponer detalles al usuario por seguridad
                \Log::error('Error al enviar email de OTP', [
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);

                // En desarrollo, mostrar más información
                if (config('app.env') === 'local') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Error al enviar el código OTP: '.$e->getMessage(),
                        'debug_otp' => $otp, // Solo en desarrollo
                    ], 500);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Error al enviar el código OTP. Por favor, intenta nuevamente.',
                ], 500);
            }

            // Incrementar el contador de rate limiting
            RateLimiter::hit($rateLimitKey, self::RATE_LIMIT_DECAY_MINUTES * 60);

            return response()->json([
                'success' => true,
                'message' => 'Código OTP enviado exitosamente',
                'data' => [
                    'email' => $email,
                    'user_name' => $user->name,
                    // Solo mostrar OTP en desarrollo
                    'otp' => config('app.env') === 'local' ? $otp : null,
                    'expires_in' => self::OTP_EXPIRATION_MINUTES,
                ],
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error en sendOtp', [
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
     * Verificar OTP y generar token de reset
     */
    public function verifyOtp(Request $request): JsonResponse
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

            // Buscar el token
            $tokenRecord = DB::table('password_reset_tokens')
                ->where('email', $email)
                ->where('type', 'password_reset')
                ->first();

            if (! $tokenRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró un código OTP válido para este email.',
                ], 404);
            }

            // Verificar intentos máximos
            if ($tokenRecord->attempts >= self::MAX_ATTEMPTS) {
                DB::table('password_reset_tokens')
                    ->where('email', $email)
                    ->where('type', 'password_reset')
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
                    ->where('type', 'password_reset')
                    ->delete();

                return response()->json([
                    'success' => false,
                    'message' => 'El código OTP ha expirado. Por favor, solicita uno nuevo.',
                ], 410);
            }

            // Verificar el OTP
            if (! Hash::check($otp, $tokenRecord->token)) {
                // Incrementar contador de intentos
                DB::table('password_reset_tokens')
                    ->where('email', $email)
                    ->where('type', 'password_reset')
                    ->update([
                        'attempts' => $tokenRecord->attempts + 1,
                        'last_attempt_at' => Carbon::now(),
                    ]);

                $remainingAttempts = self::MAX_ATTEMPTS - ($tokenRecord->attempts + 1);

                return response()->json([
                    'success' => false,
                    'message' => 'Código OTP incorrecto.',
                    'remaining_attempts' => max(0, $remainingAttempts),
                ], 401);
            }

            // Generar token seguro para resetear contraseña
            $resetToken = Str::random(64);

            // Actualizar el registro con el token de reset
            DB::table('password_reset_tokens')
                ->where('email', $email)
                ->where('type', 'password_reset')
                ->update([
                    'token' => Hash::make($resetToken),
                    'attempts' => 0, // Reset attempts for the new token
                    'created_at' => Carbon::now(),
                    'last_attempt_at' => null,
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Código OTP verificado exitosamente',
                'data' => [
                    'reset_token' => $resetToken,
                    'email' => $email,
                    'expires_in' => self::RESET_TOKEN_EXPIRATION_MINUTES,
                ],
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error en verifyOtp', [
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
     * Resetear contraseña con token
     */
    public function resetPassword(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'reset_token' => 'required|string',
                'password' => [
                    'required',
                    'string',
                    'min:8',
                    'confirmed',
                    'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/', // Al menos una minúscula, mayúscula y número
                ],
            ], [
                'email.required' => 'El correo electrónico es obligatorio.',
                'email.email' => 'El formato del correo electrónico no es válido.',
                'reset_token.required' => 'El token de reset es obligatorio.',
                'password.required' => 'La contraseña es obligatoria.',
                'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
                'password.confirmed' => 'La confirmación de contraseña no coincide.',
                'password.regex' => 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $email = $request->email;
            $resetToken = $request->reset_token;

            // Buscar el token
            $tokenRecord = DB::table('password_reset_tokens')
                ->where('email', $email)
                ->where('type', 'password_reset')
                ->first();

            if (! $tokenRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token de reset inválido o expirado.',
                ], 404);
            }

            // Verificar expiración
            $expirationTime = Carbon::parse($tokenRecord->created_at)
                ->addMinutes(self::RESET_TOKEN_EXPIRATION_MINUTES);

            if ($expirationTime->isPast()) {
                DB::table('password_reset_tokens')
                    ->where('email', $email)
                    ->where('type', 'password_reset')
                    ->delete();

                return response()->json([
                    'success' => false,
                    'message' => 'El token de reset ha expirado. Por favor, solicita uno nuevo.',
                ], 410);
            }

            // Verificar el token
            if (! Hash::check($resetToken, $tokenRecord->token)) {
                // Incrementar intentos fallidos
                DB::table('password_reset_tokens')
                    ->where('email', $email)
                    ->where('type', 'password_reset')
                    ->update([
                        'attempts' => $tokenRecord->attempts + 1,
                        'last_attempt_at' => Carbon::now(),
                    ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Token de reset inválido.',
                ], 401);
            }

            // Actualizar la contraseña del usuario
            $user = User::where('email', $email)->first();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado.',
                ], 404);
            }

            // Verificar que la nueva contraseña no sea igual a la anterior
            if (Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La nueva contraseña no puede ser igual a la contraseña actual.',
                ], 400);
            }

            $user->password = Hash::make($request->password);
            $user->save();

            // Eliminar el token usado
            DB::table('password_reset_tokens')
                ->where('email', $email)
                ->where('type', 'password_reset')
                ->delete();

            // Enviar email de confirmación
            try {
                $resetDateTime = Carbon::now()->format('d/m/Y H:i:s');
                Mail::to($email)->send(new PasswordResetSuccessMail(
                    $user->name,
                    $resetDateTime
                ));
            } catch (\Exception $e) {
                // Log del error pero continuar, ya que la contraseña se cambió exitosamente
                \Log::error('Error al enviar email de confirmación de reset', [
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Contraseña actualizada exitosamente',
                'data' => [
                    'user_name' => $user->name,
                    'email' => $user->email,
                ],
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error en resetPassword', [
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
