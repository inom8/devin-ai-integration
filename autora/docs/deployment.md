# Autora — Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on the server
- A domain name pointing to your server (e.g., `admin.autora.uz`, `api.autora.uz`)
- SSL certificate (via Let's Encrypt / Certbot or a reverse proxy like Caddy/Traefik)

## Quick Start (Production)

### 1. Clone and configure

```bash
git clone https://github.com/inom8/devin-ai-integration.git
cd devin-ai-integration/autora

# Copy and fill in environment variables
cp .env.production.example .env
nano .env   # Fill in ALL [REQUIRED] values
```

### 2. Generate secrets

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate strong passwords for PostgreSQL and Redis
openssl rand -base64 24
```

### 3. Build and start all services

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This starts:
- **PostgreSQL** — Database (internal, not exposed to host)
- **Redis** — Cache/sessions (internal, not exposed to host)
- **Backend** — Node.js API on port 4000 (internal), auto-runs Prisma migrations on startup
- **Admin** — Nginx serving the React admin panel on port 80 (exposed), proxies `/api/` to backend

### 4. Seed the admin user

```bash
docker compose -f docker-compose.prod.yml exec backend \
  npx ts-node prisma/seed.ts
```

This creates:
- An admin user with the phone/password from `ADMIN_PHONE` / `ADMIN_PASSWORD` in `.env`
- Default service categories (Oil Change, Diagnostics, Maintenance, etc.)

### 5. Verify deployment

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Check backend health
curl http://localhost/api/health

# Check logs
docker compose -f docker-compose.prod.yml logs -f backend
```

## Architecture

```
┌─────────────────────────────────────────┐
│              Internet                    │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │    Nginx (Admin Panel)           │   │
│  │    Port 80 / 443                 │   │
│  │                                  │   │
│  │  Static files: /usr/share/nginx  │   │
│  │  /api/* → proxy to backend:4000  │   │
│  │  /socket.io/* → proxy (WebSocket)│   │
│  └────────────┬─────────────────────┘   │
│               │                          │
│  ┌────────────▼─────────────────────┐   │
│  │    Backend API (Node.js)         │   │
│  │    Port 4000 (internal)          │   │
│  │                                  │   │
│  │  Express + Socket.IO             │   │
│  │  Prisma ORM                      │   │
│  └────┬───────────────┬─────────────┘   │
│       │               │                  │
│  ┌────▼────┐   ┌──────▼──────┐          │
│  │PostgreSQL│   │    Redis    │          │
│  │  :5432   │   │    :6379   │          │
│  └──────────┘   └────────────┘          │
└─────────────────────────────────────────┘
```

## SSL / HTTPS Setup

### Option A: Reverse proxy with Caddy (recommended)

Install Caddy on the host and add to `/etc/caddy/Caddyfile`:

```
admin.autora.uz {
    reverse_proxy localhost:80
}
```

Change `ADMIN_PORT` in `.env` to `8080` to avoid port conflict, then `caddy reload`.

### Option B: Certbot with Nginx

Replace the admin Nginx container with a custom config that includes SSL, or use a separate Nginx/Traefik on the host that terminates SSL and proxies to the Docker services.

## Database Management

```bash
# Run migrations manually
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Open Prisma Studio (for debugging, not recommended in production)
docker compose -f docker-compose.prod.yml exec backend npx prisma studio

# Create a database backup
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres autora > backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres autora < backup_20240101.sql
```

## Updating

```bash
cd devin-ai-integration/autora

# Pull latest code
git pull origin autora/main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f --tail=50
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_USER` | No | PostgreSQL username (default: `postgres`) |
| `POSTGRES_PASSWORD` | **Yes** | PostgreSQL password |
| `POSTGRES_DB` | No | Database name (default: `autora`) |
| `REDIS_PASSWORD` | **Yes** | Redis password |
| `JWT_SECRET` | **Yes** | JWT signing secret (64+ chars) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `ADMIN_PORT` | No | Host port for admin panel (default: `80`) |
| `ESKIZ_EMAIL` | For SMS | Eskiz.uz API email |
| `ESKIZ_PASSWORD` | For SMS | Eskiz.uz API password |
| `FIREBASE_PROJECT_ID` | For push | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | For push | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | For push | Firebase private key |
| `PAYME_MERCHANT_ID` | For payments | Payme merchant ID |
| `PAYME_SECRET_KEY` | For payments | Payme secret key |
| `CLICK_MERCHANT_ID` | For payments | Click merchant ID |
| `CLICK_SERVICE_ID` | For payments | Click service ID |
| `CLICK_SECRET_KEY` | For payments | Click secret key |
| `ADMIN_PHONE` | For seed | Admin user phone number |
| `ADMIN_PASSWORD` | For seed | Admin user password |
| `ADMIN_NAME` | For seed | Admin user display name |

## Monitoring

```bash
# Real-time logs
docker compose -f docker-compose.prod.yml logs -f

# Container resource usage
docker compose -f docker-compose.prod.yml stats

# Check backend health
curl -s http://localhost/api/health | jq .
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check `docker compose logs backend` — usually missing env vars or DB connection |
| Admin shows blank page | Verify `VITE_API_URL` was set during build, check browser console for JS errors |
| API returns 401 | Token expired — re-login. Check `JWT_SECRET` hasn't changed |
| Database migration fails | Check `DATABASE_URL` is correct and PostgreSQL is running |
| CORS errors in browser | Add the admin domain to `CORS_ORIGINS` in `.env` |
