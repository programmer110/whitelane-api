<?php

use App\Http\Controllers\V1\DriverAuthController;
use App\Http\Controllers\V1\DriverPresenceController;
use App\Http\Controllers\V1\DriverTripController;
use Illuminate\Support\Facades\Route;

/*
| Driver mobile API — base path /v1 (see bootstrap/app.php).
| No public registration routes.
*/

Route::post('/auth/driver/login', [DriverAuthController::class, 'login']);
Route::post('/auth/refresh', [DriverAuthController::class, 'refresh']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [DriverAuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum', 'driver'])->group(function () {
    Route::post('/auth/driver/reset-password', [DriverAuthController::class, 'resetPassword']);

    Route::patch('/driver/presence', [DriverPresenceController::class, 'update']);

    Route::get('/driver/trips/upcoming', [DriverTripController::class, 'upcoming']);
    Route::get('/driver/trips/history', [DriverTripController::class, 'history']);
    Route::get('/driver/trips/{trip}', [DriverTripController::class, 'show']);
    Route::post('/driver/trips/{trip}/accept', [DriverTripController::class, 'accept']);
    Route::post('/driver/trips/{trip}/reject', [DriverTripController::class, 'reject']);
    Route::patch('/driver/trips/{trip}/status', [DriverTripController::class, 'updateStatus']);
});
