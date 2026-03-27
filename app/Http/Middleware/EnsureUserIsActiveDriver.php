<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActiveDriver
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'driver' || $user->account_status !== 'active') {
            return response()->json([
                'error' => [
                    'code' => 'forbidden',
                    'message' => 'Driver access only.',
                ],
            ], 403);
        }

        return $next($request);
    }
}
