# Production Deployment & Backup/Recovery Guide

This document outlines the recommended deployment procedures, environment configuration, database maintenance, backup/restore strategy, and process management for the KaushalSaathi Tracker.

---

## 1. System Architecture

```
[ Clients / Mobile / Browsers ]
             │ (HTTPS - Port 443)
             ▼
      [ NGINX Reverse Proxy ]
             │ (HTTP - Port 5000)
             ▼
     [ Node.js / Express Server (PM2) ]
             │ (Port 5432)
             ▼
     [ PostgreSQL Database Cluster ]
```

---

## 2. Environment Setup

### Environment Variables Matrix

| Variable | Description | Example (Production) | Sensitive? |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@db.host:5432/kaushalsaathi_prod?schema=public` | **YES** |
| `JWT_SECRET` | Cryptographic secret for signing tokens | High-entropy random string (64+ chars) | **YES** |
| `PORT` | Node.js listening port | `5000` | No |
| `NODE_ENV` | Runtime environment | `production` | No |
| `GOOGLE_FORM_WEBHOOK_SECRET` | Secret token for Google Form Webhook | High-entropy random string | **YES** |
| `CORS_ORIGIN` | Allowed CORS frontend origins | `https://app.kaushalsaathi.com` | No |

---

## 3. Database Deployment & Migration Procedure

### Applying Migrations in Production

DO NOT use `npx prisma migrate dev` in production. Always run `prisma migrate deploy`:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Zero-Downtime Database Deployment Rules
1. Never execute `prisma migrate reset` in production.
2. Never delete migration files in `prisma/migrations`.
3. Test all migrations on a staging copy of production data prior to release.

---

## 4. Database Backup & Recovery Strategy

### Automated Nightly Backup (pg_dump)

Run a nightly cron job on the database server:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/kaushalsaathi"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR
pg_dump -h localhost -U postgres -d kaushalsaathi_tracker | gzip > $FILENAME

# Retain backups for 30 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
```

### Database Restoration Procedure

To restore from a backup:

```bash
# 1. Terminate active database connections
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'kaushalsaathi_tracker';"

# 2. Restore database
gunzip -c /var/backups/kaushalsaathi/db_backup_YYYYMMDD_HHMMSS.sql.gz | psql -U postgres -d kaushalsaathi_tracker
```

---

## 5. Reverse Proxy Configuration (NGINX + HTTPS)

Sample NGINX configuration snippet:

```nginx
server {
    listen 443 ssl http2;
    server_name app.kaushalsaathi.com;

    ssl_certificate /etc/letsencrypt/live/app.kaushalsaathi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.kaushalsaathi.com/privkey.pem;

    # Static Frontend
    location / {
        root /var/www/kaushalsaathi/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. Process Management (PM2)

Start backend service with PM2:

```bash
cd backend
pm2 start src/server.js --name "kaushalsaathi-backend" -i max
pm2 save
pm2 startup
```

Health check verification:
```bash
curl -i https://app.kaushalsaathi.com/api/health
```
