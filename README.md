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

| Fase        | Status  | Deskripsi                                     |
| ----------- | ------- | --------------------------------------------- |
| **Phase 1** | ✅ Done | Foundation — Auth, Multi-tenant, Subscription |
| **Phase 2** | 🔄 Next | Menu & Kategori CRUD                          |
| **Phase 3** | ⏳      | Manajemen Meja & QR Code                      |
| **Phase 4** | ⏳      | POS & Order Management                        |
| **Phase 5** | ⏳      | Pembayaran & Laporan                          |
| **Phase 6** | ⏳      | Superadmin Panel                              |
| **Phase 7** | ⏳      | Polish, Testing, Deploy                       |

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

## API Endpoints (Phase 1)

Base URL: `http://localhost:8000/api/v1`

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

## Lisensi

MIT License — bebas digunakan untuk keperluan pembelajaran dan produksi.
