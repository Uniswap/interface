# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Ring Protocol

Ring Protocol is a liquidity and capital-efficiency protocol built around **FEW (Financial Elastic Wrapping)**. Its core mechanism wraps ERC-20 assets into **FewToken**, which is then used across trading systems to amplify usable liquidity. Key products:

- **Few Protocol** — the core wrapping layer (ERC-20 → FewToken)
- **Ring Swap (v2)** — Ring's own AMM/DEX built around FewToken
- **Ring Interface** — this frontend repo, a fork of the Uniswap interface
- **Uniswap v4 Integration** — FewToken deployed in Uniswap v4 liquidity environments

The codebase is a heavily modified Uniswap Interface fork. Ring-protocol SDK packages (`@ring-protocol/sdk-core`, etc.) are aliased at build time to their Uniswap equivalents to prevent `instanceof` mismatches.

## Monorepo Structure

This is a Yarn workspaces + Turborepo monorepo:

```
apps/web/          # Main React frontend (primary work area)
packages/uniswap/  # Shared Uniswap/Ring protocol logic, hooks, and types
packages/ui/       # Tamagui-based shared component library
packages/utilities/# Shared utility functions
```

All commands below should be run from `apps/web/` unless noted otherwise.

## Commands

### Development
```bash
# From apps/web/
yarn start                    # Dev server (craco/webpack, default)
yarn vite:dev                 # Dev server (vite, faster iteration)
```

### Build
```bash
yarn build:production         # Production build (uses .env.production)
yarn build:development        # Development build (uses .env.development)
```

### Lint & Type Check
```bash
yarn lint                     # ESLint with caching
yarn lint:fix                 # ESLint auto-fix
yarn typecheck                # tsc + cloud functions typecheck
```

### Test
```bash
yarn test                     # Run all unit tests (no watch)
yarn test:watch               # Run tests in watch mode
yarn test:set1                # Tests in src/components only
yarn test:set2                # Tests in src/pages and src/state
```

### Monorepo-level (from repo root)
```bash
yarn g:build                  # Build all packages in parallel (turbo)
yarn g:lint                   # Lint all packages
yarn g:typecheck              # Type-check all packages
```

## Architecture

### Tech Stack
- **Framework**: React 18 + React Router v6
- **Build**: Craco (webpack) as primary; Vite (rolldown) as modern alternative
- **State**: Redux Toolkit + Redux Saga; TanStack Query for server state; wagmi for blockchain state
- **Web3**: wagmi v2 + viem v2 for blockchain interactions; ethers.js v5 for legacy contract compatibility
- **GraphQL**: Apollo Client v3 (subgraph queries for tokens, pools, transactions)
- **UI**: Tamagui + react-native-web (cross-platform component system)
- **Feature flags**: Statsig

### Provider Hierarchy (`apps/web/src/index.tsx`)

Providers wrap the app in this order (outermost first):
Redux → Apollo → Wagmi → QueryClientPersist → Theme/Tamagui → Statsig → Helmet

### State Management

| Concern | Tool |
|---|---|
| Swap form state | `SwapFormContext` (from `packages/uniswap`) |
| Blockchain data (account, chain, balances) | wagmi hooks |
| Swap routing calculation | RTK Query (`state/routing/`) |
| Transaction watching | Redux Saga (`state/sagas/`) |
| Persisted app state | redux-persist (localStorage + IndexedDB) |

### Routing (`apps/web/src/pages/RouteDefinitions.tsx`)

High-traffic pages (`/`, `/swap`, `/ringwrap`) are **eagerly loaded**. All other pages use `React.lazy`. Key routes:

| Route | Page |
|---|---|
| `/swap` | Swap interface |
| `/ringwrap` | FewToken wrapping flow |
| `/explore` | Token/pool discovery |
| `/pool` | Liquidity management (v2, v3, Few v2) |
| `/lending` | Markets overview (in development) |
| `/vaults/:id` | Vault detail pages |

### SDK Aliasing (Critical)

`@ring-protocol/*` packages are aliased to `@uniswap/*` equivalents in `vite.config.mts` and `craco.config.cjs` to ensure module identity (preventing `instanceof` failures across package boundaries). When adding new Ring SDK imports, follow this same aliasing pattern.

### Ring-Specific Features

- **RingWrap** (`pages/RingWrap/`): Dedicated flow for wrapping ERC-20 → FewToken. Mirrors the swap flow but uses `RingWrapFlow` instead of `SwapFlow`.
- **FewV2PositionPage** (`pages/Pool/Positions/FewV2PositionPage`): Position management for Few v2 LP positions.
- **Markets / MarketDetails** (`pages/Markets/`, `pages/MarketDetails/`): Lending markets UI, currently in development.

### Chain & RPC Configuration

`apps/web/src/components/Web3Provider/wagmiConfig.ts` — defines supported chains, RPC URLs (QuickNode primary + public fallback), and wallet connectors (MetaMask, WalletConnect, Coinbase, Safe, EmbeddedWallet).

### Env Files

- `.env.production` — production API keys and endpoints
- `.env.development` — development overrides

Environment variables work with both `REACT_APP_` (craco) and plain prefixes (vite reads all env vars via `loadEnv(mode, cwd, '')`).
