# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Uniswap Web Interface - a React-based decentralized exchange application that's part of the Uniswap Universe monorepo. The web app enables users to swap tokens, provide liquidity, and interact with the Uniswap protocol across multiple blockchain networks.

## Essential Development Commands

### Daily Development

```bash
# Start development server
bun dev

# Run type checking
bun typecheck

# Run linting
bun lint
bun lint:fix

# Run tests
bun run test                   # Run all tests
bun run test:watch             # Watch mode
bun run test:set1              # Components only
bun run test:set2              # Pages and state
bun run test:set3              # Hooks, NFT, utils
bun run test:set4              # Remaining tests

# Build for production
bun build:production

# Run production preview web server
bun preview

# Run E2E Playwright tests
bun e2e                         # Run all e2e tests
bun e2e:no-anvil                # Run non-anvil e2e tests
bun e2e:anvil                   # Run anvil e2e tests
bun e2e ExampleTest.e2e.test    # Run a specific test file
```

### Monorepo Commands (from root)

```bash
# Initial setup
bun lfg                    # Full setup with env vars

# Global checks (all packages)
bun g:typecheck
bun g:lint
bun g:test
bun g:build

# Quick checks (changed files only)
bun g:lint:changed
bun g:typecheck:changed
bun g:format:changed
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

1. **Environment Variables**: Managed via 1Password CLI - run `bun lfg` for setup
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
bun anvil:mainnet

# Start local Base fork
bun anvil:base
```

**Working with translations:**

```bash
bun i18n:extract      # Extract new strings
bun i18n:upload       # Upload to Crowdin
bun i18n:download     # Download translations
```

### Code Style Guidelines

- Follow existing patterns in neighboring files
- No unnecessary comments unless explicitly needed
- Use Tamagui components from `@uniswap/ui` when available
- Maintain consistency with Web3 naming conventions
- Always check existing imports before adding new dependencies
