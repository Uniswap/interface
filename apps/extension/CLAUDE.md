# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the Uniswap Browser Extension, part of the Universe monorepo. The extension allows users to interact with the Uniswap Protocol directly from their browser, providing wallet functionality, token swaps, and dApp connectivity.

## Key Commands

### Development

```bash
# Install dependencies (from repo root)
yarn install

# Start development server (from apps/extension)
yarn start

# Start with absolute paths (required for Scantastic API testing)
yarn start:absolute

# Build production bundle
yarn build:production
```

### Testing & Code Quality

```bash
# Run tests
yarn test

# Update snapshots
yarn snapshots

# Type checking
yarn typecheck

# Linting
yarn lint
yarn lint:fix

# Format code
yarn format

# Check for circular dependencies
yarn check:circular
```

### Environment Setup

```bash
# Download environment variables from 1password
yarn env:local:download

# Upload environment variables to 1password
yarn env:local:upload
```

## Architecture Overview

### Monorepo Structure

This extension is part of the Universe monorepo using yarn workspaces and Turborepo:

- `/apps/extension/` - This browser extension
- `/apps/mobile/` - React Native mobile app
- `/apps/web/` - Web interface
- `/packages/` - Shared packages used across apps
  - `@uniswap/ui` - Shared UI components (Tamagui-based)
  - `@uniswap/wallet` - Core wallet functionality
  - `@uniswap/utilities` - Shared utilities
  - `@uniswap/uniswap` - Uniswap protocol interactions

### Extension Entry Points

The extension has multiple entry points for different contexts:

- `src/entry/background.ts` - Background service worker
- `src/entry/sidebar.tsx` - Main sidebar UI (primary interface)
- `src/entry/popup.tsx` - Extension popup
- `src/entry/onboarding.tsx` - Onboarding flow
- `src/entry/injected.ts` - Injected script for dApp communication
- `src/entry/ethereum.ts` - Ethereum provider implementation

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
- Use `yarn env:local:download` to fetch them
- Never commit `.env` files
- API URLs can be overridden in `.env` for testing

### Testing with Scantastic API

When testing Scantastic features:

```bash
# Must use absolute paths
yarn start:absolute
```

### Chrome Extension Specifics

- Manifest is generated dynamically from `manifest.ts`
- Background script runs as a service worker (not persistent)
- Content scripts are injected for dApp communication
- Use Chrome Storage API for extension-specific data

### Build Process

- Webpack configuration supports multiple environments
- Code splitting enabled for better performance
- Source maps available in development
- Hot Module Replacement (HMR) enabled for faster development

## Important Notes

1. **Public Mirror**: This is a public mirror of a private repository. Pull requests are not accepted here.

2. **Shared Code**: The extension shares significant code with the mobile app through packages. Ensure compatibility when making changes.

3. **Security**: Never expose sensitive data in logs or commits. The extension handles private keys and sensitive user data.

4. **Performance**: The extension runs in constrained environments. Be mindful of bundle size and memory usage.

5. **Browser Compatibility**: Focus on Chrome/Chromium-based browsers. Firefox support may require additional considerations.

6. **DApp Communication**: The extension injects scripts into web pages. Be extremely careful with security when modifying injection logic.
