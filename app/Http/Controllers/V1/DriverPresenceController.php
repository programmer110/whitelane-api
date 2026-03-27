<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverPresenceController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'is_online' => ['required', 'boolean'],
            'lat' => ['nullable', 'numeric'],
            'lng' => ['nullable', 'numeric'],
        ]);

        $user = $request->user();
        $user->is_online = $data['is_online'];
        if (isset($data['lat'])) {
            $user->last_lat = $data['lat'];
        }
        if (isset($data['lng'])) {
            $user->last_lng = $data['lng'];
        }
        $user->save();

        return response()->json(null, 204);
    }
}
