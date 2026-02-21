# SOFTWARE DESIGN DOCUMENT

## SaaS Restaurant Management System

**Stack:** Laravel 12 · React 19 + Vite · MySQL 8 · Laravel Sanctum · Tailwind CSS v4  
**Versi Dokumen:** 2.0  
**Tanggal:** 21 Februari 2026  
**Status:** Living Document

---

# 1. LATAR BELAKANG

Aplikasi ini dirancang sebagai sistem manajemen restoran berbasis **SaaS (Software as a Service)** yang memungkinkan banyak restoran (**multi-tenant**) menggunakan satu platform terpusat untuk mengelola operasional mereka — menu, pesanan, kasir (POS), dapur (KDS), laporan keuangan, pengelolaan staf, dan berlangganan layanan.

Sistem ini berbasis web, responsif untuk desktop maupun mobile, dengan desain modern dan intuitif. Restoran cukup mendaftar, memilih paket, dan langsung menggunakan tanpa instalasi.

---

# 2. TUJUAN SISTEM

1. Menyediakan platform manajemen restoran yang mudah digunakan dan siap pakai.
2. Mendukung banyak restoran (multi-tenant) dalam satu infrastruktur.
3. Memberikan kontrol akses berbasis role yang ketat.
4. Menyediakan laporan penjualan dan analitik bisnis secara real-time.
5. Mendukung model berlangganan (subscription) dengan paket berbeda.
6. Memastikan keamanan data tiap tenant terisolasi satu sama lain.
7. Memberikan pengalaman pemesanan modern bagi pelanggan melalui QR Code.

---

# 3. TECH STACK

| Layer | Teknologi | Versi |
|---|---|---|
| Backend Framework | Laravel | 12.x |
| Frontend Framework | React + Vite | 19.x / 6.x |
| Database | MySQL | 8.0+ |
| Auth API | Laravel Sanctum | 4.x |
| CSS Framework | Tailwind CSS | v4 |
| HTTP Client | Axios | 1.x |
| Routing (FE) | React Router | v7 |
| State Management | Zustand | 5.x |
| UI Primitives | shadcn/ui + Radix UI | latest |
| Icons | Lucide React | latest |
| Date Handling | Day.js | latest |
| Form Validation (FE) | React Hook Form + Zod | latest |
| Job Queue | Laravel Queue (database driver) | — |
| Cache | Laravel Cache (file / redis) | — |
| File Storage | Laravel Storage (local / S3) | — |
| Web Server | Nginx | latest stable |
| PHP | PHP-FPM | 8.3+ |
| SSL | Let's Encrypt (Certbot) | — |

---

# 4. ARSITEKTUR SISTEM

### Arsitektur 3-Tier:

```
┌─────────────────────────────────────────────┐
│          PRESENTATION LAYER                 │
│   React SPA (Vite) — Tailwind + shadcn/ui   │
│   Diakses via Browser / Mobile Browser      │
└──────────────────┬──────────────────────────┘
                   │  HTTPS / REST API (JSON)
┌──────────────────▼──────────────────────────┐
│          APPLICATION LAYER                  │
│   Laravel 12 REST API                       │
│   Sanctum Auth · Middleware · Services      │
│   Queue Worker · Scheduler                  │
└──────────────────┬──────────────────────────┘
                   │  Eloquent ORM
┌──────────────────▼──────────────────────────┐
│          DATA LAYER                         │
│   MySQL 8 — Single DB, Shared Tables        │
│   Tenant isolation via restaurant_id        │
│   Storage: Local Disk / S3-compatible       │
└─────────────────────────────────────────────┘
```

### Deployment Topology (1 VPS):

```
Internet → Nginx (reverse proxy + static files)
               ├── /api/*   → PHP-FPM (Laravel)
               └── /*       → React build (dist/)

Background: Queue Worker (Supervisor)
Cron:       Laravel Scheduler (setiap menit)
DB:         MySQL (localhost, port 3306)
```

---

# 5. KONSEP MULTI-TENANT

### Strategi: Shared Database, Shared Schema

| Aspek | Detail |
|---|---|
| Strategi | Single Database, Shared Tables |
| Pemisah data | Kolom `restaurant_id` di setiap tabel tenant |
| Sumber `restaurant_id` | Diambil dari token user yang login (server-side only) |
| Frontend | **Dilarang** mengirim `restaurant_id` di request body |

### Aturan Wajib:

1. Setiap Model tenant-scoped wajib menggunakan **Global Scope** `RestaurantScope`.
2. Middleware `EnsureTenantContext` dijalankan sebelum semua route tenant.
3. Super Admin dikecualikan dari scope tenant.
4. Setiap migrasi tabel tenant wajib memiliki kolom `restaurant_id` + index.
5. Unit test wajib memverifikasi isolasi data antar tenant.

### Contoh Global Scope:

```php
// app/Models/Scopes/RestaurantScope.php
class RestaurantScope implements Scope {
    public function apply(Builder $builder, Model $model): void {
        if (auth()->check() && auth()->user()->role !== 'superadmin') {
            $builder->where('restaurant_id', auth()->user()->restaurant_id);
        }
    }
}
```

---

# 6. ROLE DAN MATRIKS AKSES

## Role yang Tersedia

| Role | Deskripsi |
|---|---|
| `superadmin` | Pengelola platform, akses penuh ke semua tenant |
| `owner` | Pemilik restoran, akses penuh ke tenantnya sendiri |
| `manager` | Asisten owner, tanpa akses subscription & billing |
| `cashier` | Input order, proses pembayaran, cetak invoice |
| `kitchen` | Lihat order masuk, update status masak |
| `customer` | Pesan via QR, lihat status pesanan sendiri |

## Matriks Akses per Fitur

