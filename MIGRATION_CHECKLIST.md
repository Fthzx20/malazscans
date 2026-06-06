# Migration Checklist — Supabase + Cloudflare R2

## Architecture Overview

```
src/repositories/
├── interfaces.ts              ← Repository contracts (stable API)
├── index.ts                   ← Factory — the SINGLE swap point
├── localStorage/              ← Fallback/cache implementation
│   ├── index.ts
│   ├── novel.repository.ts
│   ├── comment.repository.ts
│   ├── library.repository.ts
│   ├── settings.repository.ts
│   ├── recommendation.repository.ts
│   └── notification.repository.ts
└── supabase/
    ├── index.ts
    ├── auth.repository.ts     ← LIVE ✅
    └── novel.repository.ts    ← Server-only (API routes)
```

---

## Pre-Migration (DONE ✅)

- [x] Remove hardcoded admin credentials from source code
- [x] Move credentials to environment variables (.env)
- [x] Create `.env.example` for team onboarding
- [x] Define role-based auth types (`UserRole`, `AuthUser`, `Permission`)
- [x] Create repository interfaces for all data domains
- [x] Implement localStorage repositories (current behavior preserved)
- [x] Create repository factory with single swap point
- [x] Refactor `useAuth` hook to use repository pattern
- [x] Verify build passes (TypeScript + Next.js)
- [x] Ensure `.env` is gitignored, `.env.example` is tracked

---

## Phase 1: Supabase Setup (DONE ✅)

- [x] Create Supabase project
- [x] Install `@supabase/supabase-js` and `@supabase/ssr`
- [x] Create `src/lib/supabase/client.ts` (browser client)
- [x] Create `src/lib/supabase/server.ts` (server client for API routes)
- [x] Create `src/lib/supabase/admin.ts` (service role client)
- [x] Fill `.env` with actual Supabase URL and keys
- [x] Verify connection

---

## Phase 2: Database Migration (DONE ✅)

- [x] Fix Prisma schema type issues (Float, Int, DateTime)
- [x] Add missing indexes (all FK columns + query patterns)
- [x] Add `User` foreign key on `Comment` model
- [x] Add `Bookmark` and `ReadingHistory` models (per-user data)
- [x] Create `prisma.config.ts` for Prisma 7 compatibility
- [x] Install `@prisma/adapter-pg` + `pg` for Prisma 7 driver adapter
- [x] Push schema to Supabase with `prisma db push`
- [x] Seed database with content from `src/data/novels.ts`
- [x] Create `src/lib/prisma.ts` singleton with adapter pattern

---

## Phase 3: Authentication (DONE ✅)

- [x] Supabase Auth available (email/password provider)
- [x] API route: `POST /api/auth/login` (Supabase signInWithPassword)
- [x] API route: `POST /api/auth/register` (Supabase signUp with metadata)
- [x] Admin user created in Supabase Auth (role: "admin" in user_metadata)
- [x] Factory swapped: `authRepository = new SupabaseAuthRepository()`
- [x] Auth store uses `getSessionAsync()` for session restoration
- [x] `useAuth` hook fully async (login/register/logout)
- [x] RLS policies configured in Supabase dashboard

---

## Phase 4: Data Layer Migration (DONE ✅)

1. [x] **Novels** → `GET /api/novels` (Prisma → Supabase Postgres) + stale-while-revalidate
2. [x] **Volumes** → included via Prisma relations (nested in novels)
3. [x] **Chapters** → included via Prisma relations (nested in volumes)
4. [x] **Recommendations** → `GET /api/recommendations` (fetched from Supabase)
5. [x] **Settings** → localStorage (no security concern, stays permanently)

---

## Phase 5: Remaining Supabase Migration (DONE ✅)

### 5.1 Comments

| Item | Status |
|------|--------|
| Create `GET/POST /api/comments?chapterId=xxx` | ✅ |
| Create `PATCH /api/comments/[id]` (edit) | ✅ |
| Create `DELETE /api/comments/[id]` (delete) | ✅ |
| Create `POST /api/comments/[id]/react` (toggle reaction) | ✅ |

### 5.2 Notifications / Announcements

| Item | Status |
|------|--------|
| Create `GET /api/announcements` (public, published + active dates) | ✅ |
| Create `GET/POST /api/admin/announcements` (admin list/create) | ✅ |
| Create `PATCH /api/admin/announcements/[id]` (admin edit) | ✅ |
| Create `DELETE /api/admin/announcements/[id]` (admin delete) | ✅ |

