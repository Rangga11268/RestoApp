<?php

use App\Console\Commands\NotifyExpiringSubscriptions;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Task Scheduling
|--------------------------------------------------------------------------
| Run: * * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
*/

// Notify restaurants whose subscription expires in 7 days — runs every day at 08:00
Schedule::command(NotifyExpiringSubscriptions::class, ['--days=7'])
    ->dailyAt('08:00')
    ->withoutOverlapping()
    ->runInBackground();

// Auto-expire subscriptions that have passed their end date — daily
Schedule::call(function () {
    \App\Models\Subscription::whereIn('status', ['active', 'trialing'])
        ->whereNotNull('ends_at')
        ->where('ends_at', '<', now()->toDateString())
        ->update(['status' => 'expired']);
})->daily()->name('expire-subscriptions');
