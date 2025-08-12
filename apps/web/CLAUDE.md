# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Uniswap Web Interface - a React-based decentralized exchange application that's part of the Uniswap Universe monorepo. The web app enables users to swap tokens, provide liquidity, and interact with the Uniswap protocol across multiple blockchain networks.

## Essential Development Commands

### Daily Development

```bash
# Start development server
yarn dev

# Run type checking
yarn typecheck

# Run linting
yarn lint
yarn lint:fix

# Run tests
yarn test                    # Run all tests
yarn test:watch             # Watch mode
yarn test:set1              # Components only
yarn test:set2              # Pages and state
yarn test:set3              # Hooks, NFT, utils
yarn test:set4              # Remaining tests

# Run E2E tests
yarn playwright:test

# Build for production
yarn build:production
```

### Monorepo Commands (from root)

```bash
# Initial setup
yarn lfg                    # Full setup with env vars

# Global checks (all packages)
yarn g:typecheck
yarn g:lint
yarn g:test
yarn g:build

# Quick checks (changed files only)
yarn g:lint:changed
yarn g:typecheck:changed
yarn g:format:changed
```

## Architecture & Code Organization

### Key Technologies

- **Framework**: React with TypeScript
- **Build**: Vite (primary) with experimental Rolldown, Craco/webpack (legacy)
- **State**: Redux Toolkit, React Query, Jotai
- **Styling**: Styled Components, Tamagui UI framework
- **Web3**: Wagmi, Ethers.js, Web3-React
- **Testing**: Vitest (unit), Playwright (E2E), Storybook (visual)

### Directory Structure

```tree
apps/web/src/
├── components/          # Reusable UI components
├── pages/              # Route-based page components
├── state/              # Redux slices and state logic
├── hooks/              # Custom React hooks
├── connection/         # Web3 wallet connection logic
├── lib/                # External library integrations
├── nft/                # NFT marketplace features
├── utils/              # Utility functions
└── constants/          # App-wide constants
```

### Key Architectural Patterns

1. **Feature-based Organization**: Code is organized by feature/domain rather than by file type
2. **Shared UI Library**: Uses `@uniswap/ui` package from `packages/ui` for consistent components
3. **Strong TypeScript**: Strict typing with comprehensive type definitions
4. **GraphQL Code Generation**: Auto-generated types from GraphQL schemas
5. **Test Colocation**: Unit tests live alongside source files as `.test.ts(x)`

### Testing Strategy

- **Unit Tests**: Use Vitest, focus on logic and hooks
- **Component Tests**: Use React Testing Library with TestID enum
- **E2E Tests**: Playwright tests with `.e2e.test.ts` extension
- **Visual Tests**: Storybook for component documentation and testing

### Important Development Notes

1. **Environment Variables**: Managed via 1Password CLI - run `yarn lfg` for setup
2. **Node Version**: Must use Node at the version specified in @.nvmrc
3. **Imports**: Use absolute imports within the app (enforced by ESLint)
4. **TestIDs**: Use the TestID enum instead of string literals for test selectors
5. **GitHub Actions**: External actions must be pinned to commit hashes with version comments

### Common Workflows

**Adding a new feature:**

1. Create feature directory under appropriate section
2. Follow existing patterns for component structure
3. Add Redux slice if state management needed
4. Write tests alongside implementation
5. Update GraphQL queries if needed

**Debugging blockchain interactions:**

```bash
# Start local Ethereum fork
yarn anvil:mainnet

# Start local Base fork
yarn anvil:base
```

**Working with translations:**

```bash
yarn i18n:extract      # Extract new strings
yarn i18n:upload       # Upload to Crowdin
yarn i18n:download     # Download translations
```

### Code Style Guidelines

- Follow existing patterns in neighboring files
- No unnecessary comments unless explicitly needed
- Use Tamagui components from `@uniswap/ui` when available
- Maintain consistency with Web3 naming conventions
- Always check existing imports before adding new dependencies
