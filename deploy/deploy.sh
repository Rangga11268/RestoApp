#!/usr/bin/env bash
# ============================================================
# RestoApp — VPS Deployment Script
# Usage  : bash deploy.sh [--skip-frontend] [--skip-migrate]
# Prereq : SSH access to VPS, .env already configured on server
# ============================================================

set -euo pipefail

# ── Configuration ────────────────────────────────────────────
APP_DIR="/var/www/restoapp"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
NGINX_WEBROOT="$FRONTEND_DIR/dist"
PHP_BIN="php8.3"
ARTISAN="$PHP_BIN $BACKEND_DIR/artisan"
BRANCH="${DEPLOY_BRANCH:-main}"

# Flags
SKIP_FRONTEND=false
SKIP_MIGRATE=false

for arg in "$@"; do
  case $arg in
    --skip-frontend) SKIP_FRONTEND=true ;;
    --skip-migrate)  SKIP_MIGRATE=true  ;;
  esac
done

# ── Helpers ──────────────────────────────────────────────────
info()  { echo -e "\033[0;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[0;32m[OK]\033[0m    $*"; }
warn()  { echo -e "\033[0;33m[WARN]\033[0m  $*"; }
die()   { echo -e "\033[0;31m[ERROR]\033[0m $*" >&2; exit 1; }

# ── Step 1 — Pull latest code ────────────────────────────────
info "Pulling latest code from branch '$BRANCH' ..."
cd "$APP_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
ok "Code updated."

# ── Step 2 — Backend dependencies ───────────────────────────
info "Installing PHP dependencies (no-dev) ..."
cd "$BACKEND_DIR"
composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader
ok "Composer done."

# ── Step 3 — Database migrations ────────────────────────────
if [ "$SKIP_MIGRATE" = false ]; then
  info "Running database migrations ..."
  $ARTISAN migrate --force
  ok "Migrations complete."
fi

# ── Step 4 — Cache / optimise Laravel ───────────────────────
info "Caching config, routes, events & views ..."
$ARTISAN config:cache
$ARTISAN route:cache
$ARTISAN event:cache
$ARTISAN view:cache
ok "Laravel caches rebuilt."

# ── Step 5 — Storage link ────────────────────────────────────
info "Ensuring storage symlink exists ..."
$ARTISAN storage:link --force 2>/dev/null || true
ok "Storage link OK."

# ── Step 6 — Queue worker restart ───────────────────────────
info "Restarting queue workers ..."
$ARTISAN queue:restart
ok "Queue workers will restart on next job."

# ── Step 7 — Frontend build ──────────────────────────────────
if [ "$SKIP_FRONTEND" = false ]; then
  info "Building frontend ..."
  cd "$FRONTEND_DIR"
  npm ci --silent
  npm run build
  ok "Frontend built → $NGINX_WEBROOT"
else
  warn "Frontend build skipped (--skip-frontend)."
fi

# ── Step 8 — File permissions ────────────────────────────────
info "Setting file permissions ..."
chown -R www-data:www-data "$BACKEND_DIR/storage" "$BACKEND_DIR/bootstrap/cache"
chmod -R 775 "$BACKEND_DIR/storage" "$BACKEND_DIR/bootstrap/cache"
ok "Permissions set."

# ── Step 9 — Reload Nginx ────────────────────────────────────
info "Reloading Nginx ..."
nginx -t && systemctl reload nginx
ok "Nginx reloaded."

# ── Done ─────────────────────────────────────────────────────
echo ""
ok "=========================================="
ok " RestoApp deployed successfully!"
ok "=========================================="
