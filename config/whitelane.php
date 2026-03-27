<?php

return [
    /*
    | When true, OTP mode accepts the user's password if no cache OTP exists (dev only).
    | Production: set false and issue OTP via Cache::put('driver_login_otp:{id}', $code, ttl) or SMS.
    */
    'otp_fallback_to_password' => env('WHITELANE_OTP_FALLBACK_TO_PASSWORD', true),
];
