# Architecture — The Daily Pulse

## System diagram (text)

```
                    ┌────────────────────┐
                    │  Reader (browser)  │
                    └──────┬──────┬──────┘
                           │      │  (public pages, /go/<slug>)
                           ▼      │
              ┌────────────────────────┐
              │  Next.js web (apps/web)│  port 3000
              │  App Router, React 19  │
              │  / (public)  /admin    │
              │  /api/auth/* /api/proxy│
              └──────┬──────┬──────────┘
                     │      │ Bearer via httpOnly cookies
                     ▼      ▼
              ┌────────────────────────┐     ┌──────────────┐
              │  Express API (apps/api)│────▶│ MySQL 8.4    │
              │  /api/v1, JWT + RBAC   │     │ (Sequelize)  │
              │  RSS jobs (BullMQ)     │────▶│ Redis 7      │
              └────────────────────────┘     └──────────────┘
```

## Monorepo module map

| Path                    | Contents                                                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`              | Next.js 15 App Router front end. Public pages under `app/(public)`, admin under `app/admin`, auth under `app/(auth)`. Route handlers under `app/api` proxy to the API. |
| `apps/api`              | Express API, Sequelize models/migrations/seeders, BullMQ queues, RSS ingestion jobs.                                                                                   |
| `packages/shared`       | Single source of truth: types, zod schemas, `ROLE_PERMISSIONS`, `PERMISSIONS`, `slugify`. Both apps import from `@daily-pulse/shared`. Never duplicate these shapes.   |
| `infrastructure/docker` | `Dockerfile.api`, `Dockerfile.web`, `docker-compose.yml`, `.dockerignore`.                                                                                             |
| `docs`                  | `ARCHITECTURE.md` (this file), `API.md` (endpoint reference), `DEPLOYMENT.md` (operations).                                                                            |

## Data flow

1. **Public reads.** Server Components in `apps/web` call the API directly with
   `lib/api.ts` (`apiFetch`), which hits `${NEXT_PUBLIC_API_URL}` and unwraps
   the shared `ApiResponse<T>` envelope. Responses are cached with
   `next: { revalidate: 60 }`.
2. **Admin writes.** Browser code never touches tokens. It calls
   `lib/admin-api.ts`, which fetches the Next.js catch-all
   `app/api/proxy/[...path]/route.ts`. The proxy attaches
   `Authorization: Bearer <dp_access>` from the httpOnly cookie, forwards the
   request to `${NEXT_PUBLIC_API_URL}/<path>`, and returns the API response
   unchanged. On a 401 it attempts one refresh with the `dp_refresh` cookie
   (`POST /auth/refresh`), retries once, and otherwise returns 401.
3. **Auth.** `POST /api/auth/login` proxies to the Express `POST /auth/login`
   and sets two httpOnly, `sameSite=lax` cookies: `dp_access` (15 minutes) and
   `dp_refresh` (7 days). `POST /api/auth/logout` clears both.
   `GET /api/auth/me` proxies `GET /auth/me`. `apps/web/middleware.ts` guards
   `/admin/*` with a cookie-presence check only; the API enforces real
   authentication and RBAC on every protected endpoint.
4. **Errors.** All API responses use the shared envelope
   `{ success, data, error?: { code, message, details } }`. The admin client
   throws `ApiError` (with HTTP status) for non-2xx or `success: false`.

## RSS pipeline

1. Editors add feeds in **Admin → News & RSS** (`rss-sources` CRUD) with a
   category and a fetch interval (default 15 minutes).
2. A BullMQ job (Redis) polls each active source on its interval, or an editor
   clicks **Fetch now** (`POST /rss-sources/:id/fetch`).
3. Fetched entries are stored as `rss-items`, deduplicated by GUID.
4. An editor clicks **Import as draft** (`POST /rss-items/:id/import`), which
   creates a draft `Post` (`postType: "news"`, `sourceName`/`sourceUrl` set).
   The draft is then edited and published like any other post. Imported items
   are marked `imported: true` so they cannot be imported twice.

## RBAC model

Roles (see `packages/shared`): `super_admin`, `admin`, `editor`, `author`,
`news_editor`, `seo_manager`, `marketing_manager`, `analyst`.

- Permissions are the `PERMISSIONS` list in `packages/shared`
  (`posts.create`, `posts.publish`, `news.manage`, `users.manage`, …).
- The **API is the authority**: every protected endpoint checks the caller's
  role against the required permission and returns 403 otherwise.
- The **web app only gates UI**: the admin sidebar hides sections whose
  permission is missing from `ROLE_PERMISSIONS[user.role]`. This is cosmetic;
  it must never be relied on for security.
- Note: per the shared contract, `users.manage` belongs to `super_admin` only
  (`admin` has every permission except `users.manage`), so the Users & Roles
  section is visible to super admins only.

## SEO approach

- Per-post SEO (`seo.title`, `seo.description`, `seo.keywords`, `ogImage`,
  `noIndex`, `canonicalUrl`) is edited in the post form and rendered as
  metadata by the public post page.
- Global defaults live in **Admin → SEO** (`seo-settings`): default title /
  description / OG image, Twitter handle, Google News flag, and the
  `robots.txt` content served by the site.
- Redirects (`/redirects`, 301/302 with hit counts) preserve link equity when
  slugs change. Affiliate links are served from `/go/<slug>` with click
  counting. Canonical URLs are set on aggregated news posts pointing back to
  the source.

## Content model

Posts have a `postType` (`editorial`, `news`, `link_card`,
`product_recommendation`, `sponsored`, `guide`, `review`, `comparison`,
`digital_product`) and a `status` (`draft`, `review`, `published`,
`scheduled`). Categories form the verticals (Lifestyle, Personal Finance,
Technology, Breaking News) plus sub-categories; tags are free-form.
Sponsored posts are flagged (`sponsored: true`) with an affiliate-disclosure
flag and are listed separately under Admin → Sponsored.
