# Phase 2: Finishing UI

## Overview
Polish UI: error handling untuk data gagal load, pagination menu items, dan perbaikan UX kecil.

## Task List

### Task 1: Error State — Halaman kritis
- [ ] CategoriesPage — tampilkan alert jika fetch gagal
- [ ] MenuItemsPage — tampilkan alert jika fetch gagal
- [ ] TablesPage — tampilkan alert jika fetch gagal
- [ ] StaffPage — tampilkan alert jika fetch gagal
- [ ] SettingsPage — tampilkan alert jika fetch gagal

### Task 2: Pagination — MenuItemsPage
- [ ] Tambah pagination component (reuse dari OrdersPage)
- [ ] Kirim `per_page` & `page` ke API
- [ ] Tampilkan page control di bawah grid

### Task 3: UX Polish
- [ ] Toast notifikasi sukses setelah create/update/delete action
- [ ] Konfirmasi sebelum delete (reuse dari StaffPage pattern)
- [ ] Loading skeleton di Cards (reuse dari DashboardPage pattern)

## Verification
- [ ] `npx tsc --noEmit` clean
- [ ] `npx vite build` sukses
