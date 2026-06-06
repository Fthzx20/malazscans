# Supabase Repository Implementations

This directory will contain the Supabase implementations of the repository interfaces.

## Migration Steps

1. Install `@supabase/supabase-js`
2. Create `client.ts` with Supabase client initialization
3. Implement each repository interface:
   - `auth.repository.ts` → Supabase Auth (email/password, sessions, RLS)
   - `novel.repository.ts` → Supabase Postgres (novels table)
   - `comment.repository.ts` → Supabase Postgres (comments table)
   - `library.repository.ts` → Supabase Postgres (bookmarks, history per user)
   - `recommendation.repository.ts` → Supabase Postgres (recommendations table)
   - `notification.repository.ts` → Supabase Postgres (announcements table)
4. `settings.repository.ts` can remain as localStorage (no security concern)
5. Update `src/repositories/index.ts` to instantiate Supabase classes

## RLS Policies Required

- `novels`: public read, admin write
- `volumes`: public read, admin write
- `chapters`: public read, admin write
- `comments`: public read, authenticated create, own-row update/delete, admin full
- `bookmarks`: authenticated own-row only
- `reading_history`: authenticated own-row only
- `recommendations`: public read, admin write
- `announcements`: public read (published only), admin full
