# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the Uniswap Browser Extension, part of the Universe monorepo. The extension allows users to interact with the Uniswap Protocol directly from their browser, providing wallet functionality, token swaps, and dApp connectivity.

## Key Commands

### Development

```bash
# Install dependencies (from repo root)
bun install

# Start development server (from apps/extension)
# WXT build system (new, preferred)
bun start           # WXT development server (port 9998)
bun start:absolute  # WXT with absolute paths (required for Scantastic API testing)

# Legacy webpack build system (still available during migration)
bun start:webpack   # Webpack development server (port 9997)

# Build production bundle
bun build:production
```

### Testing & Code Quality

```bash
# Run tests
bun run test

# Update snapshots
bun snapshots

# Type checking
bun typecheck

# Linting
bun lint
bun lint:fix

# Format code
bun format

# Check for circular dependencies
bun check:circular
```

### Environment Setup

```bash
# Download environment variables from 1password
bun env:local:download

# Upload environment variables to 1password
bun env:local:upload
```

## Architecture Overview

### Monorepo Structure

This extension is part of the Universe monorepo using bun workspaces and NX:

- `/apps/extension/` - This browser extension
- `/apps/mobile/` - React Native mobile app
- `/apps/web/` - Web interface
- `/packages/` - Shared packages used across apps
  - `@uniswap/ui` - Shared UI components (Tamagui-based)
  - `@uniswap/wallet` - Core wallet functionality
  - `@uniswap/utilities` - Shared utilities
  - `@uniswap/uniswap` - Uniswap protocol interactions

### Extension Entry Points

The extension has multiple entry points for different contexts (WXT structure):

- `src/entrypoints/background.ts` - Background service worker
- `src/entrypoints/sidepanel/main.tsx` - Main sidebar UI (primary interface)
- `src/entrypoints/fallback-popup/main.tsx` - Extension popup fallback
- `src/entrypoints/onboarding/main.tsx` - Onboarding flow
- `src/entrypoints/unitagClaim/main.tsx` - Unitag claim interface
- `src/entrypoints/injected.content.ts` - Injected script for dApp communication
- `src/entrypoints/ethereum.content.ts` - Ethereum provider implementation

Each UI entry point has an associated `index.html` file in its directory.

### WXT Migration Status

The extension is currently migrating from Webpack to WXT build system:

- ✅ **Complete**: WXT configuration, entry points restructure, Vite-based builds
- 🔄 **In Progress**: Full migration from legacy webpack system
- 📁 **Directory Changes**:
  - `src/entry/` → `src/entrypoints/` (with HTML files for UI entries)
  - Content scripts moved to `src/entrypoints/*.content.ts`
  - Background script moved to `src/entrypoints/background.ts`
- ⚙️ **Build Systems**: Both WXT (`wxt.config.ts`) and Webpack (`webpack.config.js`) are currently available
- 🚪 **Development Ports**: WXT uses port 9998, Webpack uses port 9997

### State Management

- Uses Redux Toolkit with Redux Saga for async operations
- Redux Persist for state persistence across sessions
- **Important**: When modifying state schema, you MUST add a migration in `src/store/migrations.ts`
- State is synchronized between background and UI contexts

### Key Feature Areas

- `/src/app/features/accounts/` - Account management and authentication
- `/src/app/features/dapp/` - DApp connection and request handling
- `/src/app/features/swap/` - Token swap functionality
- `/src/app/features/onboarding/` - User onboarding flows
- `/src/app/features/settings/` - Settings and preferences

### Component Architecture

- UI components use Tamagui (React Native Web based)
- Feature-based folder structure with screens and components
- Shared components in `/src/app/components/`
- Navigation system in `/src/app/navigation/`

## Development Guidelines

### Working with Shared Packages

When modifying shared packages:

1. Changes in `/packages/` affect multiple apps
2. Run builds from repo root to ensure all apps still work
3. Test changes in both extension and mobile contexts when applicable

### Redux State Migrations

When modifying Redux state structure:

1. Add a migration function in `src/store/migrations.ts`
2. Increment the version number in persistence config
3. Test migration with existing state data
4. Document breaking changes

### Environment Variables

- Development env vars are stored in 1password
- Use `bun env:local:download` to fetch them
- Never commit `.env` files
- API URLs can be overridden in `.env` for testing

### Testing with Scantastic API

When testing Scantastic features:

```bash
# Must use absolute paths
bun start:absolute
```

### Chrome Extension Specifics

#### WXT System

- Manifest is generated dynamically in `wxt.config.ts`
- Background script runs as a service worker (not persistent)
- Content scripts configured in WXT config
- Side panel API support for main UI
- Use Chrome Storage API for extension-specific data

#### Legacy System (During Migration)

- Static `src/manifest.json` with build-time modifications
- Background and content scripts defined separately

### Build Process

The extension supports two build systems during the WXT migration:

#### WXT Build System (New, Preferred)

- Configuration in `wxt.config.ts`
- Vite-based build system for better performance
- Built-in React support via `@wxt-dev/module-react`
- Dynamic manifest generation
- Integrated development server with HMR
- Source maps available in development

#### Webpack Build System (Legacy, During Migration)

- Configuration in `webpack.config.js`
- Code splitting enabled for better performance
- Hot Module Replacement (HMR) enabled for faster development

## Important Notes

1. **Public Mirror**: This is a public mirror of a private repository. Pull requests are not accepted here.

2. **Shared Code**: The extension shares significant code with the mobile app through packages. Ensure compatibility when making changes.

3. **Security**: Never expose sensitive data in logs or commits. The extension handles private keys and sensitive user data.

4. **Performance**: The extension runs in constrained environments. Be mindful of bundle size and memory usage.

5. **Browser Compatibility**: Focus on Chrome/Chromium-based browsers. Firefox support may require additional considerations.

6. **DApp Communication**: The extension injects scripts into web pages. Be extremely careful with security when modifying injection logic.