| Fitur | superadmin | owner | manager | cashier | kitchen | customer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Kelola restoran (platform) | ✅ | — | — | — | — | — |
| Suspend / aktifkan tenant | ✅ | — | — | — | — | — |
| Dashboard platform | ✅ | — | — | — | — | — |
| Kelola menu & kategori | — | ✅ | ✅ | — | — | — |
| Kelola staff | — | ✅ | — | — | — | — |
| Kelola meja | — | ✅ | ✅ | — | — | — |
| Input order (POS) | — | ✅ | ✅ | ✅ | — | — |
| Lihat & update order | — | ✅ | ✅ | ✅ | ✅ | own |
| Proses pembayaran | — | ✅ | ✅ | ✅ | — | — |
| Lihat laporan | — | ✅ | ✅ | — | — | — |
| Kelola subscription | ✅ | ✅ | — | — | — | — |
| Settings restoran | — | ✅ | — | — | — | — |
| Pesan via QR | — | — | — | — | — | ✅ |

---

# 7. PERANCANGAN DATABASE

## Prinsip Desain

- Semua tabel tenant menggunakan `restaurant_id` sebagai foreign key + index.
- Harga di `order_items.price_snapshot` adalah **snapshot** saat order dibuat (tidak ikut perubahan harga menu di kemudian hari).
- Soft delete (`deleted_at`) digunakan pada `menu_items`, `menu_categories`, `users`.
- Semua primary key menggunakan `BIGINT UNSIGNED AUTO_INCREMENT`.
- Timezone disimpan di `restaurants.timezone`; semua datetime disimpan dalam UTC.

---

## 7.1 Tabel `restaurants`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | — |
| name | varchar(150) | Nama restoran |
| slug | varchar(100) UNIQUE | URL identifier, contoh: `warung-bu-sari` |
| email | varchar(150) UNIQUE | Email utama restoran |
| phone | varchar(20) | Nomor telepon |
| address | text nullable | Alamat lengkap |
| logo_url | varchar(255) nullable | Path logo |
| timezone | varchar(50) | Default: `Asia/Jakarta` |
| currency | varchar(10) | Default: `IDR` |
| is_active | boolean | Default: true |
| settings | json nullable | Konfigurasi fleksibel: `{tax_rate, service_charge, ...}` |
| created_at / updated_at | timestamp | — |

**Index:** `slug` (unique), `is_active`

---

## 7.2 Tabel `subscription_plans`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | — |
| name | varchar(50) | `basic`, `pro`, `enterprise` |
| price_monthly | decimal(12,2) | Harga per bulan |
| max_staff | int | Batas jumlah staff (0 = unlimited) |
| max_menu_items | int | Batas item menu |
| max_tables | int | Batas meja |
| features | json | Array fitur yang diaktifkan |
| is_active | boolean | Apakah plan masih ditawarkan |
| created_at / updated_at | timestamp | — |

---

## 7.3 Tabel `subscriptions`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | — |
| restaurant_id | bigint FK UNIQUE | Satu restoran satu subscription aktif |
| plan_id | bigint FK | Referensi ke `subscription_plans` |
| status | enum | `trialing`, `active`, `past_due`, `cancelled`, `expired` |
| trial_ends_at | timestamp nullable | Akhir masa trial |
| starts_at | date | Tanggal mulai |
| ends_at | date | Tanggal berakhir |
| cancelled_at | timestamp nullable | Kapan dibatalkan |
| created_at / updated_at | timestamp | — |

**Index:** `restaurant_id` (unique), `status`, `ends_at`

---

## 7.4 Tabel `users`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | — |
| restaurant_id | bigint FK nullable | NULL = superadmin |
| name | varchar(100) | — |
| email | varchar(150) UNIQUE | — |
| email_verified_at | timestamp nullable | — |
| password | varchar(255) | bcrypt hash |
| role | enum | `superadmin`, `owner`, `manager`, `cashier`, `kitchen`, `customer` |
| phone | varchar(20) nullable | — |
| avatar_url | varchar(255) nullable | — |
| is_active | boolean | Default: true |
| remember_token | varchar(100) nullable | — |
| last_login_at | timestamp nullable | — |
| created_at / updated_at | timestamp | — |
| deleted_at | timestamp nullable | Soft delete |

**Index:** `restaurant_id`, `email` (unique), `role`, `is_active`

---

## 7.5 Tabel `restaurant_tables`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | — |
| restaurant_id | bigint FK | — |
| name | varchar(50) | e.g., `Meja 1`, `VIP 01` |
| capacity | tinyint | Kapasitas kursi |
| qr_code | varchar(255) nullable | Path QR code image |
| status | enum | `available`, `occupied`, `reserved` |
| is_active | boolean | Default: true |
| created_at / updated_at | timestamp | — |

**Index:** `restaurant_id`

---

## 7.6 Tabel `menu_categories`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | — |
| restaurant_id | bigint FK | — |
| name | varchar(100) | — |
| description | text nullable | — |
| sort_order | int | Urutan tampil, default 0 |
| is_active | boolean | Default: true |
| created_at / updated_at | timestamp | — |
| deleted_at | timestamp nullable | Soft delete |

**Index:** `restaurant_id`, `sort_order`

---

## 7.7 Tabel `menu_items`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | — |
| restaurant_id | bigint FK | — |
| category_id | bigint FK | — |
| name | varchar(150) | — |
| description | text nullable | — |
| price | decimal(12,2) | — |
| image_url | varchar(255) nullable | — |
| is_available | boolean | Default: true |
| is_featured | boolean | Tampil di sorotan halaman utama |
| preparation_time | tinyint | Estimasi menit masak |
| sort_order | int | Default 0 |
| created_at / updated_at | timestamp | — |
| deleted_at | timestamp nullable | Soft delete |

**Index:** `restaurant_id`, `category_id`, `is_available`

---

## 7.8 Tabel `orders`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | — |
| restaurant_id | bigint FK | — |
| order_number | varchar(20) | Human-readable, unik per tenant, contoh: `ORD-20260221-0001` |
| table_id | bigint FK nullable | Relasi ke `restaurant_tables` |
| customer_id | bigint FK nullable | Role `customer`, nullable untuk walk-in |
| cashier_id | bigint FK nullable | Staff yang memproses |
| order_type | enum | `dine_in`, `take_away`, `delivery` |
| status | enum | `pending` → `confirmed` → `cooking` → `ready` → `completed` / `cancelled` |
| notes | text nullable | Catatan dari customer |
| subtotal | decimal(12,2) | Total sebelum pajak & diskon |
| discount_amount | decimal(12,2) | Default 0 |
| tax_amount | decimal(12,2) | Default 0 |
| total | decimal(12,2) | Final amount |
| payment_status | enum | `unpaid`, `paid`, `refunded` |
| created_at / updated_at | timestamp | — |

