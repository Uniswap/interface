# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Uniswap Universe is a monorepo containing all Uniswap front-end interfaces:

- **Web** (`apps/web/`) - Decentralized exchange web interface
- **Mobile** (`apps/mobile/`) - React Native app for iOS/Android
- **Extension** (`apps/extension/`) - Browser wallet extension

## Common Development Commands

### Setup

```bash
# Initial setup (requires 1Password CLI)
yarn install
yarn local:check
yarn lfg  # Sets up mobile and extension
```

### Development Servers

```bash
yarn web dev        # Web with Vite
yarn mobile ios          # iOS app
yarn mobile android      # Android app
yarn extension start     # Extension
```

### Building

```bash
yarn g:build                      # Build all packages
yarn web build:production    # Web production build
yarn mobile ios:bundle            # iOS bundle
yarn mobile android:release       # Android release
yarn extension build:production   # Extension production
```

### Testing

```bash
yarn g:test                      # Run all tests
yarn g:test:coverage             # With coverage
yarn web playwright:test         # Web E2E tests
yarn mobile e2e                  # Mobile E2E tests
```

### Code Quality

```bash
yarn g:lint:fix                  # Fix linting issues
yarn g:typecheck                 # Type check all packages
yarn g:format:fix                # Fix formatting
yarn g:fix                       # Run both lint and format fix
```

## Architecture Overview

### Monorepo Structure

- **Turborepo** for build orchestration
- **Yarn workspaces** for package management
- Shared code in `packages/` directory
- App-specific code in `apps/` directory

### Key Technologies

- **TypeScript** everywhere
- **React** for web/extension
- **React Native** for mobile
- **Redux Toolkit** for state management
- **Tamagui** for cross-platform UI components
- **Ethers.js/Viem** for blockchain interactions

### Code Organization Principles

#### Styling

- **ALWAYS** use `styled` from `ui/src` (never styled-components or direct Tamagui)
- Use theme tokens instead of hardcoded values
- Platform-specific files: `Component.ios.tsx`, `Component.android.tsx`

#### State Management

- **Redux** for complex global state
- **Jotai** for simple state
- Keep state as local as possible
- No custom hooks for simple data fetching - use `useQuery`/`useMutation` directly

#### Component Structure

1. State declarations at top
2. Event handlers after state
3. Memoize properly, especially for anything that might be used in the React Native app
4. JSX at the end
5. Keep components under 250 lines

#### TypeScript Conventions

- Do not use `any`, prefer `unknown`
- Always consider strict mode
- Use explicit return types
- PascalCase for types/interfaces
- camelCase for variables/functions
- String enums with initializers

## Testing + Formatting Guidelines

- Test behaviors, not implementations
- Always update existing unit tests related to changes made
- Run tests before considering a task to be 'complete'
- Also run linting and typecheck before considering a task to be 'complete'

## Critical Development Notes

1. **Environment Variables**: Override URLs in `.env.defaults.local` (mobile) or `.env` (extension)
2. **Pre-commit Hooks**: Use `--no-verify` to skip or set `export HUSKY=0` to disable
3. **Python Setup**: Run `brew install python-setuptools` if you encounter Python module errors
4. **Mobile Development**: Always run `yarn mobile pod` after dependency changes
5. **Bundle Size**: Monitor bundle size impacts when adding dependencies

## Package Dependencies

Core shared packages:

- `packages/ui/` - Cross-platform UI components and theme
- `packages/uniswap/` - Core business logic and utilities
- `packages/wallet/` - Wallet functionality
- `packages/utilities/` - Common utilities

## Blockchain Integration

- Support for multiple chains (Ethereum, Arbitrum, Optimism, etc.)
- Uniswap Protocol v2, v3, and v4 support
- Multiple wallet providers (WalletConnect, Metamask, etc.)
- Transaction building and gas estimation

## Other Considerations

Be cognizant of the app or package within which a given change is being made. Be sure to reference that app or package's respective `CLAUDE.md` file and other local configuration files, including (but not limited to): `package.json`, `tsconfig.json`, etc.
