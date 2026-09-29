# World Folkloric Music Archive

A discovery-first archive for exploring traditional folkloric music through recordings, regions, instruments, and cultural context.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/folkloric-music-archive/src/` — React + Vite frontend, routes, archive pages, and visual theme.
- `artifacts/api-server/src/routes/recordings.ts` — archive API endpoints and read-only discovery filters.
- `lib/api-spec/openapi.yaml` — source of truth for the archive API contract and generated client hooks.
- `lib/db/src/schema/recordings.ts` — Drizzle schema for archive recordings.
- `artifacts/folkloric-music-archive/public/archive-assets/` — generated editorial imagery used by seeded records.

## Architecture decisions

- The first build is discovery-first and read-only: it establishes browse/search/detail patterns before adding contributor workflows or accounts.
- API contracts are defined in OpenAPI and consumed through generated React Query hooks instead of handwritten client fetches.
- Region and instrument summaries are derived from recording data so archive navigation stays consistent with the records users can browse.
- Seeded archive imagery is local to the web artifact so the first preview does not depend on an external image service.

## Product

- Browse featured and recent traditional music recordings.
- Search by title, tradition, community, instrument, region, country, form, or tag.
- Open a field-note style detail page with provenance, duration, community, and collection context.
- Explore indexed regions and instruments from the archive.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
