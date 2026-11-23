# The Daily Pulse — API Reference

Express 4 API for The Daily Pulse publishing platform. Base URL: `http://localhost:4000`.
All API routes live under `/api/v1`; interactive docs are served at `/api-docs`
(Swagger UI, backed by [`openapi.yaml`](./openapi.yaml)).

Stack: Node 24, Express 4.22, Sequelize 6.37 + mysql2 against **MySQL 8.4**,
BullMQ + ioredis (Redis 7), rss-parser, jsonwebtoken, bcryptjs, zod, multer.
No MongoDB/Mongoose/Prisma anywhere. Source: `apps/api/src`.

## Conventions

### Envelope

Every JSON response uses the shared `ApiResponse<T>` envelope:

```json
{ "success": true, "data": { "...": "..." } }
```

Errors:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [{ "path": "title", "message": "Required" }]
  }
}
```

### IDs

Database IDs are UUID strings. In API responses they are exposed as `_id`
(the Sequelize `id` column is never leaked as `id`).

### Pagination

List endpoints accept `?page=1&pageSize=20` (pageSize max 100) and return the
shared `Paginated<T>` shape:

```json
{ "success": true, "data": { "items": [], "total": 0, "page": 1, "pageSize": 20, "totalPages": 0 } }
```

### Dates

All dates are ISO 8601 strings (UTC).

## Authentication

JWT access tokens (15 minutes, `JWT_EXPIRES_IN`) sent as
`Authorization: Bearer <accessToken>`.

Refresh tokens (7 days, `JWT_REFRESH_EXPIRES_IN`) are issued on login and
delivered **two ways**:

1. An `httpOnly` cookie named `refreshToken` (path `/api/v1/auth`, `SameSite=strict`,
   `Secure` in production) — the recommended path for the web app.
2. The response body of `POST /auth/refresh` also accepts `{ "refreshToken": "..." }`
   in the JSON body, for non-browser clients.

Refresh rotates: each `POST /auth/refresh` returns a fresh access token **and**
a fresh refresh token (new cookie). `POST /auth/logout` clears the cookie.
Refresh tokens are stateless signed JWTs (secret `JWT_REFRESH_SECRET`); there is
no server-side token table, so "logout" only clears the client cookie — a stolen
refresh token remains valid until expiry. Rotate `JWT_REFRESH_SECRET` to revoke
all sessions.

**Registration is disabled.** `POST /auth/register` always returns
`403 REGISTRATION_DISABLED`. The first account is created by the seed script
(`npm run seed` in `apps/api`, super admin from `SEED_ADMIN_*` env vars);
further users are created by a super_admin via `POST /users`.

### Auth endpoints

| Method | Path             | Auth        | Description                                                      |
| ------ | ---------------- | ----------- | ---------------------------------------------------------------- |
| POST   | `/auth/login`    | —           | `{ email, password }` → `{ accessToken, user }` + refresh cookie |
| POST   | `/auth/refresh`  | cookie/body | Rotate refresh token → `{ accessToken, user }`                   |
| POST   | `/auth/logout`   | —           | Clear refresh cookie                                             |
| POST   | `/auth/register` | —           | Always `403 REGISTRATION_DISABLED`                               |
| GET    | `/auth/me`       | Bearer      | Current user                                                     |

## RBAC

Every protected endpoint checks a permission server-side against
`ROLE_PERMISSIONS` in `packages/shared`. Roles: `super_admin`, `admin`,
`editor`, `author`, `news_editor`, `seo_manager`, `marketing_manager`, `analyst`.

| Permission          | Roles                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `posts.create`      | super_admin, admin, editor, author, news_editor                                          |
| `posts.edit`        | super_admin, admin, editor, author, news_editor                                          |
| `posts.publish`     | super_admin, admin, editor, news_editor                                                  |
| `posts.delete`      | super_admin, admin                                                                       |
| `posts.view`        | super_admin, admin, editor, author, news_editor, seo_manager, marketing_manager, analyst |
| `comments.moderate` | super_admin, admin, editor                                                               |
| `news.manage`       | super_admin, admin, news_editor                                                          |
| `rss.manage`        | super_admin, admin, news_editor                                                          |
| `categories.manage` | super_admin, admin, editor                                                               |
| `media.manage`      | super_admin, admin, editor, author, news_editor                                          |
| `authors.manage`    | super_admin, admin                                                                       |
| `banners.manage`    | super_admin, admin, marketing_manager                                                    |
| `affiliates.manage` | super_admin, admin, marketing_manager                                                    |
| `products.manage`   | super_admin, admin, marketing_manager                                                    |
| `orders.view`       | super_admin, admin, analyst                                                              |
| `newsletter.view`   | super_admin, admin, marketing_manager, analyst                                           |
| `seo.manage`        | super_admin, admin, seo_manager                                                          |
| `redirects.manage`  | super_admin, admin, seo_manager                                                          |
| `analytics.view`    | super_admin, admin, seo_manager, analyst                                                 |
| `users.manage`      | super_admin only                                                                         |
| `settings.manage`   | super_admin, admin                                                                       |

Missing/invalid token → `401 UNAUTHORIZED`; authenticated but lacking the
permission → `403 FORBIDDEN`.

## Rate limits

- General API: 600 requests / 15 min per IP (`RATE_LIMIT_MAX`).
- Auth endpoints (`/auth/login`, `/auth/refresh`, `/auth/register`): 30 / 15 min
  (`AUTH_RATE_LIMIT_MAX`). Exceeding either returns `429` with code `RATE_LIMITED`.

## Endpoints

Public reads need no auth. Writes require auth + the permission shown.
`{id}` is the UUID `_id`; `{slug}` is the URL slug.

### Health

| Method | Path             | Auth | Description                                                    |
| ------ | ---------------- | ---- | -------------------------------------------------------------- |
| GET    | `/api/v1/health` | —    | `{ status: "ok", uptimeSeconds }` (excluded from request logs) |

### Posts

| Method | Path                  | Auth              | Description                                                                                                                                                                                                                        |
| ------ | --------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/posts`              | — (optional auth) | List. Public: published only. Staff with `posts.view` may pass `?status=draft\|review\|scheduled`. Filters: `category` (slug), `tag` (slug), `postType`, `search` (title/summary; `q` is an alias), `sort=views` (most-read first) |
| GET    | `/posts/search`       | — (optional auth) | Search published posts (`?q=` or `?search=`); same filters as list                                                                                                                                                                 |
| GET    | `/posts/:slug`        | — (optional auth) | One post; increments the view counter. Unpublished slugs are 404 for the public                                                                                                                                                    |
| GET    | `/posts/id/:id`       | `posts.view`      | Fetch by UUID (admin/edit view)                                                                                                                                                                                                    |
| POST   | `/posts`              | `posts.create`    | Create (body: `postCreateSchema`)                                                                                                                                                                                                  |
| PATCH  | `/posts/:id`          | `posts.edit`      | Partial update; changing `title` re-slugs (unique)                                                                                                                                                                                 |
| POST   | `/posts/:id/publish`  | `posts.publish`   | Publish now (sets `publishedAt` if missing)                                                                                                                                                                                        |
| POST   | `/posts/:id/schedule` | `posts.publish`   | Schedule; body `{ publishedAt }` must be a future date                                                                                                                                                                             |
| DELETE | `/posts/:id`          | `posts.delete`    | Delete                                                                                                                                                                                                                             |

