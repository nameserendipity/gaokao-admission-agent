# MVP Deploy Guide

## Current MVP scope

- Next.js app, suitable for local testing and Vercel deployment.
- Admission data is stored in local SQLite. Runtime file: `data/admission_clean.db`.
- Git should commit the compressed database only: `data/admission_clean.db.gz`.
- `pnpm build` runs `prebuild`, which extracts `.db.gz` back to `.db` when needed.
- Teacher methodology / experience notes live in `data/teacher-knowledge/`.
- DeepSeek and Tavily are optional environment variables. The app still works without them, but Agent answers are weaker.

## Local run

```powershell
pnpm install
pnpm prepare:data
pnpm dev
```

Open: `http://localhost:5000`

## Environment variables

Create `.env.local` from `.env.local.example`:

```env
DEEPSEEK_API_KEY=your_deepseek_key
DEEPSEEK_MODEL=deepseek-chat
TAVILY_API_KEY=your_tavily_key
```

Do not commit `.env.local`.

## Vercel settings

- Install Command: `pnpm install`
- Build Command: `pnpm build`
- Output: Next.js default
- Environment Variables: set the same keys in Vercel Project Settings.

## Files to commit

Commit:

- `src/`
- `data/admission_clean.db.gz`
- `data/teacher-knowledge/`
- `scripts/prepare-admission-db.mjs`
- `package.json`, `pnpm-lock.yaml`

Do not commit:

- `.env.local`
- `data/admission_clean.db`
- `.next/`
- `node_modules/`

## Current limitations

- Tavily can help find webpages, but it cannot reliably parse every official Excel/PDF admission table yet.
- The first MVP uses local structured data as the main evidence source.
- Auth, payment, user accounts, analytics, and monitoring are not required for the first online MVP.
