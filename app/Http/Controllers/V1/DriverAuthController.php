<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuthTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class DriverAuthController extends Controller
{
    public function __construct(
        protected AuthTokenService $tokens
    ) {}

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'max:191'],
            'secret' => ['required', 'string', 'max:255'],
            'mode' => ['required', 'in:password,otp'],
        ]);

        $user = $this->resolveUser($data['identifier']);

        if (! $user) {
            return response()->json([
                'error' => ['code' => 'not_found', 'message' => 'Invalid credentials'],
            ], 404);
        }

        if ($user->role !== 'driver' || $user->account_status !== 'active') {
            return response()->json([
                'error' => ['code' => 'forbidden', 'message' => 'Account not provisioned for driver app'],
            ], 403);
        }

        if (! $this->verifySecret($user, $data['secret'], $data['mode'])) {
            return response()->json([
                'error' => ['code' => 'not_found', 'message' => 'Invalid credentials'],
            ], 404);
        }

        $pair = $this->tokens->issuePair($user);

        return response()->json([
            'access_token' => $pair['access_token'],
            'refresh_token' => $pair['refresh_token'],
            'expires_in' => $pair['expires_in'],
            'must_reset_password' => $user->must_reset_password,
            'user' => [
                'id' => (string) $user->id,
                'display_name' => $user->name,
                'roles' => [$user->role],
                'is_online' => $user->is_online,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $this->tokens->revokeAll($user);
        }

        return response()->json(null, 204);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'max:255'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->password = $data['new_password'];
        $user->must_reset_password = false;
        $user->save();

        return response()->json(null, 204);
    }

    public function refresh(Request $request): JsonResponse
    {
        $data = $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $pair = $this->tokens->refresh($data['refresh_token']);

        if (! $pair) {
            return response()->json([
                'error' => ['code' => 'invalid_token', 'message' => 'Invalid or expired refresh token'],
            ], 401);
        }

        return response()->json([
            'access_token' => $pair['access_token'],
            'refresh_token' => $pair['refresh_token'],
            'expires_in' => $pair['expires_in'],
        ]);
    }

    protected function resolveUser(string $identifier): ?User
    {
        $trimmed = trim($identifier);
        $normalizedPhone = preg_replace('/\s+/', '', $trimmed);

        return User::query()
            ->where(function ($q) use ($trimmed, $normalizedPhone) {
                $q->where('email', $trimmed)
                    ->orWhere('username', $trimmed)
                    ->orWhere('phone', $normalizedPhone);
            })
            ->first();
    }

    protected function verifySecret(User $user, string $secret, string $mode): bool
    {
        if ($mode === 'password') {
            return Hash::check($secret, $user->password);
        }

        // OTP: production should verify SMS code; cache-based staging OTP supported.
        $cached = Cache::get('driver_login_otp:'.$user->id);
        if (is_string($cached) && hash_equals($cached, $secret)) {
            Cache::forget('driver_login_otp:'.$user->id);

            return true;
        }

        // MVP fallback: allow same password as OTP when no cached OTP (document for removal in prod).
        if (config('whitelane.otp_fallback_to_password', false)) {
            return Hash::check($secret, $user->password);
        }

        return false;
    }
}
