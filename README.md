# Kualisto

Luxury catamaran culinary & inventory management — Next.js 16, Supabase, shadcn/ui, bilingual (EN/ES).

## Setup

1. Copy `.env.local.example` to `.env.local` and add your Supabase project credentials.
2. Apply the database migration:

```bash
npx supabase db reset   # local
# or push to remote:
npx supabase link
npx supabase db push
```

3. Create users in Supabase Auth and set `app_metadata.role` to `renta`, `socio`, `chef`, or `admin`.

4. Run the app:

```bash
npm run dev
```

## Routes

| Role | Path |
|------|------|
| Guest (Renta/Socio) | `/{locale}/guest/trip/new` → wizard steps 1–4 |
| Chef | `/{locale}/chef/dashboard` |
| Admin | `/{locale}/admin/dashboard` |

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4 + shadcn-style UI (gold `#C4A052`, marine `#1B3A4B`)
- Supabase (Auth, Postgres, RLS, Realtime)
- next-intl (English / Spanish)
