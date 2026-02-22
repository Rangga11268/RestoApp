<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\StoreStaffRequest;
use App\Http\Requests\Staff\UpdateStaffRequest;
use App\Http\Traits\ApiResponse;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    use ApiResponse;

    // Roles that can be managed as staff (not owner/superadmin)
    private const STAFF_ROLES = ['manager', 'cashier', 'kitchen'];

    /* ────────────────────────────────────────────────────
     | GET /v1/staff
     | List all staff members for the restaurant
     ──────────────────────────────────────────────────── */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeOwner($request);

        $restaurantId = $request->user()->restaurant_id;

        $staff = User::withTrashed()
            ->where('restaurant_id', $restaurantId)
            ->whereIn('role', self::STAFF_ROLES)
            ->orderBy('role')
            ->orderBy('name')
            ->get()
            ->map(fn($u) => $this->formatUser($u));

        return $this->success($staff);
    }

    /* ────────────────────────────────────────────────────
     | POST /v1/staff
     | Create a new staff member
     ──────────────────────────────────────────────────── */
    public function store(StoreStaffRequest $request): JsonResponse
    {
        $this->authorizeOwner($request);

        $data = $request->validated();

        $user = User::create([
            'restaurant_id' => $request->user()->restaurant_id,
            'name'          => $data['name'],
            'email'         => $data['email'],
            'password'      => Hash::make($data['password']),
            'role'          => $data['role'],
            'phone'         => $data['phone'] ?? null,
            'is_active'     => true,
        ]);

        ActivityLog::log('staff.created', $user, ['role' => $user->role]);

        return $this->created($this->formatUser($user), 'Staff berhasil ditambahkan.');
    }

    /* ────────────────────────────────────────────────────
     | PUT /v1/staff/{user}
     | Update staff member info
     ──────────────────────────────────────────────────── */
    public function update(UpdateStaffRequest $request, int $userId): JsonResponse
    {
        $this->authorizeOwner($request);

        $user = $this->resolveStaff($request, $userId);

        $data = $request->validated();

        if (isset($data['password']) && $data['password']) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        ActivityLog::log('staff.updated', $user);

        return $this->success($this->formatUser($user->fresh()), 'Staff berhasil diperbarui.');
    }

    /* ────────────────────────────────────────────────────
     | PATCH /v1/staff/{user}/toggle
     | Activate / deactivate a staff member
     ──────────────────────────────────────────────────── */
    public function toggle(Request $request, int $userId): JsonResponse
    {
        $this->authorizeOwner($request);

        $user = $this->resolveStaff($request, $userId);
        $user->update(['is_active' => ! $user->is_active]);

        ActivityLog::log('staff.toggled', $user, ['is_active' => $user->is_active]);

        $status = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return $this->success($this->formatUser($user), "Staff berhasil {$status}.");
    }

    /* ────────────────────────────────────────────────────
     | DELETE /v1/staff/{user}
     | Soft-delete staff member
     ──────────────────────────────────────────────────── */
    public function destroy(Request $request, int $userId): JsonResponse
    {
        $this->authorizeOwner($request);

        $user = $this->resolveStaff($request, $userId);
        $user->delete(); // soft delete

        ActivityLog::log('staff.deleted', $user);

        return $this->success(null, 'Staff berhasil dihapus.');
    }

    /* ─────────────── Private helpers ─────────────── */

    private function authorizeOwner(Request $request): void
    {
        abort_if(
            ! in_array($request->user()->role, ['owner', 'superadmin']),
            403,
            'Hanya owner yang dapat mengelola staff.'
        );
    }

    private function resolveStaff(Request $request, int $userId): User
    {
        $user = User::withTrashed()
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->whereIn('role', self::STAFF_ROLES)
            ->findOrFail($userId);

        return $user;
    }

    private function formatUser(User $user): array
    {
        return [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'phone'          => $user->phone,
            'avatar_url'     => $user->avatar_url,
            'is_active'      => $user->is_active,
            'last_login_at'  => $user->last_login_at?->toDateTimeString(),
            'deleted_at'     => $user->deleted_at?->toDateTimeString(),
        ];
    }
}
