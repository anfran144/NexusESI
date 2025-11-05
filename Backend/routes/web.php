<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Ruta temporal para resolver el problema de autenticación
Route::get('/login', function () {
    return response()->json(['message' => 'Please authenticate via API'], 401);
})->name('login');
