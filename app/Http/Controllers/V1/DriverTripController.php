<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\DriverTripResource;
use App\Models\Trip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DriverTripController extends Controller
{
    public function upcoming(Request $request): AnonymousResourceCollection
    {
        $driverId = (int) $request->user()->id;

        $trips = Trip::query()
            ->confirmedForDriver()
            ->visibleToDriver($driverId)
            ->whereNotIn('driver_status', ['completed', 'cancelled'])
            ->orderBy('scheduled_at')
            ->get();

        return DriverTripResource::collection($trips);
    }

    public function history(Request $request): AnonymousResourceCollection
    {
        $driverId = (int) $request->user()->id;
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(100, max(1, (int) $request->query('page_size', 20)));

        $trips = Trip::query()
            ->confirmedForDriver()
            ->visibleToDriver($driverId)
            ->whereIn('driver_status', ['completed', 'cancelled'])
            ->orderByDesc('scheduled_at')
            ->paginate(perPage: $pageSize, page: $page);

        return DriverTripResource::collection($trips->items());
    }

    public function show(Request $request, int $trip): JsonResponse|DriverTripResource
    {
        $model = $this->findAuthorizedTrip($request, $trip);

        if (! $model) {
            return response()->json([
                'error' => ['code' => 'forbidden', 'message' => 'Trip not available'],
            ], 403);
        }

        return new DriverTripResource($model);
    }

    public function accept(Request $request, int $trip): JsonResponse|DriverTripResource
    {
        $model = $this->findAuthorizedTrip($request, $trip);

        if (! $model || $model->driver_status !== 'offered') {
            return response()->json([
                'error' => ['code' => 'conflict', 'message' => 'Trip no longer available'],
            ], 409);
        }

        $model->driver_status = 'assigned';
        $model->save();

        return new DriverTripResource($model->fresh());
    }

    public function reject(Request $request, int $trip): JsonResponse|DriverTripResource
    {
        $model = $this->findAuthorizedTrip($request, $trip);

        if (! $model || $model->driver_status !== 'offered') {
            return response()->json([
                'error' => ['code' => 'conflict', 'message' => 'Trip no longer available'],
            ], 409);
        }

        $model->driver_id = null;
        $model->driver_status = 'offered';
        $model->save();

        return new DriverTripResource($model->fresh());
    }

    public function updateStatus(Request $request, int $trip): JsonResponse|DriverTripResource
    {
        $data = $request->validate([
            'driver_status' => ['required', 'string', 'in:navigating_to_pickup,arrived,in_progress,completed'],
        ]);

        $model = $this->findAuthorizedTrip($request, $trip);

        if (! $model) {
            return response()->json([
                'error' => ['code' => 'forbidden', 'message' => 'Action not allowed for trip state'],
            ], 403);
        }

        if ($data['driver_status'] === 'completed' && ! $model->payment_paid) {
            return response()->json([
                'error' => ['code' => 'forbidden', 'message' => 'Action not allowed for trip state'],
            ], 403);
        }

        if ($model->driver_status === 'completed') {
            return response()->json([
                'error' => ['code' => 'forbidden', 'message' => 'Action not allowed for trip state'],
            ], 403);
        }

        $model->driver_status = $data['driver_status'];
        $model->save();

        return new DriverTripResource($model->fresh());
    }

    protected function findAuthorizedTrip(Request $request, int $tripId): ?Trip
    {
        $driverId = (int) $request->user()->id;

        $model = Trip::query()
            ->whereKey($tripId)
            ->visibleToDriver($driverId)
            ->first();

        if (! $model || ! $model->isConfirmedOperational()) {
            return null;
        }

        return $model;
    }
}
