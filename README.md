# 🍽 RestoApp — SaaS Manajemen Restoran

Platform manajemen restoran berbasis SaaS (Software as a Service) multi-tenant yang memungkinkan pemilik restoran mengelola menu, pesanan, meja, staf, dan laporan keuangan dalam satu platform terintegrasi.

---

## Tech Stack

| Layer        | Teknologi                      |
| ------------ | ------------------------------ |
| **Backend**  | Laravel 12, PHP 8.3, MySQL 8   |
| **Auth**     | Laravel Sanctum (Bearer Token) |
| **Frontend** | React 19 + TypeScript, Vite    |
| **Styling**  | Tailwind CSS v4                |
| **State**    | Zustand 5                      |
| **Form**     | React Hook Form + Zod          |
| **HTTP**     | Axios                          |
| **Icons**    | Lucide React                   |
| **Routing**  | React Router v7                |

---

## Fitur Utama

- 🏢 **Multi-tenant** — satu platform, banyak restoran (isolasi penuh via `restaurant_id`)
- 👥 **Multi-role** — Superadmin, Owner, Manager, Cashier, Kitchen, Customer
- 📦 **Subscription Plan** — Trial (14 hari), Basic, Pro, Enterprise
- 🛒 **POS & Order Management** — dine-in, takeaway, delivery
- 📱 **QR Code Ordering** — pelanggan scan meja → pesan langsung
- 🧾 **Laporan Keuangan** — omzet harian/bulanan, export PDF/Excel
- 🔐 **Keamanan** — rate limiting, audit log, tenant isolation, HTTPS-ready

---

## Struktur Proyek

```
RestoApp/
├── backend/          # Laravel 12 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/API/
│   │   │   ├── Middleware/
│   │   │   ├── Requests/
│   │   │   └── Traits/
│   │   ├── Models/
│   │   │   ├── Scopes/       # RestaurantScope (tenant isolation)
│   │   │   └── Traits/       # BelongsToRestaurant
│   │   └── Providers/
│   ├── database/
│   │   ├── migrations/       # 13 tabel
│   │   └── seeders/
│   └── routes/
│       └── api.php           # /api/v1/*
│
├── frontend/         # React + Vite
│   └── src/
│       ├── components/       # ProtectedRoute, AppShell
│       ├── lib/              # axios instance, utils
│       ├── pages/
│       │   ├── auth/         # Login, Register, ForgotPassword, ResetPassword
│       │   └── app/          # Dashboard, ...
│       ├── stores/           # Zustand authStore
│       └── types/            # TypeScript types
│
└── perancangan.md    # Dokumen perancangan lengkap sistem
```

---

## Fase Pengembangan

| Fase        | Status  | Deskripsi                                              |
| ----------- | ------- | ------------------------------------------------------ |
| **Phase 1** | ✅ Done | Foundation — Auth, Multi-tenant, Subscription          |
| **Phase 2** | ✅ Done | Menu & Kategori CRUD                                   |
| **Phase 3** | ✅ Done | Manajemen Meja & QR Code                               |
| **Phase 4** | ✅ Done | POS & Order Management                                 |
| **Phase 5** | ✅ Done | Pembayaran & Laporan Keuangan                          |
| **Phase 6** | ✅ Done | Superadmin Panel                                       |
| **Phase 7** | ✅ Done | Security Hardening, Feature Tests, DevOps & Deployment |

> **Status:** Backend API 100% selesai, 63 feature tests passing. Frontend sedang dalam tahap finishing UI — poles tampilan, penggantian ikon, dan penambahan fitur kecil sebelum launch.

---

## Setup & Instalasi

### Prasyarat

- PHP 8.3+, Composer 2.x
- Node.js 20+, npm 10+
- MySQL 8.0+
- Laragon / XAMPP / manual

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Konfigurasi `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=restosaas
DB_USERNAME=root
DB_PASSWORD=

SUPERADMIN_EMAIL=superadmin@restosaas.id
SUPERADMIN_PASSWORD=GantiPasswordIni!
```

```bash
php artisan migrate
php artisan db:seed
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Buka **http://localhost:5173**

---

## API Endpoints

Base URL: `http://localhost:8000/api/v1`

### Auth

| Method | Endpoint                | Auth | Deskripsi                            |
| ------ | ----------------------- | ---- | ------------------------------------ |
| `POST` | `/auth/register`        | ❌   | Daftar restoran baru + trial 14 hari |
| `POST` | `/auth/login`           | ❌   | Login, dapat Bearer token            |
| `POST` | `/auth/logout`          | ✅   | Logout, revoke token                 |
| `GET`  | `/auth/me`              | ✅   | Data user + restoran + subscription  |
| `PUT`  | `/auth/profile`         | ✅   | Update nama/telepon/avatar           |
| `PUT`  | `/auth/password`        | ✅   | Ganti password                       |
| `POST` | `/auth/forgot-password` | ❌   | Kirim link reset                     |
| `POST` | `/auth/reset-password`  | ❌   | Reset password via token             |

### Menu

| Method   | Endpoint                  | Auth | Deskripsi             |
| -------- | ------------------------- | ---- | --------------------- |
| `GET`    | `/menu/categories`        | ✅   | List kategori         |
| `POST`   | `/menu/categories`        | ✅   | Tambah kategori       |
| `PUT`    | `/menu/categories/{id}`   | ✅   | Update kategori       |
| `DELETE` | `/menu/categories/{id}`   | ✅   | Hapus kategori (soft) |
| `GET`    | `/menu/items`             | ✅   | List item menu        |
| `POST`   | `/menu/items`             | ✅   | Tambah item menu      |
| `PUT`    | `/menu/items/{id}`        | ✅   | Update item menu      |
| `PATCH`  | `/menu/items/{id}/toggle` | ✅   | Toggle aktif/nonaktif |
| `DELETE` | `/menu/items/{id}`        | ✅   | Hapus item (soft)     |

