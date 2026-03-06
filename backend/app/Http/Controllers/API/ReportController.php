<?php

namespace App\Http\Controllers\API;

use App\Exports\SalesReportExport;
use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    use ApiResponse;

    /* ────────────────────────────────────────────────────
     | GET /v1/reports/dashboard
     | Stats today + daily revenue chart (last 7 days) + top 5 items
     ──────────────────────────────────────────────────── */
    public function dashboard(Request $request): JsonResponse
    {
        $restaurantId = $request->user()->restaurant_id;
        $today        = Carbon::today();

        $data = Cache::remember("report:dashboard:{$restaurantId}", 300, function () use ($restaurantId, $today) {

            // ── Today stats ─────────────────────────────────────
            $todayOrders = Order::where('restaurant_id', $restaurantId)
                ->whereDate('created_at', $today)
                ->get();

            $todayRevenue = Payment::whereHas(
                'order',
                fn($q) => $q
                    ->where('restaurant_id', $restaurantId)
                    ->whereDate('orders.created_at', $today)
            )
                ->where('status', 'paid')
                ->sum('amount');

            $pendingOrders = Order::where('restaurant_id', $restaurantId)
                ->whereIn('status', ['pending', 'confirmed', 'cooking'])
                ->count();

            $activeMenuItems = MenuItem::where('restaurant_id', $restaurantId)
                ->where('is_available', true)
                ->count();

            // ── Revenue last 7 days ───────────────────────────────
            $from = Carbon::today()->subDays(6)->startOfDay();
            $to   = Carbon::today()->endOfDay();

            $dailyRevenue = Payment::whereHas(
                'order',
                fn($q) => $q
                    ->where('restaurant_id', $restaurantId)
            )
                ->where('status', 'paid')
                ->whereBetween('paid_at', [$from, $to])
                ->select(
                    DB::raw('DATE(paid_at) as date'),
                    DB::raw('SUM(amount) as revenue'),
                    DB::raw('COUNT(*) as orders'),
                )
                ->groupBy(DB::raw('DATE(paid_at)'))
                ->orderBy('date')
                ->get()
                ->keyBy('date');

            // Fill missing days with 0
            $chart = [];
            for ($i = 6; $i >= 0; $i--) {
                $date        = Carbon::today()->subDays($i)->format('Y-m-d');
                $chart[] = [
                    'date'    => $date,
                    'label'   => Carbon::parse($date)->translatedFormat('D'),
                    'revenue' => isset($dailyRevenue[$date]) ? (float) $dailyRevenue[$date]->revenue : 0,
                    'orders'  => isset($dailyRevenue[$date]) ? (int) $dailyRevenue[$date]->orders : 0,
                ];
            }

            // ── Top 5 products (all time) ─────────────────────────
            $topProducts = OrderItem::whereHas(
                'order',
                fn($q) => $q
                    ->where('restaurant_id', $restaurantId)
                    ->where('status', '!=', 'cancelled')
            )
                ->select(
                    'menu_item_id',
                    DB::raw('SUM(quantity) as total_qty'),
                    DB::raw('SUM(subtotal) as total_revenue'),
                )
                ->groupBy('menu_item_id')
                ->orderByDesc('total_qty')
                ->limit(5)
                ->with('menuItem:id,name,image_url')
                ->get()
                ->map(fn($row) => [
                    'id'            => $row->menu_item_id,
                    'name'          => $row->menuItem?->name ?? 'Item Dihapus',
                    'image_url'     => $row->menuItem?->image_url,
                    'total_qty'     => (int) $row->total_qty,
                    'total_revenue' => (float) $row->total_revenue,
                ]);

            return [
                'today' => [
                    'revenue'        => (float) $todayRevenue,
                    'order_count'    => $todayOrders->count(),
                    'pending_orders' => $pendingOrders,
                    'active_menus'   => $activeMenuItems,
                ],
                'chart'        => $chart,
                'top_products' => $topProducts,
            ];
        });

        return $this->success($data);
    }

    /* ────────────────────────────────────────────────────
     | GET /v1/reports/sales
     | Aggregate sales by day or month within a date range
     | Query: from (Y-m-d), to (Y-m-d), group_by (day|month)
     ──────────────────────────────────────────────────── */
    public function sales(Request $request): JsonResponse
    {
        $request->validate([
            'from'     => 'nullable|date',
            'to'       => 'nullable|date|after_or_equal:from',
            'group_by' => 'nullable|in:day,month',
        ]);

        $restaurantId = $request->user()->restaurant_id;
        $from         = Carbon::parse($request->input('from', now()->subDays(29)->format('Y-m-d')))->startOfDay();
        $to           = Carbon::parse($request->input('to', now()->format('Y-m-d')))->endOfDay();
        $groupBy      = $request->input('group_by', 'day');

        $cacheKey = "report:sales:{$restaurantId}:{$from->format('Ymd')}:{$to->format('Ymd')}:{$groupBy}";

        $data = Cache::remember($cacheKey, 300, function () use ($restaurantId, $from, $to, $groupBy) {

            $dateFormat = $groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

            $rows = Payment::whereHas('order', fn($q) => $q->where('restaurant_id', $restaurantId))
                ->where('status', 'paid')
                ->whereBetween('paid_at', [$from, $to])
                ->select(
                    DB::raw("DATE_FORMAT(paid_at, '{$dateFormat}') as period"),
                    DB::raw($groupBy === 'month' ? "DATE_FORMAT(paid_at, '%b %Y') as label" : "DATE_FORMAT(paid_at, '%d %b') as label"),
                    DB::raw('SUM(amount) as revenue'),
                    DB::raw('COUNT(*) as transactions'),
                )
                ->groupBy('period', 'label')
                ->orderBy('period')
                ->get();

            // Summary
            $summary = [
                'total_revenue'      => (float) $rows->sum('revenue'),
                'total_transactions' => (int) $rows->sum('transactions'),
                'avg_per_day'        => $rows->count() > 0 ? round($rows->sum('revenue') / $rows->count(), 2) : 0,
            ];

            return [
                'summary' => $summary,
                'chart'   => $rows->map(fn($r) => [
                    'period'       => $r->period,
                    'label'        => $r->label,
                    'revenue'      => (float) $r->revenue,
                    'transactions' => (int) $r->transactions,
                ]),
            ];
        });

        return $this->success($data);
    }

    /* ────────────────────────────────────────────────────
     | GET /v1/reports/top-products
     | Top selling items by qty or revenue
     | Query: from, to, limit (default 10), sort_by (qty|revenue)
     ──────────────────────────────────────────────────── */
    public function topProducts(Request $request): JsonResponse
    {
        $request->validate([
            'from'    => 'nullable|date',
            'to'      => 'nullable|date|after_or_equal:from',
            'limit'   => 'nullable|integer|min:1|max:50',
            'sort_by' => 'nullable|in:qty,revenue',
        ]);

        $restaurantId = $request->user()->restaurant_id;
        $from         = Carbon::parse($request->input('from', now()->subDays(29)->format('Y-m-d')))->startOfDay();
        $to           = Carbon::parse($request->input('to', now()->format('Y-m-d')))->endOfDay();
        $limit        = (int) $request->input('limit', 10);
        $sortBy       = $request->input('sort_by', 'qty');
        $sortCol      = $sortBy === 'revenue' ? 'total_revenue' : 'total_qty';

        $cacheKey = "report:top:{$restaurantId}:{$from->format('Ymd')}:{$to->format('Ymd')}:{$limit}:{$sortBy}";

        $data = Cache::remember($cacheKey, 300, function () use ($restaurantId, $from, $to, $limit, $sortCol) {

            return OrderItem::whereHas(
                'order',
                fn($q) => $q
                    ->where('restaurant_id', $restaurantId)
                    ->where('status', '!=', 'cancelled')
                    ->whereBetween('created_at', [$from, $to])
            )
                ->select(
                    'menu_item_id',
                    DB::raw('SUM(quantity) as total_qty'),
                    DB::raw('SUM(subtotal) as total_revenue'),
                )
                ->groupBy('menu_item_id')
                ->orderByDesc($sortCol)
                ->limit($limit)
                ->with('menuItem:id,name,image_url,price')
                ->get()
                ->map(fn($row) => [
                    'id'            => $row->menu_item_id,
                    'name'          => $row->menuItem?->name ?? 'Item Dihapus',
                    'image_url'     => $row->menuItem?->image_url,
                    'price'         => (float) ($row->menuItem?->price ?? 0),
                    'total_qty'     => (int) $row->total_qty,
                    'total_revenue' => (float) $row->total_revenue,
                ]);
        });

        return $this->success($data);
    }

    /* ────────────────────────────────────────────────────
     | GET /v1/reports/staff-performance
     | Revenue + order count per cashier in a date range
     ──────────────────────────────────────────────────── */
    public function staffPerformance(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'nullable|date',
            'to'   => 'nullable|date|after_or_equal:from',
        ]);

        $restaurantId = $request->user()->restaurant_id;
        $from         = Carbon::parse($request->input('from', now()->subDays(29)->format('Y-m-d')))->startOfDay();
        $to           = Carbon::parse($request->input('to', now()->format('Y-m-d')))->endOfDay();

        $cacheKey = "report:staff:{$restaurantId}:{$from->format('Ymd')}:{$to->format('Ymd')}";

        $data = Cache::remember($cacheKey, 300, function () use ($restaurantId, $from, $to) {

            return Order::where('restaurant_id', $restaurantId)
                ->where('status', 'completed')
                ->whereBetween('created_at', [$from, $to])
                ->whereNotNull('cashier_id')
                ->select(
                    'cashier_id',
                    DB::raw('COUNT(*) as total_orders'),
                    DB::raw('SUM(total) as total_revenue'),
                )
                ->groupBy('cashier_id')
                ->orderByDesc('total_revenue')
                ->with('cashier:id,name,email')
                ->get()
                ->map(fn($row) => [
                    'cashier_id'    => $row->cashier_id,
                    'cashier_name'  => $row->cashier?->name ?? 'Unknown',
                    'cashier_email' => $row->cashier?->email,
                    'total_orders'  => (int) $row->total_orders,
                    'total_revenue' => (float) $row->total_revenue,
                ]);
        });

        return $this->success($data);
    }

    /* ────────────────────────────────────────────────────
     | GET /v1/reports/export/excel
     | Download combined sales report as .xlsx
     ──────────────────────────────────────────────────── */
    public function exportExcel(Request $request): BinaryFileResponse
    {
        $request->validate([
            'from'     => 'nullable|date',
            'to'       => 'nullable|date|after_or_equal:from',
            'group_by' => 'nullable|in:day,month',
        ]);

        $user         = $request->user();
        $restaurantId = $user->restaurant_id;
        $from         = Carbon::parse($request->input('from', now()->subDays(29)->format('Y-m-d')))->startOfDay();
        $to           = Carbon::parse($request->input('to', now()->format('Y-m-d')))->endOfDay();
        $groupBy      = $request->input('group_by', 'day');
        $groupFormat  = $groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
        $labelFormat  = $groupBy === 'month' ? '%Y-%m' : '%d %b %Y';

        $chart = Payment::whereHas(
            'order',
            fn($q) => $q->where('restaurant_id', $restaurantId)->where('status', '!=', 'cancelled')
        )
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$from, $to])
            ->select(
                DB::raw("DATE_FORMAT(paid_at, '{$groupFormat}') as period"),
                DB::raw("DATE_FORMAT(paid_at, '{$labelFormat}') as label"),
                DB::raw('SUM(amount) as revenue'),
                DB::raw('COUNT(*) as transactions'),
            )
            ->groupBy('period', 'label')
            ->orderBy('period')
            ->get()
            ->map(fn($r) => [
                'label'        => $r->label,
                'revenue'      => (float) $r->revenue,
                'transactions' => (int) $r->transactions,
            ])
            ->toArray();

        $restaurantName = $user->restaurant?->name ?? 'Restoran';
        $export = new SalesReportExport(
            $chart,
            $restaurantName,
            $from->format('d/m/Y'),
            $to->format('d/m/Y'),
        );

        $filename = 'laporan-penjualan-' . $from->format('Ymd') . '-' . $to->format('Ymd') . '.xlsx';

        return Excel::download($export, $filename);
    }

    /* ────────────────────────────────────────────────────
     | GET /v1/reports/export/pdf
     | Download combined sales report as .pdf
     ──────────────────────────────────────────────────── */
    public function exportPdf(Request $request): Response
    {
        $request->validate([
            'from'     => 'nullable|date',
            'to'       => 'nullable|date|after_or_equal:from',
            'group_by' => 'nullable|in:day,month',
            'limit'    => 'nullable|integer|min:1|max:50',
            'sort_by'  => 'nullable|in:qty,revenue',
        ]);

        $user         = $request->user();
        $restaurantId = $user->restaurant_id;
        $from         = Carbon::parse($request->input('from', now()->subDays(29)->format('Y-m-d')))->startOfDay();
        $to           = Carbon::parse($request->input('to', now()->format('Y-m-d')))->endOfDay();
        $groupBy      = $request->input('group_by', 'day');
        $groupFormat  = $groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
        $labelFormat  = $groupBy === 'month' ? '%Y-%m' : '%d %b %Y';
        $limit        = (int) $request->input('limit', 10);
        $sortBy       = $request->input('sort_by', 'revenue');
        $sortCol      = $sortBy === 'revenue' ? 'total_revenue' : 'total_qty';

        // ── Sales summary + chart ─────────────────────────
        $paymentsQuery = Payment::whereHas(
            'order',
            fn($q) => $q->where('restaurant_id', $restaurantId)->where('status', '!=', 'cancelled')
        )->where('status', 'paid')->whereBetween('paid_at', [$from, $to]);

        $totalRevenue      = (float) (clone $paymentsQuery)->sum('amount');
        $totalTransactions = (int)   (clone $paymentsQuery)->count();
        $days              = max(1, $from->diffInDays($to) + 1);

        $summary = [
            'total_revenue'      => $totalRevenue,
            'total_transactions' => $totalTransactions,
            'avg_per_day'        => round($totalRevenue / $days, 0),
        ];

        $chart = (clone $paymentsQuery)
            ->select(
                DB::raw("DATE_FORMAT(paid_at, '{$groupFormat}') as period"),
                DB::raw("DATE_FORMAT(paid_at, '{$labelFormat}') as label"),
                DB::raw('SUM(amount) as revenue'),
                DB::raw('COUNT(*) as transactions'),
            )
            ->groupBy('period', 'label')
            ->orderBy('period')
            ->get()
            ->map(fn($r) => [
                'label'        => $r->label,
                'revenue'      => (float) $r->revenue,
                'transactions' => (int) $r->transactions,
            ])
            ->toArray();

        // ── Top products ──────────────────────────────────
        $topProducts = OrderItem::whereHas(
            'order',
            fn($q) => $q
                ->where('restaurant_id', $restaurantId)
                ->where('status', '!=', 'cancelled')
                ->whereBetween('created_at', [$from, $to])
        )
            ->select(
                'menu_item_id',
                DB::raw('SUM(quantity) as total_qty'),
                DB::raw('SUM(subtotal) as total_revenue'),
            )
            ->groupBy('menu_item_id')
            ->orderByDesc($sortCol)
            ->limit($limit)
            ->with('menuItem:id,name')
            ->get()
            ->map(fn($row) => [
                'name'          => $row->menuItem?->name ?? 'Item Dihapus',
                'total_qty'     => (int) $row->total_qty,
                'total_revenue' => (float) $row->total_revenue,
            ])
            ->toArray();

        // ── Staff performance ─────────────────────────────
        $staffPerformance = Order::where('restaurant_id', $restaurantId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$from, $to])
            ->whereNotNull('cashier_id')
            ->select(
                'cashier_id',
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total) as total_revenue'),
            )
            ->groupBy('cashier_id')
            ->orderByDesc('total_revenue')
            ->with('cashier:id,name')
            ->get()
            ->map(fn($row) => [
                'cashier_name'  => $row->cashier?->name ?? 'Unknown',
                'total_orders'  => (int) $row->total_orders,
                'total_revenue' => (float) $row->total_revenue,
            ])
            ->toArray();

        $restaurantName = $user->restaurant?->name ?? 'Restoran';
        $filename       = 'laporan-penjualan-' . $from->format('Ymd') . '-' . $to->format('Ymd') . '.pdf';

        $pdf = Pdf::loadView('reports.sales_pdf', [
            'restaurantName'   => $restaurantName,
            'from'             => $from->format('d/m/Y'),
            'to'               => $to->format('d/m/Y'),
            'printedAt'        => now()->format('d/m/Y H:i'),
            'summary'          => $summary,
            'chart'            => $chart,
            'topProducts'      => $topProducts,
            'staffPerformance' => $staffPerformance,
        ])->setPaper('a4', 'portrait');

        return $pdf->download($filename);
    }
}