**Index:** `restaurant_id`, `status`, `payment_status`, `created_at`, `order_number`, `table_id`

---

## 7.9 Tabel `order_items`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | — |
| order_id | bigint FK | ON DELETE CASCADE |
| menu_item_id | bigint FK | — |
| menu_item_name | varchar(150) | **Snapshot** nama saat order dibuat |
| quantity | smallint UNSIGNED | — |
| price_snapshot | decimal(12,2) | **Snapshot** harga satuan saat order |
| subtotal | decimal(12,2) | quantity × price_snapshot |
| notes | varchar(255) nullable | e.g., "Tanpa bawang" |
| created_at | timestamp | — |

**Index:** `order_id`, `menu_item_id`

---

## 7.10 Tabel `payments`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | — |
| order_id | bigint FK UNIQUE | 1 order = 1 payment record |
| cashier_id | bigint FK nullable | Staff yang memproses |
| method | enum | `cash`, `debit_card`, `credit_card`, `qris`, `transfer` |
| amount | decimal(12,2) | Nominal yang dibayar |
| change_amount | decimal(12,2) | Kembalian (untuk cash), default 0 |
| status | enum | `pending`, `paid`, `failed`, `refunded` |
| transaction_ref | varchar(100) nullable | Nomor referensi / bukti eksternal |
| notes | text nullable | — |
| paid_at | timestamp nullable | — |
| created_at / updated_at | timestamp | — |

**Index:** `order_id` (unique), `status`, `paid_at`

---

## 7.11 Tabel `activity_logs`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | — |
| restaurant_id | bigint nullable | NULL = aktivitas superadmin global |
| user_id | bigint FK nullable | Siapa yang melakukan |
| action | varchar(100) | e.g., `order.created`, `menu.deleted`, `user.login` |
| subject_type | varchar(100) nullable | Polymorphic: nama class model |
| subject_id | bigint nullable | Polymorphic: ID record |
| properties | json nullable | Data before/after perubahan |
| ip_address | varchar(45) nullable | IPv4 / IPv6 |
| user_agent | text nullable | — |
| created_at | timestamp | — |

**Index:** `restaurant_id`, `user_id`, `action`, `created_at`

---

## 7.12 Tabel `password_reset_tokens`

| Kolom | Tipe | Keterangan |
|---|---|---|
| email | varchar(150) PK | — |
| token | varchar(255) | Hashed token |
| created_at | timestamp | — |

---

## 7.13 Tabel `personal_access_tokens` (Sanctum)

Dikelola otomatis oleh Laravel Sanctum. Menyimpan token API tiap user.

---

## 7.14 Tabel `notifications`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | char(36) PK | UUID |
| type | varchar(255) | Class notifikasi |
| notifiable_type | varchar(255) | Polymorphic |
| notifiable_id | bigint | — |
| data | json | Payload notifikasi |
| read_at | timestamp nullable | — |
| created_at / updated_at | timestamp | — |

---

# 8. DESAIN API

### Konvensi

- **Base URL:** `/api/v1/`
- **Format:** JSON
- **Auth:** Bearer Token (Laravel Sanctum)
- **Versioning:** URL path (`/v1/`)

**Error response:**
```json
{
  "success": false,
  "message": "Pesan error yang deskriptif",
  "errors": { "field": ["detail validasi"] }
}
```

**Success response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Berhasil",
  "meta": { "current_page": 1, "last_page": 5, "total": 100 }
}
```

---

## 8.1 Auth

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/auth/register` | public | Daftar restoran baru (otomatis buat restaurant + subscription trial) |
| POST | `/auth/login` | public | Login semua role |
| POST | `/auth/logout` | ✅ | Hapus token aktif |
| GET | `/auth/me` | ✅ | Data user yang sedang login |
| PUT | `/auth/profile` | ✅ | Update nama, avatar, telepon |
| PUT | `/auth/password` | ✅ | Ganti password (perlu password lama) |
| POST | `/auth/forgot-password` | public | Kirim email reset password |
| POST | `/auth/reset-password` | public | Reset password dengan token dari email |

---

## 8.2 Restaurant

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/restaurant` | owner | Detail restoran sendiri |
| PUT | `/restaurant` | owner | Update info restoran |
| POST | `/restaurant/logo` | owner | Upload/ganti logo |
| GET | `/restaurant/settings` | owner | Ambil settings (tax rate, dll) |
| PUT | `/restaurant/settings` | owner | Update settings |

---

## 8.3 Staff Management

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/staff` | owner | List staff |
| POST | `/staff` | owner | Tambah staff baru (cek limit plan) |
| GET | `/staff/{id}` | owner | Detail staff |
| PUT | `/staff/{id}` | owner | Update staff |
| PATCH | `/staff/{id}/toggle` | owner | Aktifkan / nonaktifkan |
| DELETE | `/staff/{id}` | owner | Hapus staff (soft delete) |

---

## 8.4 Tables (Meja)

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/tables` | auth | List meja |
| POST | `/tables` | owner/manager | Tambah meja (cek limit plan) |
| PUT | `/tables/{id}` | owner/manager | Update info meja |
| DELETE | `/tables/{id}` | owner | Hapus meja |
| GET | `/tables/{id}/qr` | owner/manager | Download QR code meja |

---

## 8.5 Menu Categories

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/menu/categories` | auth | List kategori |
| POST | `/menu/categories` | owner/manager | Tambah kategori |
| PUT | `/menu/categories/{id}` | owner/manager | Update kategori |
| DELETE | `/menu/categories/{id}` | owner | Hapus (soft delete) |
| PATCH | `/menu/categories/reorder` | owner/manager | Ubah sort_order |

---