Create example:

```json
POST /api/v1/posts
{
  "title": "On-Device AI, Explained Without the Hype",
  "category": "technology",
  "tags": ["ai", "gadgets"],
  "postType": "editorial",
  "status": "draft",
  "body": [{ "type": "paragraph", "text": "..." }],
  "seo": { "title": "...", "description": "...", "keywords": ["ai"] }
}
```

Notes: `category` is a category **slug** (resolved server-side, `400 INVALID_CATEGORY`
if unknown); `author` is an author `_id`; `tags` are auto-created by slug;
the post `slug` is derived from the title and made unique (`hello-world-2`, …);
`publishedAt` is set automatically on publish.

### Categories & tags

| Method | Path                | Auth                | Description                          |
| ------ | ------------------- | ------------------- | ------------------------------------ |
| GET    | `/categories`       | —                   | List (ordered by `order`, then name) |
| GET    | `/categories/:slug` | —                   | One category                         |
| POST   | `/categories`       | `categories.manage` | Create                               |
| PATCH  | `/categories/:id`   | `categories.manage` | Update                               |
| DELETE | `/categories/:id`   | `categories.manage` | Delete                               |
| GET    | `/tags`             | —                   | List                                 |
| POST   | `/tags`             | `categories.manage` | Create (409 if slug exists)          |
| DELETE | `/tags/:id`         | `categories.manage` | Delete                               |

