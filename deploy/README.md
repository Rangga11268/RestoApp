# RestoApp — Deployment Guide

## Prerequisites

| Requirement | Version          |
| ----------- | ---------------- |
| Ubuntu      | 22.04 LTS        |
| Nginx       | 1.24+            |
| PHP         | 8.3 + php8.3-fpm |
| MySQL       | 8.0+             |
| Redis       | 7+               |
| Node.js     | 20 LTS           |
| Composer    | 2.x              |
| Supervisor  | 4.x              |
| Certbot     | latest           |

---

## Server Setup (first time)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/restoapp.git /var/www/restoapp
```

### 2. Configure environment

```bash
cp /var/www/restoapp/deploy/.env.production /var/www/restoapp/backend/.env
# Edit .env and fill in all CHANGE_ME values
nano /var/www/restoapp/backend/.env

php8.3 artisan key:generate
```

### 3. Install Nginx config

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/restoapp
sudo ln -s /etc/nginx/sites-available/restoapp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Obtain SSL certificate

```bash
sudo certbot --nginx -d restoapp.com -d www.restoapp.com
```

### 5. Install Supervisor config

```bash
sudo cp deploy/supervisor.conf /etc/supervisor/conf.d/restoapp.conf
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start restoapp-queue-default:*
```

### 6. Set up log rotation

```bash
sudo cp deploy/logrotate.conf /etc/logrotate.d/restoapp
sudo logrotate --debug /etc/logrotate.d/restoapp   # test
```

### 7. Schedule backups (cron)

```bash
sudo crontab -e
# Add:
# Run backup daily at 02:00
0 2 * * * /bin/bash /var/www/restoapp/deploy/backup.sh >> /var/log/restoapp-backup.log 2>&1
```

### 8. Schedule Laravel tasks

```bash
crontab -e -u www-data
# Add:
* * * * * cd /var/www/restoapp/backend && php8.3 artisan schedule:run >> /dev/null 2>&1
```

---

## Deploying Updates

```bash
cd /var/www/restoapp
bash deploy/deploy.sh
```

### Flags

| Flag              | Effect                          |
| ----------------- | ------------------------------- |
| `--skip-frontend` | Skip `npm ci` + `npm run build` |
| `--skip-migrate`  | Skip `php artisan migrate`      |

Example (skip frontend rebuild if only backend changed):

```bash
bash deploy/deploy.sh --skip-frontend
```

---

## File Reference

| File              | Purpose                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `nginx.conf`      | Nginx virtual host — HTTPS, SPA fallback, API proxy, security headers |
| `deploy.sh`       | Full deployment shell script                                          |
| `supervisor.conf` | Supervisor config for Laravel queue workers                           |
| `.env.production` | Environment variable template (copy to backend `.env`)                |
| `backup.sh`       | Daily MySQL dump + gzip + optional S3 upload                          |
| `logrotate.conf`  | Log rotation for Laravel, Nginx, Supervisor logs                      |

---

## Monitoring

```bash
# Queue worker status
sudo supervisorctl status

# Nginx status
sudo systemctl status nginx

# Laravel logs (live)
tail -f /var/www/restoapp/backend/storage/logs/laravel.log

# DB backup history
ls -lh /var/backups/restoapp/
```
