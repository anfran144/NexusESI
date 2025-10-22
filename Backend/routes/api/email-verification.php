<?php

use App\Http\Controllers\Api\EmailVerificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Email Verification Routes
|--------------------------------------------------------------------------
|
| Rutas para la funcionalidad de verificación de correo electrónico usando OTP:
| - Envío de OTP de verificación
| - Verificación de OTP para confirmar email
|
*/

Route::prefix('email-verification')->group(function () {
    Route::post('/send-otp', [EmailVerificationController::class, 'sendVerificationOtp']);
    Route::post('/verify', [EmailVerificationController::class, 'verifyEmail']);
});
