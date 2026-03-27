<?php

namespace App\Services;

use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Support\Str;

class AuthTokenService
{
    public function issuePair(User $user): array
    {
        $user->tokens()->delete();
        RefreshToken::where('user_id', $user->id)->delete();

        $access = $user->createToken('driver-app', ['driver'], now()->addHour());
        $plainRefresh = Str::random(64);

        RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plainRefresh),
            'expires_at' => now()->addDays(30),
        ]);

        return [
            'access_token' => $access->plainTextToken,
            'refresh_token' => $plainRefresh,
            'expires_in' => 3600,
        ];
    }

    public function refresh(string $plainRefresh): ?array
    {
        $hash = hash('sha256', $plainRefresh);
        $row = RefreshToken::where('token_hash', $hash)->where('expires_at', '>', now())->first();

        if (! $row) {
            return null;
        }

        $user = $row->user;
        $row->delete();

        return $this->issuePair($user);
    }

    public function revokeAll(User $user): void
    {
        $user->tokens()->delete();
        RefreshToken::where('user_id', $user->id)->delete();
    }
}
