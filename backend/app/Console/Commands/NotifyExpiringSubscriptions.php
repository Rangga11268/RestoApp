<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotifyExpiringSubscriptions extends Command
{
    protected $signature   = 'subscriptions:notify-expiry {--days=7 : Notify subscriptions expiring within N days}';
    protected $description = 'Send email notifications to restaurants whose subscriptions are expiring soon.';

    public function handle(): int
    {
        $days     = (int) $this->option('days');
        $deadline = Carbon::now()->addDays($days)->endOfDay();

        $expiring = Subscription::with(['restaurant', 'plan'])
            ->whereIn('status', ['active', 'trialing'])
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', $deadline)
            ->where('ends_at', '>=', now())
            ->get();

        $this->info("Found {$expiring->count()} subscriptions expiring within {$days} days.");

        $notified = 0;

        foreach ($expiring as $sub) {
            $restaurant = $sub->restaurant;

            if (! $restaurant || ! $restaurant->email) {
                continue;
            }

            try {
                // Simple mail — in production you'd use a proper Mailable class
                Mail::raw(
                    "Halo {$restaurant->name},\n\n" .
                        "Langganan Anda (Paket {$sub->plan?->name}) akan berakhir pada {$sub->ends_at->format('d/m/Y')} " .
                        "({$sub->daysRemaining()} hari lagi).\n\n" .
                        "Segera perbarui langganan Anda agar tidak terjadi gangguan layanan.\n\n" .
                        "Terima kasih,\nTim RestoApp",
                    fn($message) => $message
                        ->to($restaurant->email, $restaurant->name)
                        ->subject("⚠️ Langganan RestoApp Anda Akan Segera Berakhir")
                );

                $notified++;
                $this->line("  ✓ Notified: {$restaurant->name} ({$restaurant->email})");
            } catch (\Throwable $e) {
                Log::error("Failed to notify {$restaurant->email}: " . $e->getMessage());
                $this->error("  ✗ Failed: {$restaurant->email}");
            }
        }

        $this->info("Done. Notified {$notified}/{$expiring->count()} restaurants.");

        return Command::SUCCESS;
    }
}
