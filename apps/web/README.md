# Uniswap Labs Web Interface

## Accessing the Uniswap Interface

To access the Uniswap Interface, use an IPFS gateway link from the
[latest release](https://github.com/Uniswap/uniswap-interface/releases/latest),
or visit [app.uniswap.org](https://app.uniswap.org).

## Tech Stack

- **Build**: Vite with experimental Rolldown support
- **Deployment**: Cloudflare Workers via `@cloudflare/vite-plugin`
- **Edge Functions**: Hono.js for SSR meta tags and OG image generation

## Prerequisites

- **Node.js version** - Use the version specified in `.nvmrc`. Run `nvm use` to switch.
- **Bun** - Package manager
- **1Password CLI** - Required for environment variables (run `bun lfg` from monorepo root for full setup)

## Running Locally

```bash
bun install
bun web dev
```

The dev server runs on port 3000 by default.

Using a different port may cause CORS errors for certain Uniswap Backend services.

## Development Commands

| Command | Description |
|---------|-------------|
| `bun web dev` | Start development server |
| `bun web build:production` | Production build |
| `bun web preview` | Preview production build locally |
| `bun web typecheck` | Run type checking |
| `bun web test` | Run unit tests |
| `bun web e2e` | Run E2E Playwright tests with prod build |
| `bun web e2e:dev` | Run E2E Playwright tests with dev build |

## Translations

To get translations to work you'll need to set up 1Password, and then:

```bash
eval $(op signin)
```

Sign into 1Password, then:

```bash
bun mobile env:local:download
```

Which downloads a `.env.defaults.local` file at the root. Finally:

```bash
bun web i18n:download
```

Which will download the translations to `./apps/web/src/i18n/locales/translations`.

## Console Debugging

Log messages show `logger.ts` as the source instead of the actual calling file. To see actual calling locations, add these files to Chrome's ignore list (DevTools → Sources → right-click file → "Add script to ignore list"):
- `packages/utilities/src/logger/logger.ts`
- `packages/utilities/src/telemetry/analytics/logging.ts`

## Further Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed development guidance, architecture patterns, and workflows.

See [the e2e skill](../../.claude/skills/web-e2e/SKILL.md) for information about creating and running e2e tests.