## 8.6 Menu Items

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/menu/items` | auth | List menu (filter: category, available) |
| POST | `/menu/items` | owner/manager | Tambah item (cek limit plan) |
| GET | `/menu/items/{id}` | auth | Detail item |
| PUT | `/menu/items/{id}` | owner/manager | Update item |
| DELETE | `/menu/items/{id}` | owner | Hapus (soft delete) |
| POST | `/menu/items/{id}/image` | owner/manager | Upload gambar |
| PATCH | `/menu/items/{id}/availability` | owner/manager/cashier | Toggle ketersediaan |

---

## 8.7 Orders

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/orders` | non-customer | List order (filter: status, tanggal, tipe) |
| POST | `/orders` | cashier/customer | Buat order baru |
| GET | `/orders/{id}` | auth | Detail order |
| PATCH | `/orders/{id}/status` | cashier/kitchen | Update status (state machine) |
| DELETE | `/orders/{id}` | cashier/owner | Cancel (hanya jika belum paid) |
| GET | `/orders/{id}/invoice` | auth | Tampilkan invoice HTML |

---

## 8.8 Payments

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| POST | `/payments` | cashier/owner | Proses pembayaran order |
| GET | `/payments/{id}` | auth | Detail pembayaran |
| PATCH | `/payments/{id}/refund` | owner | Refund pembayaran |

---

## 8.9 Kitchen Display

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/kitchen/orders` | kitchen/cashier | Order aktif (pending, confirmed, cooking) |
| PATCH | `/kitchen/orders/{id}/status` | kitchen | Update: confirmed → cooking → ready |

---

## 8.10 Reports

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/reports/dashboard` | owner/manager | Stats hari ini |
| GET | `/reports/sales` | owner/manager | Penjualan (filter tanggal) |
| GET | `/reports/sales/daily` | owner/manager | Rekapan per hari |
| GET | `/reports/sales/monthly` | owner/manager | Rekapan per bulan |
| GET | `/reports/top-products` | owner/manager | Produk terlaris |
| GET | `/reports/staff-performance` | owner | Performa per kasir |
| GET | `/reports/export` | owner | Export CSV / Excel |

---

## 8.11 Subscription

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/subscription/plans` | public | List semua paket |
| GET | `/subscription` | owner | Info subscription aktif |
| POST | `/subscription/subscribe` | owner | Subscribe ke paket |
| POST | `/subscription/renew` | owner | Perpanjang langganan |
| POST | `/subscription/cancel` | owner | Batalkan langganan |

---

## 8.12 Super Admin

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/admin/stats` | superadmin | Statistik platform |
| GET | `/admin/restaurants` | superadmin | List semua restoran |
| GET | `/admin/restaurants/{id}` | superadmin | Detail restoran |
| PATCH | `/admin/restaurants/{id}/status` | superadmin | Aktifkan / suspend |
| GET | `/admin/subscriptions` | superadmin | Semua subscription |
| GET | `/admin/logs` | superadmin | Activity logs platform |

---

## 8.13 Public (Customer via QR Code) — Tanpa Auth

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/public/{slug}/menu` | Lihat menu restoran |
| POST | `/public/{slug}/orders` | Buat pesanan (self-order) |
| GET | `/public/orders/{token}` | Cek status pesanan |

---

# 9. KEAMANAN

## 9.1 Authentication & Authorization

| Mekanisme | Detail |
|---|---|
| Token Auth | Laravel Sanctum (SPA cookie-based + Bearer token) |
| Password hashing | Bcrypt, min 8 karakter, 1 huruf besar, 1 angka (rule opsional) |
| Role Guard | Middleware `EnsureRoleMiddleware` per route group |
| Resource Policy | Laravel Policies untuk ownership check (bukan hanya role) |
| Tenant Guard | Global Scope + `EnsureTenantContext` middleware |

## 9.2 Input Validation & Sanitization

- Semua input server-side divalidasi via **Laravel FormRequest** — tidak ada validasi di Controller langsung.
- Client-side: **Zod + React Hook Form** (defense in depth, bukan pengganti server validasi).
- Semua output HTML di-escape otomatis oleh React (JSX).
- File upload: validasi MIME type server-side, rename dengan `Str::uuid()`, simpan di storage (bukan public root).
- **Tidak boleh ada raw query** `DB::statement()` tanpa parameterized binding.

## 9.3 Rate Limiting

```php
RateLimiter::for('auth', fn($req) =>
    Limit::perMinute(5)->by($req->ip())->response(fn() =>
        response()->json(['message' => 'Terlalu banyak percobaan, coba lagi dalam 1 menit.'], 429)
    )
);
RateLimiter::for('api', fn($req) =>
    Limit::perMinute(60)->by(optional($req->user())->id ?: $req->ip())
);
```

| Endpoint | Limit |
|---|---|
| `POST /auth/login` | 5 req / menit per IP |
| `POST /auth/forgot-password` | 3 req / menit per IP |
| API umum | 60 req / menit per user / IP |
| `POST /public/{slug}/orders` | 10 req / menit per IP |

## 9.4 HTTPS & Transport Security

- HTTPS wajib di production (Let's Encrypt via Certbot, auto-renew).
- HSTS header aktif: `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- Sanctum CSRF cookie untuk SPA.
- CORS: hanya whitelist domain frontend yang sudah ditentukan di `config/cors.php`.

## 9.5 Security Headers (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

## 9.6 Database Security

- Foreign key constraint aktif di **semua relasi**.
- `DB::transaction()` wajib di `OrderService::create()` dan `PaymentService::process()`.
- DB user Laravel hanya punya hak akses INSERT, SELECT, UPDATE, DELETE ke satu database saja.
- Backup otomatis harian dengan retensi 30 hari.

## 9.7 Audit Logging

Semua aksi penting dicatat ke `activity_logs`:

| Aksi | Dicatat oleh |
|---|---|
| Login / Logout | AuthController |
| Buat / Edit / Hapus Menu | MenuObserver |
| Buat Order | OrderService |
| Proses Pembayaran | PaymentService |
| Suspend Tenant | AdminController |
| Ganti Password | ProfileController |
| Perubahan Subscription | SubscriptionService |

Data yang dicatat: `action`, `properties` (before/after), `ip_address`, `user_agent`.  
Log **tidak bisa dihapus** oleh tenant (hanya superadmin via direct DB).