### 5.3 Library (Bookmarks + Reading History)

| Item | Status |
|------|--------|
| Create `GET/POST /api/library/bookmarks` (user's bookmarks, toggle) | ✅ |
| Create `GET/POST /api/library/history` (user's reading history) | ✅ |

### 5.4 Admin CRUD

| Item | Status |
|------|--------|
| Create `POST /api/admin/novels` (create novel) | ✅ |
| Create `PATCH /api/admin/novels/[id]` (update novel) | ✅ |
| Create `DELETE /api/admin/novels/[id]` (delete novel) | ✅ |
| Create `POST /api/admin/novels/[id]/chapters` (add chapter) | ✅ |
| Create `PATCH /api/admin/chapters/[id]` (update chapter) | ✅ |
| Create `DELETE /api/admin/chapters/[id]` (delete chapter) | ✅ |
| Create `PUT /api/admin/recommendations` (reorder) | ✅ |
| Admin auth middleware (verify role in API routes) | ✅ |

---

## Phase 6: Row-Level Security (RLS)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `Novel` | public | admin | admin | admin |
| `Volume` | public | admin | admin | admin |
| `Chapter` | public | admin | admin | admin |
| `Comment` | public | auth (own) | own / admin | own / admin |
| `Reaction` | public | auth (own) | own | own / admin |
| `Recommendation` | public | admin | admin | admin |
| `Announcement` | public (published + active) | admin | admin | admin |
| `Bookmark` | auth (own) | auth (own) | — | auth (own) |
| `ReadingHistory` | auth (own) | auth (own) | — | auth (own) |
| `Illustration` | public | admin | admin | admin |

---

## Phase 7: Cleanup (DONE ✅)

- [x] All stores migrated from `db.*` to repository pattern
- [x] All components migrated from `db.*` to repository imports
- [x] Removed `src/services/db.ts` (legacy — no longer imported)
- [x] Removed `src/config/auth.ts` (Supabase handles it)
- [x] Configured `next.config.ts` with R2 image domain
- [ ] Remove `src/data/novels.ts` (keep `prisma/seed.ts` only) — optional, used by localStorage fallback
- [ ] Remove `ADMIN_DEFAULT_PASSWORD` env var — once confirmed Supabase Auth is sole auth

---

## Phase 8: Cloudflare R2 Migration

### 8.1 Current Image Sources

| Source | Location | Format | Count |
|--------|----------|--------|-------|
| Novel covers (fallback) | `src/assets/covers/*.tsx` | Inline SVG React components | 5 |
| Novel covers (uploaded) | Admin panel → localStorage | Base64 data URL | 0 (empty strings in seed) |
| Chapter illustrations | `src/assets/illustrations/*.tsx` | Inline SVG React components | 2 |
| Editor images (Tiptap) | SystemEditor paste/drop | Base64 data URL in JSON content | Variable |
| User avatars | SettingsPage upload | Base64 data URL in localStorage | Per-user |

### 8.2 Upload Code Locations

| File | Action | Current Storage |
|------|--------|-----------------|
| `src/features/admin/components/CreateNovelDrawer.tsx` | Novel cover upload | `FileReader.readAsDataURL` → store as base64 string |
| `src/features/admin/components/SystemEditor.tsx` | Editor image paste/drop/toolbar | `FileReader.readAsDataURL` → base64 in Tiptap JSON |
| `src/features/settings/components/SettingsPage.tsx` | Avatar upload | `FileReader.readAsDataURL` → base64 in user state |

### 8.3 Suggested R2 Bucket Structure

```
malazbaca-assets/
├── covers/
│   ├── red-sunset.webp
│   ├── empty-signal.webp
│   ├── midnight-cafe.webp
│   └── {novel-id}.webp
├── illustrations/
│   ├── rs-v1-c1-illus.webp
│   ├── es-v1-c1-illus.webp
│   └── {chapter-id}/{illustration-id}.webp
├── editor/
│   └── {chapter-id}/{timestamp}-{hash}.webp    ← inline images from Tiptap
└── avatars/
    └── {user-id}.webp
```

### 8.4 Migration Steps

| Step | Description | Status |
|------|-------------|--------|
| 1 | Create R2 bucket `malazbaca-assets` | ✅ (env filled) |
| 2 | Configure public URL (r2.dev) | ✅ |
| 3 | Install `@aws-sdk/client-s3` (R2 uses S3-compatible API) | ✅ |
| 4 | Create `src/lib/r2.ts` (S3 client configured for R2) | ✅ |
| 5 | Create `POST /api/upload` (presigned URL + direct upload) | ✅ |
| 6 | Migrate `CreateNovelDrawer.tsx` upload → R2 | TODO |
| 7 | Migrate `SystemEditor.tsx` paste/drop → R2 | TODO |
| 8 | Migrate `SettingsPage.tsx` avatar → R2 | TODO |
| 9 | Convert SVG cover components → actual image files in R2 | TODO |
| 10 | Convert SVG illustration components → actual image files in R2 | TODO |
| 11 | Update `Novel.coverImage` to store R2 URL instead of base64 | TODO |
| 12 | Replace raw `<img>` with `next/image` (6 locations) | TODO |
| 13 | Configure `next.config.ts` image domains for R2 CDN | ✅ |

### 8.5 `<img>` → `next/image` Migration Targets

| File | Line | Current |
|------|------|---------|
| `NovelCarousel.tsx` | 28 | `<img src={novel.coverImage}>` |
| `NovelCard.tsx` | 33 | `<img src={novel.coverImage}>` |
| `DetailPage.tsx` | 22 | `<img src={selectedNovel.coverImage}>` |
| `LibraryPage.tsx` | 26 | `<img src={novel.coverImage}>` |
| `SettingsPage.tsx` | 410 | `<img src={avatar}>` |
| `Header.tsx` | 100 | `<img src={currentUser.avatar}>` |
| `MobileMenu.tsx` | 80 | `<img src={currentUser.avatar}>` |
| `ManageNovelsTab.tsx` | 240 | `<img src={novel.coverImage}>` |

(Already using `next/image`: `ReaderContent.tsx`, `IllustrationViewer.tsx`)

---

## Database Entity Reference

### Supabase Tables (live in Postgres)

| Table | Primary Key | Relationships | Indexes |
|-------|-------------|---------------|---------|
| `User` | `id` (uuid) | → Comment, Bookmark, ReadingHistory | email |
| `Novel` | `id` (slug string) | → Volume, Recommendation, Bookmark | status, addedDate |
| `Volume` | `id` (uuid) | → Novel (FK), → Chapter | novelId |
| `Chapter` | `id` (slug string) | → Volume (FK), → Comment, Illustration | volumeId, publishDate |
| `Comment` | `id` (autoincrement) | → Chapter (FK), → User (FK), self-ref replies | chapterId, parentId, userId |
| `Reaction` | `id` (uuid) | → Comment (FK) | commentId, unique(type+username+commentId) |
| `Mention` | `id` (uuid) | → Comment (FK) | commentId |
| `Recommendation` | `id` (uuid) | → Novel (FK) | novelId, order |
| `Announcement` | `id` (uuid) | — | status+startDate+endDate |
| `Bookmark` | `id` (uuid) | → User (FK), → Novel (FK) | userId, unique(userId+novelId) |
| `ReadingHistory` | `id` (uuid) | → User (FK) | userId+timestamp, userId+novelId |
| `Illustration` | `id` (uuid) | → Chapter (FK) | chapterId |
| `TranslatorNote` | `id` (uuid) | — | chapterId |
| `AuthorNote` | `id` (uuid) | — | chapterId |

### Hardcoded IDs Still in Codebase

| ID | Location | Purpose | Action |
|----|----------|---------|--------|
| `"red-sunset"` | seed, covers, recommendations | Novel slug | Keep — this IS the stable ID |
| `"empty-signal"` | seed, covers | Novel slug | Keep |
| `"midnight-cafe"` | seed, covers, recommendations | Novel slug | Keep |
| `"heavenly-dragon"` | covers only | Future novel slug | Keep (pre-registered cover) |
| `"reincarnation-system"` | covers only | Future novel slug | Keep (pre-registered cover) |
| `"rs-v1-c1"`, `"rs-v1-c2"` | seed | Chapter slugs | Keep |
| `"es-v1-c1"` | seed | Chapter slug | Keep |
| `"mc-v1-c1"` | seed | Chapter slug | Keep |
| `"rs-v1-c1-illus"`, `"es-v1-c1-illus"` | illustrations | Illustration keys | Migrate to `Illustration.id` in DB |
| `"rec-1"`, `"rec-2"` | localStorage recommendations | Recommendation IDs | Already replaced by DB UUIDs |
| `"init-notification"` | localStorage notifications | Default notification | Replace with DB seed |
| `"admin"` | localStorage auth | Pseudo user ID | Already replaced by Supabase Auth UUID |

### State Currently Acting as Database

| localStorage Key | Entity | Migration Target |
|------------------|--------|------------------|
| `kult_novels_prod` | Novel[] | ✅ Migrated → Supabase (via API, localStorage = cache) |
| `kult_bookmarks_prod` | string[] (novelIds) | → `Bookmark` table (per-user) |
| `kult_history_prod` | ReadingHistory[] | → `ReadingHistory` table (per-user) |
| `kult_comments_prod` | Record<chapterId, Comment[]> | → `Comment` table |
| `kult_read_chapters_prod` | string[] (chapterIds) | → `ReadingHistory` or separate table |
| `kult_recommendations` | Recommendation[] | ✅ Migrated → Supabase (via API) |
| `kult_notifications_prod` | Notification[] | → `Announcement` table |
| `kult_active_user` | User | ✅ Migrated → Supabase Auth session |
| `kult_registered_users` | User[] (with passwords!) | ✅ Migrated → Supabase Auth |
| `kult_reader_settings` | ReaderSettings | KEEP in localStorage (permanent) |
| `kult_reader_position` | scroll position | KEEP in localStorage (ephemeral) |
| `kult_editor_draft` | Tiptap JSON draft | KEEP in localStorage (ephemeral) |
| `kult_stat_*` | Fake analytics numbers | DELETE (replace with real analytics) |

---

## Mock / Dummy Data Inventory

| Location | Content | Status |
|----------|---------|--------|
| `src/data/novels.ts` | 3 hardcoded novels with full chapter text | ✅ Seeded to DB, keep as seed script |
| `src/repositories/localStorage/recommendation.repository.ts` | 2 default recommendations | ✅ Seeded to DB |
| `src/repositories/localStorage/notification.repository.ts` | 1 welcome notification | Migrate to Announcement table seed |
| `src/features/admin/components/AnalyticsTab.tsx` | Fake stats (4280 daily, 24150 weekly, etc.) | Replace with real analytics |
| `src/features/admin/components/OverviewTab.tsx` | Fake pageviews (40420) | Replace with real analytics |
| `src/assets/covers/*.tsx` | 5 SVG cover components | Convert to R2 images |
| `src/assets/illustrations/*.tsx` | 2 SVG illustration components | Convert to R2 images |

---

## Settings that STAY in localStorage (by design)

| Key | Reason |
|-----|--------|
| `kult_reader_settings` | User preference, no security concern |
| `kult_reader_position` | Scroll position, ephemeral |
| `kult_editor_draft` | Auto-save draft, ephemeral |
| `sessionStorage:notification_dismissed_*` | Session-scoped UI state |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | HIGH | Export localStorage → JSON backup before swap |
| Admin lockout if env vars misconfigured | MEDIUM | Fallback: Supabase dashboard user management |
| Hydration mismatch if async Supabase call differs from SSR | MEDIUM | Stale-while-revalidate pattern (current) |
| RLS policy too permissive | HIGH | Test with non-admin user before production |
| Chapter content size in Postgres | LOW | `TEXT` type unlimited, consider R2 for 100KB+ |
| Base64 images bloating chapter content | HIGH | Migrate to R2 URLs before heavy content production |
| R2 presigned URL expiry | LOW | Use public bucket with CDN caching |
| SVG covers can't be easily served from R2 | LOW | Convert to PNG/WebP before uploading |

---

## Environment Variables Reference

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=         # Public project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Public anon key (RLS-protected)
SUPABASE_SERVICE_ROLE_KEY=        # Server-only, bypasses RLS

# Database
DATABASE_URL=                      # Prisma connection (port 5432 for migrations)

# Admin
ADMIN_EMAIL=                       # Admin user email
ADMIN_DEFAULT_PASSWORD=            # TEMPORARY — remove after Supabase Auth is sole auth
NEXT_PUBLIC_ADMIN_EMAIL=           # Client-side admin check (visible in bundle)

# Cloudflare R2
R2_ACCOUNT_ID=                     # Cloudflare account ID
R2_ACCESS_KEY_ID=                  # R2 API token key
R2_SECRET_ACCESS_KEY=              # R2 API token secret
R2_BUCKET_NAME=                    # Bucket name (e.g. malazbaca-assets)
R2_PUBLIC_URL=                     # CDN URL (e.g. https://assets.malazscans.com)
```
