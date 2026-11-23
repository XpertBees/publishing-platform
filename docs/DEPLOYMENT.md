# Deployment — The Daily Pulse

## Prerequisites

- Node.js 20+ and npm 10+
- Docker Engine + Docker Compose v2 (for the containerised deploy)
- MySQL 8.4 and Redis 7 (only for a manual deploy; Compose provides both)
- A domain with TLS, and a reverse proxy (nginx / Caddy / a cloud load
  balancer) in front of the web service
- AdSense client ID and Google Analytics measurement ID for production
  (configure in Admin → Settings, or via `NEXT_PUBLIC_ADSENSE_CLIENT_ID` /
  `NEXT_PUBLIC_GA_MEASUREMENT_ID`)

## Environment variables

Copy `.env.example` to `.env` at the repository root and fill in real values.
Never commit real secrets.

| Variable                                                            | Used by         | Default / notes                                                                                                                                    |
| ------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                          | api, web        | `development` locally, `production` in containers                                                                                                  |
| `PORT`                                                              | api             | `4000`                                                                                                                                             |
| `API_BASE_URL`                                                      | api             | `http://localhost:4000`                                                                                                                            |
| `WEB_BASE_URL`                                                      | api             | `http://localhost:3000`                                                                                                                            |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD`       | api             | `localhost` / `3306` / `daily_pulse` / `daily_pulse` / — (Compose overrides `DB_HOST` to `mysql`)                                                  |
| `DB_ROOT_PASSWORD`                                                  | compose (mysql) | root password for MySQL 8.4                                                                                                                        |
| `REDIS_URL`                                                         | api             | `redis://localhost:6379` (Compose: `redis://redis:6379`)                                                                                           |
| `JWT_SECRET` / `JWT_REFRESH_SECRET`                                 | api             | long random strings; access tokens live 15m (`JWT_EXPIRES_IN`), refresh tokens 7d (`JWT_REFRESH_EXPIRES_IN`)                                       |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME`      | api seed        | super-admin created by `npm run seed` only                                                                                                         |
| `RSS_POLL_INTERVAL_MINUTES`                                         | api             | `15`                                                                                                                                               |
| `STORAGE_DRIVER` / `UPLOAD_DIR`                                     | api             | `local` / `./uploads` in dev; S3-compatible settings (`S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`) in prod |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | api             | optional in dev                                                                                                                                    |
| `NEXT_PUBLIC_API_URL`                                               | web             | `http://localhost:4000/api/v1`                                                                                                                     |
| `NEXT_PUBLIC_SITE_URL`                                              | web             | `http://localhost:3000`                                                                                                                            |
| `NEXT_PUBLIC_SITE_NAME`                                             | web             | `The Daily Pulse`                                                                                                                                  |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID`                                     | web             | `ca-pub-…` (empty in dev)                                                                                                                          |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`                                     | web             | `G-…` (empty in dev)                                                                                                                               |

## Docker Compose deploy (recommended)

```bash
cp .env.example .env        # fill in secrets first
cd infrastructure/docker
docker compose up -d --build
```

This starts MySQL 8.4 (port 3306, volume `mysql_data`, healthcheck via
`mysqladmin ping`), Redis 7 (port 6379, volume `redis_data`), the API (port
4000, waits for MySQL healthy + Redis), and the web app (port 3000, waits
for the API). The api/web builds use the repository root as context so
`packages/shared` is available; before building, copy
`infrastructure/docker/.dockerignore` to the repository root as
`.dockerignore` (Docker only reads it from the build-context directory).

Then run migrations and seed data (one-off, against the running API
container):

```bash
docker compose exec api npm run db:migrate
docker compose exec api npm run db:seed
# or, if the API exposes the seed script:
docker compose exec api npm run seed
```

Check health:

```bash
curl http://localhost:4000/api/v1/health
curl http://localhost:3000/
docker compose ps
docker compose logs -f api web
```

## Manual deploy (no Docker)

```bash
npm ci
# MySQL 8.4 + Redis 7 must already be running and reachable; set DB_* / REDIS_URL in .env
npm run build:api
npm run build:web
cd apps/api && npm run db:migrate && npm run db:seed && cd ../..
# start (use pm2 / systemd in production):
npm run start --workspace=@daily-pulse/api &
npm run start --workspace=@daily-pulse/web &
```

Local development instead:

```bash
npm run dev:api   # Express on :4000 (tsx watch)
npm run dev:web   # Next.js on :3000
```

## Database: migrate + seed

- `npm run db:migrate --workspace=@daily-pulse/api` — runs Sequelize
  migrations in `apps/api/src/migrations` against MySQL 8.4.
- `npm run db:seed --workspace=@daily-pulse/api` — runs seeders
  (categories, an RSS source, settings, super admin).
- `npm run seed --workspace=@daily-pulse/api` — creates the super admin from
  `SEED_ADMIN_*`.
- Roll back one migration: `npm run db:migrate:undo --workspace=@daily-pulse/api`.

## Reverse-proxy notes

- Terminate TLS at the proxy; forward `Host` and `X-Forwarded-Proto`.
- Web (Next.js) on `3000`, API on `4000`. The browser only talks to the web
  app; the API is reached server-side (proxy route handlers) and by the web
  server for public reads, so the API does not need to be public — but keep
  `/api/v1/health` reachable for monitoring if you want external checks.
- Auth cookies are `httpOnly` + `sameSite=lax` and are set with `Secure` in
  production, so the site must be served over HTTPS in production.
- Cache static assets (`/_next/static`) aggressively at the proxy/CDN.

## Backups

- **MySQL 8.4**: nightly `mysqldump` (or a managed snapshot) of the
  `daily_pulse` database; test restores regularly. The Compose volume
  `mysql_data` holds the data directory — back it up before upgrades.
- **Uploads**: back up the `UPLOAD_DIR` (local disk) or the S3 bucket,
  depending on `STORAGE_DRIVER`.
- **Redis**: ephemeral job state only; no backup needed. Jobs are
  re-enqueued on restart.
- **Config**: keep `.env` in a secrets manager; the repo only ships
  `.env.example`.