### RSS

| Method | Path                       | Auth         | Description                                                                            |
| ------ | -------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| GET    | `/rss/sources`             | `rss.manage` | List sources                                                                           |
| POST   | `/rss/sources`             | `rss.manage` | Create source                                                                          |
| GET    | `/rss/sources/:id`         | `rss.manage` | One source                                                                             |
| PATCH  | `/rss/sources/:id`         | `rss.manage` | Update (incl. `fetchIntervalMinutes`, min 5)                                           |
| DELETE | `/rss/sources/:id`         | `rss.manage` | Delete (items cascade)                                                                 |
| POST   | `/rss/sources/:id/fetch`   | `rss.manage` | **Manual trigger** — fetch now, returns `{ created, skipped, postsCreated, sourceId }` |
| POST   | `/rss/sources/:id/enqueue` | `rss.manage` | Enqueue a background fetch job instead                                                 |
| GET    | `/rss/items`               | `rss.manage` | List items; filters `source`, `category`, `imported`                                   |
| POST   | `/rss/items/:id/import`    | `rss.manage` | **Manual import** — create a draft news post from an item (idempotent)                 |

### Banners, affiliates, authors, redirects

| Method | Path                           | Auth                | Description                                                                         |
| ------ | ------------------------------ | ------------------- | ----------------------------------------------------------------------------------- |
| GET    | `/banners`                     | —                   | List (filter `placement`, `active`)                                                 |
| GET    | `/banners/active/:placement`   | —                   | Currently active banners for a placement (window-checked)                           |
| POST   | `/banners`                     | `banners.manage`    | Create                                                                              |
| PATCH  | `/banners/:id`                 | `banners.manage`    | Update                                                                              |
| DELETE | `/banners/:id`                 | `banners.manage`    | Delete                                                                              |
| POST   | `/banners/:id/click`           | —                   | Record a click                                                                      |
| GET    | `/affiliates`                  | `affiliates.manage` | List                                                                                |
| POST   | `/affiliates`                  | `affiliates.manage` | Create                                                                              |
| PATCH  | `/affiliates/:id`              | `affiliates.manage` | Update                                                                              |
| DELETE | `/affiliates/:id`              | `affiliates.manage` | Delete                                                                              |
| GET    | `/go/:slug`                    | —                   | **Public redirect** (302 to `targetUrl`, counts the click). Note: outside `/api/v1` |
| GET    | `/affiliates/go/:slug`         | —                   | Resolve as JSON `{ targetUrl }` (used by the Next.js `/go` page)                    |
| GET    | `/authors`                     | —                   | List                                                                                |
| GET    | `/authors/:slug`               | —                   | One author                                                                          |
| POST   | `/authors`                     | `authors.manage`    | Create                                                                              |
| PATCH  | `/authors/:id`                 | `authors.manage`    | Update                                                                              |
| DELETE | `/authors/:id`                 | `authors.manage`    | Delete                                                                              |
| GET    | `/redirects`                   | `redirects.manage`  | List                                                                                |
| GET    | `/redirects/resolve?from=/old` | —                   | Resolve a path → redirect (counts a hit)                                            |
| POST   | `/redirects`                   | `redirects.manage`  | Create                                                                              |
| PATCH  | `/redirects/:id`               | `redirects.manage`  | Update                                                                              |
| DELETE | `/redirects/:id`               | `redirects.manage`  | Delete                                                                              |

### Products & orders

