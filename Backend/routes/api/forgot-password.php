<?php

use App\Http\Controllers\Api\ForgotPasswordController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Forgot Password Routes
|--------------------------------------------------------------------------
|
| Rutas para la funcionalidad de recuperación de contraseña usando OTP:
| - Envío de OTP
| - Verificación de OTP
| - Reset de contraseña
|
*/

Route::prefix('forgot-password')->group(function () {
    Route::post('/send-otp', [ForgotPasswordController::class, 'sendOtp']);
    Route::post('/verify-otp', [ForgotPasswordController::class, 'verifyOtp']);
    Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);
});
