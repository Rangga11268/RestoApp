# Phase 1: Performa — Optimasi Query, Caching, Lazy Loading

## Overview
Optimasi performa backend & frontend: eliminasi N+1 queries, tambah index DB, cache data panas, analisa bundle size, dan lazy loading komponen berat.

## Task List

### Task 1: Backend — N+1 Query Audit & Fix
- [ ] Audit eager loading di semua controller
- [ ] Fix missing `with()` / `load()` relasi

### Task 2: Backend — Database Index Optimization
- [ ] Audit kolom yang sering di WHERE/JOIN/ORDER BY tanpa index
- [ ] Migration tambah index

### Task 3: Backend — Caching Strategy
- [ ] Cache restaurant settings
- [ ] Cache menu categories & items (read-heavy, rare update)
- [ ] Pastikan cache di-invalidasi saat update

### Task 4: Frontend — Bundle Analysis & Code Splitting
- [ ] Cek bundle size dengan `vite build --report`
- [ ] Optimasi import (tree-shaking, dynamic import)
- [ ] Lazy loading komponen dialog/modal berat

### Task 5: Frontend — Render Optimization
- [ ] React.memo untuk komponen daftar (order list, menu items)
- [ ] useMemo untuk kalkulasi mahal (laporan, filtering)
- [ ] Debounce search input

### Task 6: Asset Optimization
- [ ] lazy loading + dimensi gambar
- [ ] Font display swap

## Verification
- [ ] `php artisan test` (minus SQLite)
- [ ] `npx tsc --noEmit` clean
- [ ] Bundle size tidak bertambah drastis