| Method | Path                 | Auth              | Description                                                                          |
| ------ | -------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| GET    | `/products`          | —                 | List active products (staff: `?active=false` to see all)                             |
| GET    | `/products/:slug`    | —                 | One product                                                                          |
| POST   | `/products`          | `products.manage` | Create (price in minor units, e.g. paise)                                            |
| PATCH  | `/products/:id`      | `products.manage` | Update                                                                               |
| DELETE | `/products/:id`      | `products.manage` | Delete                                                                               |
| GET    | `/orders`            | `orders.view`     | List (filters `status`, `buyerEmail`)                                                |
| GET    | `/orders/:id`        | `orders.view`     | One order                                                                            |
| POST   | `/orders`            | —                 | **Public checkout** — `{ product, buyerEmail }` → pending order                      |
| PATCH  | `/orders/:id/status` | `products.manage` | Set status (`pending`/`paid`/`failed`/`refunded`); `paid` increments product `sales` |

**Payments are stubbed.** No gateway is configured: every order is recorded
with `provider: "manual"` and `status: "pending"`. Marking an order `paid` is
the manual confirmation step until a gateway lands (change `OrdersService` only).

### Newsletter, comments, media

| Method | Path                      | Auth                | Description                                                                               |
| ------ | ------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| GET    | `/newsletter`             | `newsletter.view`   | List subscribers (filter `status`)                                                        |
| POST   | `/newsletter`             | —                   | Subscribe (alias of `/newsletter/subscribe`, used by the public site)                     |
| POST   | `/newsletter/subscribe`   | —                   | Subscribe (idempotent; re-subscribes)                                                     |
| POST   | `/newsletter/unsubscribe` | —                   | Unsubscribe by email                                                                      |
| DELETE | `/newsletter/:id`         | `newsletter.view`   | Delete subscriber                                                                         |
| GET    | `/comments/post/:postId`  | —                   | Approved comments for a post                                                              |
| GET    | `/comments`               | `comments.moderate` | Moderation queue (filter `status`, `post`)                                                |
| POST   | `/comments`               | —                   | Create — always starts `pending`                                                          |
| PATCH  | `/comments/:id/status`    | `comments.moderate` | `{ status: pending\|approved\|spam\|rejected }`                                           |
| DELETE | `/comments/:id`           | `comments.moderate` | Delete                                                                                    |
| GET    | `/media`                  | `media.manage`      | List uploads                                                                              |
| POST   | `/media/upload`           | `media.manage`      | Multipart upload, field `file` (images + PDF, max 10 MB). Served at `/uploads/<filename>` |
| DELETE | `/media/:id`              | `media.manage`      | Delete (removes the file from disk too)                                                   |

### Users, SEO, site settings

| Method | Path             | Auth              | Description                                       |
| ------ | ---------------- | ----------------- | ------------------------------------------------- |
| GET    | `/users`         | `users.manage`    | List users                                        |
| POST   | `/users`         | `users.manage`    | Create user (password min 8 chars, bcrypt-hashed) |
| GET    | `/users/:id`     | `users.manage`    | One user                                          |
| PATCH  | `/users/:id`     | `users.manage`    | Update (incl. `isActive`, `role`, `password`)     |
| DELETE | `/users/:id`     | `users.manage`    | Delete                                            |
| GET    | `/seo-settings`  | —                 | SEO defaults (single row)                         |
| PUT    | `/seo-settings`  | `seo.manage`      | Upsert SEO defaults (full body)                   |
| PATCH  | `/seo-settings`  | `seo.manage`      | Partial update (merge semantics)                  |
| GET    | `/site-settings` | —                 | Site settings (single row)                        |
| PUT    | `/site-settings` | `settings.manage` | Upsert site settings (full body)                  |
| PATCH  | `/site-settings` | `settings.manage` | Partial update (merge semantics)                  |

### Analytics & admin