## 9.8 Tenant Isolation Checklist

- [ ] Global Scope `RestaurantScope` aktif di semua model tenant.
- [ ] `restaurant_id` **tidak pernah** diambil dari request body.
- [ ] Setiap controller validasi ownership resource sebelum update/delete.
- [ ] Feature test memverifikasi tenant A tidak bisa akses data tenant B.
- [ ] Seeder test membuat 2 tenant berbeda dengan data terisolasi.

---

# 10. STRUKTUR BACKEND (LARAVEL)

```
backend/
├── app/
│   ├── Console/Commands/           # Artisan commands kustom
│   ├── Exceptions/Handler.php      # Custom error → JSON response
│   ├── Http/
│   │   ├── Controllers/API/
│   │   │   ├── Auth/
│   │   │   │   ├── AuthController.php
│   │   │   │   └── ProfileController.php
│   │   │   ├── Admin/
│   │   │   │   └── AdminController.php
│   │   │   ├── Menu/
│   │   │   │   ├── CategoryController.php
│   │   │   │   └── ItemController.php
│   │   │   ├── Order/
│   │   │   │   ├── OrderController.php
│   │   │   │   └── KitchenController.php
│   │   │   ├── Payment/
│   │   │   │   └── PaymentController.php
│   │   │   ├── Report/
│   │   │   │   └── ReportController.php
│   │   │   ├── Restaurant/
│   │   │   │   ├── RestaurantController.php
│   │   │   │   └── TableController.php
│   │   │   ├── Staff/
│   │   │   │   └── StaffController.php
│   │   │   ├── Subscription/
│   │   │   │   └── SubscriptionController.php
│   │   │   └── Public/
│   │   │       └── PublicMenuController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureRoleMiddleware.php
│   │   │   ├── EnsureTenantContext.php
│   │   │   └── CheckSubscriptionActive.php
│   │   ├── Requests/               # FormRequest per endpoint
│   │   └── Resources/              # API Resource transformasi output
│   ├── Models/
│   │   ├── Scopes/RestaurantScope.php
│   │   ├── Restaurant.php
│   │   ├── User.php
│   │   ├── Subscription.php
│   │   ├── SubscriptionPlan.php
│   │   ├── RestaurantTable.php
│   │   ├── MenuCategory.php
│   │   ├── MenuItem.php
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   ├── Payment.php
│   │   └── ActivityLog.php
│   ├── Services/
│   │   ├── OrderService.php
│   │   ├── PaymentService.php
│   │   ├── ReportService.php
│   │   ├── SubscriptionService.php
│   │   └── QrCodeService.php
│   ├── Policies/                   # Laravel Policies per resource
│   └── Observers/                  # Model Observers → audit log
├── database/
│   ├── migrations/
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── SuperAdminSeeder.php
│       └── SubscriptionPlanSeeder.php
├── routes/
│   └── api.php
└── tests/
    ├── Feature/
    └── Unit/
```

### Prinsip:

- **FormRequest** untuk semua input validation — tidak validasi di controller.
- **Service Layer** untuk business logic — controller hanya orchestrate.
- **DB::transaction()** wajib di `OrderService` dan `PaymentService`.
- **API Resource** untuk semua output — tidak return model langsung.
- **Events & Listeners** untuk side effects (notifikasi, logging).
- **Model Observer** untuk otomatis mencatat `activity_logs`.

---

# 11. STRUKTUR FRONTEND (REACT + VITE)

```
frontend/
├── src/
│   ├── app/
│   │   ├── router.tsx              # React Router v7
│   │   └── providers.tsx           # Semua Provider wrapper
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── AppShell.tsx        # Layout utama (sidebar + topbar)
│   │   │   ├── Sidebar.tsx
│   │   │   └── ProtectedRoute.tsx  # Auth + role guard
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── ImageUpload.tsx
│   │       └── StatusBadge.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   └── usePagination.ts
│   ├── lib/
│   │   ├── axios.ts                # Axios instance + interceptor 401
│   │   ├── utils.ts                # cn(), formatCurrency()
│   │   └── validators/             # Zod schemas per form
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── menu/
│   │   │   ├── Categories.tsx
│   │   │   └── Items.tsx
│   │   ├── orders/
│   │   │   ├── OrderList.tsx
│   │   │   └── OrderDetail.tsx
│   │   ├── pos/
│   │   │   └── POS.tsx             # Point of Sale
│   │   ├── kitchen/
│   │   │   └── KitchenDisplay.tsx  # Kitchen Display System
│   │   ├── reports/
│   │   │   └── Reports.tsx
│   │   ├── staff/
│   │   │   └── Staff.tsx
│   │   ├── tables/
│   │   │   └── Tables.tsx
│   │   ├── settings/
│   │   │   └── Settings.tsx
│   │   ├── subscription/
│   │   │   └── Subscription.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── Restaurants.tsx
│   │   └── public/
│   │       ├── PublicMenu.tsx      # QR scan menu
│   │       └── OrderStatus.tsx     # Cek status pesanan
│   ├── stores/
│   │   ├── authStore.ts            # user, token, isLoading
│   │   ├── cartStore.ts            # items, total, tableId, orderType
│   │   └── notificationStore.ts
│   └── types/
│       ├── auth.ts
│       ├── menu.ts
│       ├── order.ts
│       └── report.ts
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Prinsip:

- **Zustand** untuk global state (auth session, POS cart).
- **React Hook Form + Zod** untuk semua form input.
- **Axios interceptor:** otomatis attach Bearer token + handle 401 → logout.
- **ProtectedRoute:** cek auth + role sebelum render halaman.
- Waktu ditampilkan dalam timezone restoran (dari `authStore`).
- POS cart di-persist ke `sessionStorage` (anti-kehilangan saat refresh).

---

# 12. ALUR SISTEM

## 12.1 Alur Registrasi & Onboarding

```
1. Owner buka /register
2. Isi: nama, email, password, nama restoran
3. POST /api/v1/auth/register
   Backend atomic: buat User (owner) → buat Restaurant → buat Subscription (trialing, 14 hari)
