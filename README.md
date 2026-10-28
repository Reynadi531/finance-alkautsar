# keuangan-alkautsar

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Self, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/web/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the fullstack application.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@keuangan-alkautsar/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Environment Configuration

Each app owns its environment schema in `.env.schema`. Varlock generates `src/env.ts` during installation; run `bun run env:generate` after changing a schema. Commit schemas, and keep secrets in ignored env files or your deployment platform.

Import the generated `ENV` accessor in application code. Shared database and auth packages receive configuration or initialized clients from the application. See [Varlock's monorepo guide](https://varlock.dev/guides/monorepos/).

Bun's automatic env loading is disabled in `bunfig.toml`; the framework integration or server bootstrap loads Varlock. Node deployments must include Varlock and its dependencies alongside the app schema.

Run standalone Node/Bun tools that use Varlock from the owning app directory so they load that app's schema and env files. `env:generate` only generates TypeScript files; it does not initialize environment values in a subsequent command.

## Deployment

### Docker Compose

- Target: web + server
- Config: `docker-compose.yml` (app Dockerfiles live in `apps/*/Dockerfile`)
- Build images: bun run docker:build
- Start: bun run docker:up
- Logs: bun run docker:logs
- Stop: bun run docker:down

Environment variables are read from each app's `.env` file at container start and overridden in `docker-compose.yml` for container networking. The image bakes in no secrets.

### Prebuilt image (GHCR)

`.github/workflows/docker.yml` builds `apps/web/Dockerfile` (Alpine, `linux/amd64` + `linux/arm64`) and pushes it to `ghcr.io/reynadi531/finance-alkautsar` on every push to `main` (`latest`, `main`, `sha-…`) and on `v*` tags (`1.2.3`, `1.2`). Pull requests build without pushing.

To deploy it, copy `docker-compose.prod.yml` to the server with a `.env` next to it (template: `.env.prod.example`) that sets `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `POSTGRES_PASSWORD`, `RUSTFS_ACCESS_KEY` and `RUSTFS_SECRET_KEY` (optionally `WEB_IMAGE_TAG` and `WEB_PORT`), then:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

The image does not apply the database schema; run `bun run db:push` against the production database first. If the GHCR package is private, `docker login ghcr.io` on the server with a token that has `read:packages`.

For more details, see the guide on [Deploying with Docker Compose](https://www.better-t-stack.dev/docs/guides/docker).

## Git Hooks and Formatting

- Run checks: `bun run check`

## Project Structure

```
keuangan-alkautsar/
├── apps/
│   └── web/         # Fullstack application (React + TanStack Start)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Oxlint and Oxfmt
- `bun run docker:build`: Build the Docker Compose images
- `bun run docker:up`: Build and start the Docker Compose stack
- `bun run docker:logs`: Tail logs from the Docker Compose stack
- `bun run docker:down`: Stop the Docker Compose stack

## Better Auth Schema Generation

After changing auth plugins or schema options, run `bun run auth:generate` from the project root. The script runs the Better Auth CLI through `varlock run` from the owning app directory, loading the auth instance from `src/services.ts`. Review the schema changes, then use your ORM's migration workflow to apply them.

## Deploying to Vercel

The web app builds with Nitro's `vercel` preset whenever `VERCEL` is set, and with `node-server` otherwise (Docker). On Vercel, Varlock bakes the resolved env into the server bundle, encrypted with `_VARLOCK_ENV_KEY`.

1. Import the repo in Vercel and set **Root Directory** to `apps/web`. `apps/web/vercel.json` sets the install and build commands.
2. Generate an encryption key per environment and add it as an env var, available at build and runtime:

   ```bash
   cd apps/web
   bun x varlock generate-key --plain | vercel env add _VARLOCK_ENV_KEY production --sensitive
   bun x varlock generate-key --plain | vercel env add _VARLOCK_ENV_KEY preview --sensitive
   ```

3. Add the remaining variables from `apps/web/.env.schema`: `BETTER_AUTH_SECRET`, `DATABASE_URL` (use a pooled connection string, e.g. Neon or Supabase pooler), and the `S3_*` values for real object storage (AWS S3, Cloudflare R2, …).
4. `BETTER_AUTH_URL` defaults to the production domain on production and the deployment URL on previews. Set it explicitly to pin a custom domain.
5. Apply the schema to the production database from your machine, then create the first admin:

   ```bash
   DATABASE_URL=<production-url> bun run db:push
   DATABASE_URL=<production-url> ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_NAME=… bun run db:seed:admin
   ```

Vercel limits request bodies to 4.5 MB, which caps file uploads below the app's 5 MB limit.
