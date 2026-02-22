#!/usr/bin/env bash
# ============================================================
# RestoApp — MySQL Database Backup Script
# Recommended cron : 0 2 * * * /var/www/restoapp/deploy/backup.sh
# ============================================================

set -euo pipefail

# ── Configuration ────────────────────────────────────────────
DB_NAME="restoapp_prod"
DB_USER="restoapp_user"
DB_PASS="CHANGE_ME_STRONG_PASSWORD"   # or use ~/.my.cnf to avoid plain-text
DB_HOST="127.0.0.1"
DB_PORT="3306"

BACKUP_DIR="/var/backups/restoapp"
RETAIN_DAYS=30
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="restoapp_${TIMESTAMP}.sql.gz"
FILEPATH="$BACKUP_DIR/$FILENAME"

# Optionally upload to S3 (requires aws-cli)
S3_BUCKET=""   # e.g. "s3://my-restoapp-backups/db/" — leave empty to skip

# ── Helpers ──────────────────────────────────────────────────
info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO]  $*"; }
ok()   { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [OK]    $*"; }
die()  { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $*" >&2; exit 1; }

# ── Ensure backup directory exists ───────────────────────────
mkdir -p "$BACKUP_DIR"
chmod 750 "$BACKUP_DIR"

# ── Dump & Compress ──────────────────────────────────────────
info "Starting backup: $FILENAME"

mysqldump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --add-drop-table \
    "$DB_NAME" | gzip -9 > "$FILEPATH"

FILESIZE=$(du -sh "$FILEPATH" | cut -f1)
ok "Backup created: $FILEPATH ($FILESIZE)"

# ── Upload to S3 (optional) ──────────────────────────────────
if [ -n "$S3_BUCKET" ]; then
  info "Uploading to S3: $S3_BUCKET"
  aws s3 cp "$FILEPATH" "$S3_BUCKET$FILENAME" --storage-class STANDARD_IA
  ok "Uploaded to S3."
fi

# ── Remove old backups ───────────────────────────────────────
info "Cleaning backups older than ${RETAIN_DAYS} days ..."
find "$BACKUP_DIR" -name "restoapp_*.sql.gz" -mtime +"$RETAIN_DAYS" -delete
ok "Old backups removed."

# ── Verify latest backup is non-empty ───────────────────────
if [ ! -s "$FILEPATH" ]; then
  die "Backup file is empty! Check mysqldump output."
fi

ok "Backup complete: $FILEPATH"