4. Login otomatis → redirect /dashboard
5. Tampilkan onboarding wizard:
   Step 1: Lengkapi info restoran (alamat, telepon, logo)
   Step 2: Tambah kategori menu pertama
   Step 3: Tambah item menu pertama
   Step 4: Tambah meja pertama (generate QR)
```

## 12.2 Alur Login

```
1. User buka /login
2. Isi email + password → POST /api/v1/auth/login
3. Backend: validasi → buat Sanctum token → return {token, user}
4. Frontend: simpan di Zustand authStore (cookie/localStorage)
5. Redirect berdasarkan role:
   superadmin  → /admin/dashboard
   owner       → /dashboard
   manager     → /dashboard
   cashier     → /pos
   kitchen     → /kitchen
```

## 12.3 Alur POS & Pemesanan

```
1. Cashier buka /pos
2. Pilih tipe order (dine-in / take-away)
3. Jika dine-in: pilih meja dari daftar available
4. Browse menu per kategori → klik item → masuk cart
5. Cart: ubah quantity, tambah notes per item, lihat subtotal + pajak + total
6. Klik "Buat Order" → POST /api/v1/orders
   Backend DB::transaction:
     - INSERT orders (generate order_number)
     - INSERT order_items (snapshot nama + harga)
     - Hitung subtotal, tax, total
     - Update table.status = occupied (jika dine-in)
7. Redirect ke halaman pembayaran
```

## 12.4 Alur Pembayaran

```
1. Cashier di /payment?order={id}
2. Lihat ringkasan order + total
3. Pilih metode bayar
4. Jika cash: input nominal → hitung kembalian otomatis
5. Konfirmasi → POST /api/v1/payments
   Backend DB::transaction:
     - INSERT payments (status: paid)
     - UPDATE orders.payment_status = paid
     - UPDATE orders.status = completed
     - UPDATE table.status = available (jika dine-in)
     - INSERT activity_log
6. Tampilkan halaman invoice (printable)
```

## 12.5 Alur Kitchen Display System

```
1. Kitchen buka /kitchen (polling setiap 30 detik)
2. Tampil card per order dengan status "confirmed" dan "cooking"
3. Kitchen klik "Mulai Masak":
   PATCH /api/v1/kitchen/orders/{id}/status { status: cooking }
4. Selesai dimasak, klik "Siap":
   PATCH /api/v1/kitchen/orders/{id}/status { status: ready }
5. Cashier / customer otomatis ternotifikasi (via polling / notif)
```

## 12.6 Alur QR Code Customer

```
1. Pelanggan scan QR di meja (sudah ada table_id di URL)
2. Buka /public/{slug}/menu?table={table_id}
3. Lihat menu tanpa login → pilih item → isi nama pemesan
4. Submit → POST /api/v1/public/{slug}/orders
   Backend: buat order dengan customer_name (guest), status: pending
5. Response: { order_token }
6. Pelanggan diarahkan ke /public/orders/{token}
7. Polling status setiap 20 detik
```

---

# 13. PAKET BERLANGGANAN

| Fitur | Trial (14 hari) | Basic | Pro | Enterprise |
|---|:---:|:---:|:---:|:---:|
| Harga / bulan | Gratis | Rp 99.000 | Rp 249.000 | Rp 599.000 |
| Maks staff | 3 | 5 | 20 | Unlimited |
| Maks item menu | 30 | 50 | 200 | Unlimited |
| Maks meja | 5 | 10 | 50 | Unlimited |
| Laporan basic | ✅ | ✅ | ✅ | ✅ |
| Laporan advanced | — | — | ✅ | ✅ |
| Export laporan | — | — | ✅ | ✅ |
| QR Code menu | ✅ | ✅ | ✅ | ✅ |
| Priority support | — | — | — | ✅ |

> Jika subscription expired: akses readonly (lihat order & laporan saja, tidak bisa buat order atau edit menu).

---

# 14. NON-FUNCTIONAL REQUIREMENTS

| Kategori | Target |
|---|---|
| Response API (rata-rata) | < 500ms |
| Response API (p95) | < 1.000ms |
| Order throughput | Min. 1.000 order/hari per tenant |
| Availability | 99% uptime SLA |
| Concurrent users | Min. 50 user bersamaan per tenant |
| Image upload | Maks 2MB, format: JPG, PNG, WebP |
| Code standard (PHP) | PSR-12 |
| Code standard (JS/TS) | ESLint Airbnb |
| Test coverage | Min. 70% (feature + unit test backend) |
| API dokumentasi | Postman Collection tersedia |
| Backup | Harian otomatis, retensi 30 hari |
| Error monitoring | Sentry (opsional, Phase 7) |

---

# 15. STRUKTUR FOLDER PROJECT

```
RestoApp/                   ← root folder (workspace ini)
├── backend/                ← Laravel 12
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── tests/
│   ├── .env.example
│   └── ...
├── frontend/               ← React + Vite
│   ├── src/
│   ├── public/
│   ├── .env.example
│   └── ...
├── nginx.conf              ← Konfigurasi Nginx production
└── perancangan.md          ← Dokumen ini
```

---

# 16. ROADMAP PENGEMBANGAN — PER PHASE

---

## Phase 1 — Foundation & Auth
**Estimasi: 1–2 minggu**  
**Goal:** Project bisa dijalankan, user bisa register & login, data terisolasi per tenant.

### Backend
- [ ] Init project Laravel 12 (`composer create-project`)
- [ ] Konfigurasi `.env` (DB, mail, storage)
- [ ] Buat **semua migrasi** sekaligus (seluruh 14 tabel)
- [ ] Seeders: `SuperAdminSeeder`, `SubscriptionPlanSeeder`
- [ ] Install & konfigurasi Laravel Sanctum
- [ ] `POST /auth/register` — buat User + Restaurant + Subscription (trial) dalam satu transaction
- [ ] `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- [ ] `PUT /auth/profile`, `PUT /auth/password`
- [ ] `POST /auth/forgot-password`, `POST /auth/reset-password`
- [ ] Middleware: `EnsureRoleMiddleware`, `EnsureTenantContext`
- [ ] Global Scope `RestaurantScope` + boot di semua model tenant
- [ ] `ApiResponse` trait/helper untuk standar JSON response
- [ ] Rate limiting untuk endpoint auth
- [ ] Feature test: login, register, tenant isolation