| Method | Path                  | Auth             | Description                                                                                                                  |
| ------ | --------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/analytics/events`   | —                | Record an event `{ type, post?, path?, referrer? }`                                                                          |
| GET    | `/analytics/events`   | `analytics.view` | List events (filter `type`, `post`)                                                                                          |
| GET    | `/analytics/overview` | `analytics.view` | `{ totalViews, pageViews30d, eventsByType, topPosts, affiliateClicks, newsletterSubscribers }`                               |
| GET    | `/admin/overview`     | `analytics.view` | Dashboard `OverviewStats`: post counts, RSS counts, views, top posts, affiliate clicks, subscribers, sales, `recentActivity` |
| GET    | `/admin/audit-logs`   | `analytics.view` | Admin activity log (filter `entity`, `user`)                                                                                 |

## RSS ingestion flow

1. **Sources** are rows in `rssSources` (seeded: Economic Times B2B,
   `https://b2b.economictimes.indiatimes.com/rss`, category `breaking-news`,
   every 15 min).
2. On boot (unless `DISABLE_WORKERS=true`) the API starts a BullMQ worker on
   queue **`rss-ingest`** and registers one **repeatable job per active source**,
   keyed `rss-<sourceId>`, running every `fetchIntervalMinutes` (default 15).
   Changing a source's interval re-registers its job on the next boot.
3. Each run fetches the feed with `rss-parser` (`User-Agent: RSS_USER_AGENT`),
   then per item:
   - `guid` (falling back to `link`) is the dedup key — `RssItem.findOrCreate`
     on `guid`; known guids are skipped, so re-runs are idempotent.
   - New items get a **draft `Post` auto-created**: `postType: "news"`,
     `status: "draft"`, `sourceName`/`sourceUrl` set, `externalUrl` = item link,
     category from the source's category slug (fallback `breaking-news`).
     The item is marked `imported: true` with `postId` set.
   - The source's `lastFetchedAt` / `lastItemCount` are updated.
4. Editors publish the drafts from `/posts/:id/publish` (or the admin UI).
5. `POST /rss/sources/:id/fetch` runs the same ingestion synchronously for a
   manual trigger; `POST /rss/sources/:id/enqueue` queues it instead.

## Queues & background jobs

- **Queue `rss-ingest`** (Redis via `REDIS_URL`): repeatable per-source fetch
  jobs, see above. Worker: `apps/api/src/jobs/rss.job.ts`.
- **Queue `cleanup`** (same Redis): repeatable job `daily-cleanup`
  (`0 3 * * *`) that prunes `analyticsEvents` and `auditLogs` older than
  **90 days** — MySQL 8.4 has no TTL indexes, so retention is enforced here.
  Worker: `apps/api/src/jobs/cleanup.ts`.
- If Redis is unreachable at boot, workers log the failure and the HTTP API
  still starts (ingestion/manual fetch via the API still works; scheduled
  polling does not). Set `DISABLE_WORKERS=true` to skip workers entirely
  (e.g. a web-only replica).

## Error codes