### Meja & QR Code

| Method   | Endpoint                     | Auth | Deskripsi                 |
| -------- | ---------------------------- | ---- | ------------------------- |
| `GET`    | `/tables`                    | ✅   | List meja                 |
| `POST`   | `/tables`                    | ✅   | Tambah meja + generate QR |
| `PUT`    | `/tables/{id}`               | ✅   | Update meja               |
| `DELETE` | `/tables/{id}`               | ✅   | Hapus meja                |
| `POST`   | `/tables/{id}/regenerate-qr` | ✅   | Generate ulang QR code    |

### Pesanan (Order)

| Method  | Endpoint               | Auth | Deskripsi                    |
| ------- | ---------------------- | ---- | ---------------------------- |
| `GET`   | `/orders`              | ✅   | List pesanan (filter status) |
| `POST`  | `/orders`              | ✅   | Buat pesanan baru            |
| `GET`   | `/orders/{id}`         | ✅   | Detail pesanan               |
| `PATCH` | `/orders/{id}/status`  | ✅   | Update status pesanan        |
| `POST`  | `/orders/{id}/payment` | ✅   | Proses pembayaran            |

### Laporan

| Method | Endpoint                | Auth | Deskripsi            |
| ------ | ----------------------- | ---- | -------------------- |
| `GET`  | `/reports/daily`        | ✅   | Laporan harian       |
| `GET`  | `/reports/monthly`      | ✅   | Laporan bulanan      |
| `GET`  | `/reports/export/pdf`   | ✅   | Export laporan PDF   |
| `GET`  | `/reports/export/excel` | ✅   | Export laporan Excel |

### Staf

| Method   | Endpoint             | Auth  | Deskripsi            |
| -------- | -------------------- | ----- | -------------------- |
| `GET`    | `/staff`             | Owner | List staf            |
| `POST`   | `/staff`             | Owner | Tambah staf          |
| `PUT`    | `/staff/{id}`        | Owner | Update staf          |
| `PATCH`  | `/staff/{id}/toggle` | Owner | Aktifkan/nonaktifkan |
| `DELETE` | `/staff/{id}`        | Owner | Hapus staf (soft)    |

### Subscription

| Method | Endpoint                  | Auth  | Deskripsi              |
| ------ | ------------------------- | ----- | ---------------------- |
| `GET`  | `/subscription/plans`     | ✅    | List plan tersedia     |
| `GET`  | `/subscription/current`   | ✅    | Status langganan aktif |
| `POST` | `/subscription/subscribe` | Owner | Berlangganan plan      |
| `POST` | `/subscription/cancel`    | Owner | Batalkan langganan     |

### Superadmin

| Method  | Endpoint                                  | Superadmin | Deskripsi             |
| ------- | ----------------------------------------- | ---------- | --------------------- |
| `GET`   | `/superadmin/stats`                       | ✅         | Statistik platform    |
| `GET`   | `/superadmin/restaurants`                 | ✅         | List semua restoran   |
| `GET`   | `/superadmin/restaurants/{id}`            | ✅         | Detail restoran       |
| `PATCH` | `/superadmin/restaurants/{id}/suspend`    | ✅         | Suspend restoran      |
| `PATCH` | `/superadmin/restaurants/{id}/reactivate` | ✅         | Reaktivasi restoran   |
| `GET`   | `/superadmin/logs`                        | ✅         | Activity log platform |

### Contoh Response

```json
{
  "success": true,
  "message": "Berhasil",
  "data": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@resto.com",
    "role": "owner",
    "restaurant": {
      "id": 1,
      "name": "Warung Sate Pak Budi",
      "slug": "warung-sate-pak-budi"
    },
    "subscription": {
      "status": "trialing",
      "ends_at": "2026-03-07",
      "days_remaining": 14,
      "plan": "Basic"
    }
  }
}
```

---

## Role & Akses

| Role         | Akses                                   |
| ------------ | --------------------------------------- |
| `superadmin` | Semua restoran, kelola plan & langganan |
| `owner`      | Full akses restoran sendiri             |
| `manager`    | Menu, pesanan, laporan, staf            |
| `cashier`    | POS, pesanan, pembayaran                |
| `kitchen`    | Lihat & update status pesanan dapur     |
| `customer`   | Pesan via QR code                       |

---

## Testing

```bash
cd backend
vendor/bin/phpunit
```

63 tests, 143 assertions — semua passing ✅

| Test File          | Tests | Coverage                                       |
| ------------------ | ----- | ---------------------------------------------- |
| `AuthTest`         | 10    | Register, login, logout, me, profile, password |
| `MenuTest`         | 9     | Kategori & item CRUD, tenant isolation         |
| `OrderTest`        | 4     | Create, list, status update, isolation         |
| `SubscriptionTest` | 8     | Plans, subscribe, cancel, expired guard        |
| `StaffTest`        | 10    | CRUD, role restriction, isolation              |
| `SuperAdminTest`   | 7     | Stats, restaurants, logs, suspend              |
| `TableTest`        | 6     | CRUD, QR generate, isolation                   |

---

## Roadmap ke Depan

> Project belum dilaunching — ada beberapa penyesuaian sebelum produksi:

- [ ] Poles UI/UX frontend (layout, responsiveness, loading state)
- [ ] Ganti ikon Lucide yang terlalu generic dengan ikon lebih tepat konteks
- [ ] Penambahan fitur kecil sesuai feedback
- [ ] Setup domain & hosting production
- [ ] Onboarding restoran pertama

---

## Lisensi

MIT License — bebas digunakan untuk keperluan pembelajaran dan produksi.