### Frontend
- [ ] Init project React + Vite (`npm create vite@latest`)
- [ ] Install Tailwind CSS v4, shadcn/ui, React Router v7, Zustand, Axios, React Hook Form, Zod
- [ ] Setup Axios instance + interceptor (401 → logout, attach Bearer token)
- [ ] Setup `authStore` (Zustand)
- [ ] `ProtectedRoute` component (cek auth + role)
- [ ] `AppShell` layout dengan Sidebar per role
- [ ] Halaman: **Login**, **Register**, **Forgot Password**, **Reset Password**
- [ ] Auth flow: simpan token → redirect by role

**Output:** User bisa daftar, login, dan sistem multi-tenant berfungsi.

---

## Phase 2 — Menu Management
**Estimasi: 1 minggu**  
**Goal:** Owner bisa kelola menu lengkap, customer bisa lihat via QR.

### Backend
- [ ] CRUD `menu_categories` (soft delete, reorder sort_order)
- [ ] CRUD `menu_items` (soft delete, upload gambar ke storage)
- [ ] Toggle `is_available` menu item
- [ ] CRUD `restaurant_tables` + generate QR code (`SimpleSoftwareIO/simple-qrcode`)
- [ ] Update info & settings restoran
- [ ] Upload logo restoran
- [ ] Endpoint public: `GET /public/{slug}/menu`
- [ ] Enforce limit plan: cek `max_menu_items`, `max_tables` saat create
- [ ] Feature test: CRUD menu + tenant isolation + limit plan

### Frontend
- [ ] Halaman: **Menu Categories** (tabel + form tambah/edit + drag reorder)
- [ ] Halaman: **Menu Items** (tabel + form + upload gambar + toggle availability)
- [ ] Halaman: **Meja** (grid + form + tombol download QR)
- [ ] Halaman: **Settings Restoran** (info + logo upload)
- [ ] Halaman publik: `/public/:slug/menu` (tampil menu tanpa login, responsif mobile)

**Output:** Restoran bisa setup menu, customer bisa scan QR dan lihat menu.

---

## Phase 3 — Order & POS System
**Estimasi: 1–2 minggu**  
**Goal:** Cashier bisa input order, kitchen bisa update status masak.

### Backend
- [ ] `POST /orders` dengan `DB::transaction` (buat order + order_items + snapshot harga)
- [ ] Auto-generate `order_number` unik per tenant
- [ ] `GET /orders` dengan filter (status, tanggal, order_type, table_id)
- [ ] `PATCH /orders/{id}/status` (state machine validation)
- [ ] `DELETE /orders/{id}` (cancel, hanya jika belum paid)
- [ ] `GET /kitchen/orders` + `PATCH /kitchen/orders/{id}/status`
- [ ] `POST /public/{slug}/orders` (guest self-order via QR)
- [ ] `GET /public/orders/{token}` (cek status)
- [ ] Event `OrderCreated` (extensible untuk notifikasi)
- [ ] Feature test: full order flow + kitchen flow + tenant isolation

### Frontend
- [ ] Halaman **POS**: grid menu per kategori + cart panel
  - Cart: tambah/kurang/hapus, notes per item, subtotal + pajak + total
  - Pilih meja (modal) + tipe order
  - Submit order → redirect ke Payment
- [ ] Halaman **Order List**: tabel + filter status + badge warna
- [ ] Halaman **Order Detail**: items, total, status timeline
- [ ] Halaman **Kitchen Display**: card order, update status (Mulai Masak / Siap), auto-refresh 30 detik
- [ ] Halaman publik: **self-order** (cart sederhana + form nama) + **cek status** (polling 20 detik)

**Output:** Alur order end-to-end berjalan (POS → Kitchen → Selesai).

---

## Phase 4 — Payment & Invoice
**Estimasi: 1 minggu**  
**Goal:** Pembayaran diproses, invoice bisa dicetak.

### Backend
- [ ] `POST /payments` dengan `DB::transaction`
- [ ] Auto-hitung `change_amount` (untuk cash)
- [ ] Update `orders.payment_status = paid` dan `orders.status = completed`
- [ ] Update `restaurant_tables.status = available` setelah bayar (dine-in)
- [ ] `PATCH /payments/{id}/refund` (owner only)
- [ ] `GET /orders/{id}/invoice` → HTML printable
- [ ] Feature test: payment flow + refund

### Frontend
- [ ] Halaman **Payment**: ringkasan order, pilih metode, input nominal, hitung kembalian
- [ ] Konfirmasi + success screen
- [ ] **Invoice viewer** (HTML printable, `Ctrl+P` / tombol cetak)
- [ ] Halaman riwayat pembayaran (owner/manager)

**Output:** Alur kasir lengkap end-to-end dengan invoice.

---

## Phase 5 — Reports & Dashboard
**Estimasi: 1 minggu**  
**Goal:** Owner/manager bisa pantau performa bisnis.

### Backend
- [ ] `GET /reports/dashboard` — stats hari ini (revenue, order count, top menu)
- [ ] `GET /reports/sales` — filter rentang tanggal
- [ ] `GET /reports/sales/daily` dan `/monthly`
- [ ] `GET /reports/top-products` — top N item terlaris
- [ ] `GET /reports/staff-performance` — revenue per cashier
- [ ] `GET /reports/export` — export Excel (`maatwebsite/excel`)
- [ ] Cache hasil report 5 menit (`Cache::remember`)
- [ ] Feature test: laporan + export

### Frontend
- [ ] **Dashboard**: cards (revenue hari ini, total order, order pending, top item) + chart penjualan 7 hari (Recharts)
- [ ] **Halaman Reports**: date range picker, chart bar, tabel detail
- [ ] **Top Products**: leaderboard item terlaris
- [ ] Tombol **Export Excel / CSV**

**Output:** Owner bisa pantau bisnis dari dashboard.

---

