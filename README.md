# The Daily Pulse

**The Daily Pulse** is a multi-niche publishing and monetisation platform:
original reporting and curated news across Lifestyle, Personal Finance,
Technology and Breaking News — with affiliate links, house banners, digital
product sales and a newsletter, all managed from a built-in admin dashboard.

## Stack

- **Web:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3.4
- **API:** Express 4, Sequelize 6, MySQL 8.4, Redis 7 + BullMQ (RSS jobs)
- **Shared contract:** `packages/shared` — types, zod schemas, RBAC
  (`ROLE_PERMISSIONS`, `PERMISSIONS`); both apps import from
  `@daily-pulse/shared`
- **Tooling:** npm workspaces, Prettier, ESLint

## Monorepo structure

```
.
├── apps/
│   ├── web/                  # Next.js front end (public site + /admin)
│   │   ├── app/(public)/     # public pages
│   │   ├── app/(auth)/login  # admin sign-in
│   │   ├── app/admin/        # admin dashboard + modules
│   │   ├── app/api/          # auth + proxy route handlers
│   │   ├── components/       # ui primitives, admin, public, ads
│   │   └── lib/              # api.ts (public reads), admin-api.ts (admin client)
│   └── api/                  # Express API (Sequelize models, migrations, seeders, jobs)
├── packages/shared/          # shared types, zod schemas, RBAC
├── infrastructure/docker/    # Dockerfile.api, Dockerfile.web, docker-compose.yml
└── docs/                     # ARCHITECTURE.md, API.md, DEPLOYMENT.md
```

## Quickstart

### Docker (recommended)

```bash
cp .env.example .env   # fill in secrets (DB passwords, JWT secrets)
cd infrastructure/docker
docker compose up -d --build
docker compose exec api npm run db:migrate
docker compose exec api npm run db:seed
```

- Web: http://localhost:3000
- API health: http://localhost:4000/api/v1/health
- Admin: http://localhost:3000/admin (sign in with the seeded super admin)

### Local development

```bash
npm ci
# start MySQL 8.4 + Redis 7 (or `docker compose up -d mysql redis` from infrastructure/docker)
npm run dev:api   # Express on :4000
npm run dev:web   # Next.js on :3000
```

## Environment variables

See `.env.example` for the full list. The important ones:

| Variable                                                         | Purpose                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`        | MySQL 8.4 connection                                          |
| `REDIS_URL`                                                      | Redis 7 (BullMQ queues)                                       |
| `JWT_SECRET`, `JWT_REFRESH_SECRET`                               | Access (15m) / refresh (7d) token signing                     |
| `NEXT_PUBLIC_API_URL`                                            | API base URL for the web app (`http://localhost:4000/api/v1`) |
| `NEXT_PUBLIC_SITE_URL`                                           | Public site URL                                               |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`                        | Seeded super-admin login                                      |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Monetisation IDs (empty in dev)                               |

## Scripts

| Command                                   | What it does                            |
| ----------------------------------------- | --------------------------------------- |
| `npm run dev`                             | Run api + web in watch/dev mode         |
| `npm run build`                           | Build both workspaces                   |
| `npm run build:api` / `npm run build:web` | Build one workspace                     |
| `npm run lint`                            | Lint workspaces                         |
| `npm run format`                          | Prettier check                          |
| `npm run seed`                            | Create the super admin (`SEED_ADMIN_*`) |
| `npm run test`                            | Run workspace tests                     |

API workspace extras: `npm run db:migrate`, `npm run db:migrate:undo`,
`npm run db:seed` (run with `--workspace=@daily-pulse/api`).

## API docs

See [docs/API.md](docs/API.md) for the endpoint reference
(`GET /api/v1/health`, auth, posts, categories, tags, RSS, banners,
affiliates, products, orders, newsletter, comments, media, authors,
redirects, SEO/site settings, analytics, admin overview, users).
Interactive docs are served by the API via Swagger UI when running.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Docker Compose deploy,
environment table, manual deploy steps, `db:migrate` + `db:seed`,
reverse-proxy notes and backups. Architecture is in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Notes

- **MySQL 8.4 + Sequelize** — relational data, migrations in
  `apps/api/src/migrations`; no MongoDB anywhere.
- **Redis + BullMQ** — RSS polling jobs and background work; Redis holds no
  durable data.
- **Auth** — JWT access (15 min) + refresh (7 d) tokens, stored in httpOnly
  cookies by the Next.js auth routes; the browser never sees tokens. RBAC is
  enforced by the API; the admin sidebar only hides sections cosmetically.
- **AdSense / GA** — set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` and
  `NEXT_PUBLIC_GA_MEASUREMENT_ID`, or fill them in via Admin → Settings.
- **No WordPress** — this is a from-scratch Next.js + Express platform.