| Code                                                                                                                                                                                                                                                                                                        | HTTP | Meaning                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR`                                                                                                                                                                                                                                                                                          | 422  | Zod validation failed (details list `path` + `message`); also Sequelize validation errors |
| `UNAUTHORIZED`                                                                                                                                                                                                                                                                                              | 401  | Missing/invalid/expired access token                                                      |
| `INVALID_CREDENTIALS`                                                                                                                                                                                                                                                                                       | 401  | Wrong email/password                                                                      |
| `INVALID_REFRESH_TOKEN`                                                                                                                                                                                                                                                                                     | 401  | Refresh token missing/invalid/expired                                                     |
| `FORBIDDEN`                                                                                                                                                                                                                                                                                                 | 403  | Role lacks the required permission                                                        |
| `ACCOUNT_DISABLED`                                                                                                                                                                                                                                                                                          | 403  | User `isActive` is false                                                                  |
| `REGISTRATION_DISABLED`                                                                                                                                                                                                                                                                                     | 403  | Public registration is off                                                                |
| `NOT_FOUND`                                                                                                                                                                                                                                                                                                 | 404  | Unknown route                                                                             |
| `POST_NOT_FOUND` / `CATEGORY_NOT_FOUND` / `TAG_NOT_FOUND` / `AUTHOR_NOT_FOUND` / `USER_NOT_FOUND` / `BANNER_NOT_FOUND` / `AFFILIATE_NOT_FOUND` / `PRODUCT_NOT_FOUND` / `ORDER_NOT_FOUND` / `COMMENT_NOT_FOUND` / `MEDIA_NOT_FOUND` / `REDIRECT_NOT_FOUND` / `RSS_SOURCE_NOT_FOUND` / `SUBSCRIBER_NOT_FOUND` | 404  | Entity not found                                                                          |
| `CONFLICT`                                                                                                                                                                                                                                                                                                  | 409  | Unique-constraint violation (e.g. duplicate slug/email)                                   |
| `EMAIL_TAKEN`                                                                                                                                                                                                                                                                                               | 409  | User email already exists                                                                 |
| `TAG_EXISTS`                                                                                                                                                                                                                                                                                                | 409  | Tag slug already exists                                                                   |
| `INVALID_CATEGORY` / `INVALID_AUTHOR` / `INVALID_PARENT`                                                                                                                                                                                                                                                    | 400  | Referenced slug/id does not exist                                                         |
| `INVALID_DATE`                                                                                                                                                                                                                                                                                              | 400  | Bad or past `publishedAt` for scheduling                                                  |
| `PRODUCT_INACTIVE`                                                                                                                                                                                                                                                                                          | 400  | Ordering an inactive product                                                              |
| `NO_FILE`                                                                                                                                                                                                                                                                                                   | 400  | Upload without a `file` field                                                             |
| `UNSUPPORTED_FILE_TYPE`                                                                                                                                                                                                                                                                                     | 400  | Upload MIME not allowed                                                                   |
| `RSS_FETCH_FAILED`                                                                                                                                                                                                                                                                                          | 502  | Feed fetch failed (upstream unreachable/invalid)                                          |
| `RATE_LIMITED`                                                                                                                                                                                                                                                                                              | 429  | Rate limit exceeded                                                                       |
| `CONFIG_ERROR`                                                                                                                                                                                                                                                                                              | 500  | Missing server config (e.g. `JWT_SECRET`)                                                 |
| `INTERNAL_ERROR`                                                                                                                                                                                                                                                                                            | 500  | Unexpected server error                                                                   |

## Running it

```bash
cd apps/api
npm run build        # tsc + esbuild bundle — must be clean
npm test             # vitest unit tests (no MySQL needed)
npm run db:migrate   # sequelize-cli, MySQL 8.4
npm run seed         # super admin + verticals + ET B2B source + settings
npm run dev          # tsx watch src/server.ts (PORT 4000)
npm start            # node dist/server.bundle.cjs (production entry)
```

### Why `npm start` runs a bundle

`packages/shared` ships an **ESM-only** build (`dist/index.js` uses `import`/`export`,
and its `exports` map has no `require` condition), so plain `node dist/server.js`
(CJS output of `tsc`) crashes on boot with
`ERR_PACKAGE_PATH_NOT_EXPORTED`. The API therefore ships a self-contained
esbuild bundle (`dist/server.bundle.cjs`, built by `npm run build` after `tsc`);
`tsx` dev mode is unaffected. The proper long-term fix belongs in
`packages/shared` — a dual CJS+ESM build (or a `require` export) — at which
point `start` can go back to `node dist/server.js`. The `--external:*` flags
in the build script only exclude Sequelize's unused optional dialects
(`pg`, `tedious`, `sqlite3`, …).

Environment (see root `.env.example`): `DB_*`, `REDIS_URL`, `JWT_SECRET`,
`JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN` (15m), `JWT_REFRESH_EXPIRES_IN` (7d),
`WEB_BASE_URL` (CORS origin), `UPLOAD_DIR` (`./uploads`), `RSS_USER_AGENT`,
`DISABLE_WORKERS`.

## Testing notes

- `apps/api/tests/` are **unit tests only** (serializers, pagination, slugify,
  zod validation, permission map) and run without MySQL: `npm test`.
- DB-backed behaviour (services, routes, ingestion, queues) is **not** covered
  by automated tests here — it runs on CI against MySQL 8.4 + Redis only.
  Do not claim those paths are test-verified until CI runs them.