## Phase 6 — Subscription & Super Admin
**Estimasi: 1 minggu**  
**Goal:** Sistem berlangganan berjalan, limit per plan diterapkan, Super Admin aktif.

### Backend
- [ ] CRUD Subscription endpoints (detail, plans, subscribe, renew, cancel)
- [ ] Middleware `CheckSubscriptionActive` → blokir mutasi jika expired
- [ ] Enforce limit plan: cek sebelum create staff, menu item, meja
- [ ] Scheduled Job: kirim email notifikasi H-7 sebelum expired (`php artisan schedule:run`)
- [ ] Super Admin: list restoran, detail, suspend/aktifkan
- [ ] Super Admin: stats platform (total restoran, revenue, dll)
- [ ] Super Admin: activity logs viewer
- [ ] Feature test: subscription flow + limit enforcement

### Frontend
- [ ] Halaman **Subscription**: info plan aktif, sisa hari, progress bar, tombol renew/upgrade
- [ ] Halaman **Plans**: kartu paket berlangganan + CTA
- [ ] Banner peringatan (jika subscription ≤ 7 hari atau expired)
- [ ] **Super Admin Dashboard**: stats platform + grafik
- [ ] **Super Admin Restaurants**: tabel semua restoran + filter + tombol suspend/aktifkan
- [ ] **Super Admin Logs**: tabel activity logs

**Output:** Sistem SaaS berjalan penuh end-to-end.

---

## Phase 7 — Security Hardening & Production Ready
**Estimasi: 1 minggu**  
**Goal:** Aplikasi siap production, aman, dan teruji.

### Security Audit
- [ ] Review semua endpoint: role check + tenant scope terpasang
- [ ] Review semua FormRequest: tidak ada validasi yang terlewat
- [ ] Aktifkan security headers di Nginx
- [ ] OWASP Top 10 manual checklist
- [ ] CORS whitelist domain production
- [ ] Review semua file upload: MIME check + path traversal safe
- [ ] Pastikan semua audit log tercatat lengkap

### Quality & Testing
- [ ] Lengkapi Feature Test (target ≥ 70% coverage)
- [ ] Setup ESLint + Prettier (frontend)
- [ ] Review konsistensi semua API response
- [ ] Buat Postman Collection lengkap
- [ ] Load test sederhana (k6 / Artillery — 50 RPS selama 60 detik)

### DevOps & Deployment
- [ ] Script deployment ke VPS (Nginx + PHP-FPM + Supervisor untuk queue worker)
- [ ] Setup `laravel/scheduler` via cron (`* * * * * php artisan schedule:run`)
- [ ] Konfigurasi Nginx (`nginx.conf`) untuk backend + frontend
- [ ] Setup backup MySQL otomatis harian (cron + compress + upload ke storage)
- [ ] Template `.env.production` (dengan semua variabel yang dibutuhkan)
- [ ] Setup log rotation (Laravel + Nginx)

**Output:** Aplikasi production-ready, aman, dan terdokumentasi.

---

# 17. ER DIAGRAM

```mermaid
erDiagram
    restaurants {
        bigint id PK
        string name
        string slug UK
        string email UK
        string timezone
        string currency
        boolean is_active
        json settings
    }

    subscription_plans {
        bigint id PK
        string name
        decimal price_monthly
        int max_staff
        int max_menu_items
        int max_tables
        json features
    }

    subscriptions {
        bigint id PK
        bigint restaurant_id FK_UK
        bigint plan_id FK
        enum status
        date starts_at
        date ends_at
        timestamp trial_ends_at
    }

    users {
        bigint id PK
        bigint restaurant_id FK_NULLABLE
        string name
        string email UK
        string password
        enum role
        boolean is_active
        timestamp deleted_at
    }

    restaurant_tables {
        bigint id PK
        bigint restaurant_id FK
        string name
        tinyint capacity
        string qr_code
        enum status
    }

    menu_categories {
        bigint id PK
        bigint restaurant_id FK
        string name
        int sort_order
        boolean is_active
        timestamp deleted_at
    }

    menu_items {
        bigint id PK
        bigint restaurant_id FK
        bigint category_id FK
        string name
        decimal price
        boolean is_available
        boolean is_featured
        tinyint preparation_time
        timestamp deleted_at
    }

    orders {
        bigint id PK
        bigint restaurant_id FK
        string order_number
        bigint table_id FK_NULLABLE
        bigint customer_id FK_NULLABLE
        bigint cashier_id FK_NULLABLE
        enum order_type
        enum status
        decimal subtotal
        decimal tax_amount
        decimal discount_amount
        decimal total
        enum payment_status
    }

    order_items {
        bigint id PK
        bigint order_id FK
        bigint menu_item_id FK
        string menu_item_name
        smallint quantity
        decimal price_snapshot
        decimal subtotal
        string notes
    }

    payments {
        bigint id PK
        bigint order_id FK_UK
        bigint cashier_id FK_NULLABLE
        enum method
        decimal amount
        decimal change_amount
        enum status
        string transaction_ref
        timestamp paid_at
    }

    activity_logs {
        bigint id PK
        bigint restaurant_id NULLABLE
        bigint user_id FK_NULLABLE
        string action
        json properties
        string ip_address
        timestamp created_at
    }

    restaurants ||--|| subscriptions : "has (1:1)"
    subscription_plans ||--|{ subscriptions : "defines (1:N)"
    restaurants ||--|{ users : "employs (1:N)"
    restaurants ||--|{ restaurant_tables : "has (1:N)"
    restaurants ||--|{ menu_categories : "owns (1:N)"
    restaurants ||--|{ menu_items : "owns (1:N)"
    restaurants ||--|{ orders : "receives (1:N)"
    restaurants ||--|{ activity_logs : "generates (1:N)"
    menu_categories ||--|{ menu_items : "contains (1:N)"
    restaurant_tables ||--|{ orders : "assigned in (1:N)"
    users ||--|{ orders : "places (1:N)"
    users ||--|{ activity_logs : "performs (1:N)"
    orders ||--|| payments : "has (1:1)"
    orders ||--|{ order_items : "contains (1:N)"
    menu_items ||--|{ order_items : "referenced in (1:N)"
```
