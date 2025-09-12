# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Overview

The `wallet` package is a core shared package in the Uniswap Universe monorepo that provides wallet functionality, blockchain interactions, and shared business logic for the mobile app, web interface, and browser extension.

## Development Commands

```bash
# Install dependencies (from monorepo root)
bun install

# Run tests
bun run test

# Run tests with coverage
bun run test --coverage

# Update test snapshots
bun snapshots

# Type checking
bun typecheck

# Linting
bun lint
bun lint:fix

# Format code
bun format

# Check dependency usage
bun check:deps:usage
```

## Architecture Overview

### Key Modules

1. **State Management** (`src/state/`)
   - Redux state configuration with Redux Toolkit
   - Redux-persist for state persistence
   - Saga middleware for side effects
   - Migration system for schema updates

2. **Wallet Core** (`src/features/wallet/`)
   - Account management (creation, import, view-only)
   - Keyring implementation for secure key storage
   - Native signer integration
   - Smart wallet support

3. **Transactions** (`src/features/transactions/`)
   - Transaction building and execution
   - Swap, send, wrap functionality
   - Gas estimation and fee calculation
   - Transaction watchers and sagas
   - Order management

4. **Providers** (`src/features/providers/`)
   - Provider management
   - Viem client management
   - Network switching

5. **Smart Wallet** (`src/features/smartWallet/`)
   - Smart wallet creation and management
   - Delegation system
   - Fee calculations
   - Modal flows for user education

6. **NFTs** (`src/features/nfts/`)
   - NFT display and management
   - Context menus for NFT actions
   - NFT transfers

7. **Notifications** (`src/features/notifications/`)
   - Toast notification system
   - Transaction status notifications
   - Platform-specific implementations

8. **Authentication** (`src/features/auth/`)
   - Biometric authentication
   - Password management
   - Passkey support

### Platform-Specific Code

- Use `.native.ts` extension for React Native specific code
- Use `.web.ts` extension for web-specific code
- Default `.ts` files should contain shared logic

### Testing Strategy

1. **Unit Tests**: Jest with React Native Testing Library
2. **Test Fixtures**: Comprehensive fixture system in `src/test/fixtures/`
3. **Mock Providers**: GraphQL and provider mocks in `src/test/mocks/`
4. **Test Utilities**: Helper functions in `src/test/test-utils.ts`

### State Migrations

When modifying Redux state schema:

1. Update migration version in the consuming app (mobile/extension)
2. Create migration function in the app's migrations file
3. Write tests for the migration
4. Update schema types

### Key Dependencies

- **Blockchain**: ethers.js, viem, @uniswap/sdk-core
- **State**: Redux Toolkit, Redux-Saga, Redux-Persist
- **UI**: React Native components, Tamagui integration
- **GraphQL**: Apollo Client with cache persistence
- **Security**: Keyring for secure storage, no-yolo-signatures

## Code Patterns

### Saga Usage

```typescript
// Use typed-redux-saga for type safety
import { call, put } from 'typed-redux-saga'

function* mySaga() {
  const result = yield* call(apiFunction)
  yield* put(actionCreator(result))
}
```

### Platform-Specific Imports

```typescript
// In a shared file
import { useCopyToClipboard } from './useCopyToClipboard'

// Implementation files:
// - useCopyToClipboard.native.ts (React Native)
// - useCopyToClipboard.web.ts (Web)
// - useCopyToClipboard.ts (shared interface)
```

### Component Structure

```typescript
// Follow the component structure from the main CLAUDE.md:
// 1. State declarations
// 2. Event handlers
// 3. Memoization
// 4. JSX
```

## Common Tasks

### Adding a New Feature

1. Create feature directory in `src/features/`
2. Add Redux slice if needed
3. Add saga if side effects are required
4. Export from feature's index.ts
5. Add to wallet reducer if persisted

### Working with Transactions

1. Use `TransactionRequest` type from ethers
2. Implement saga for async operations
3. Add watcher saga for monitoring
4. Use proper gas estimation utilities

### Testing Components

```typescript
import { render } from 'wallet/src/test/render'
import { preloadedWalletState } from 'wallet/src/test/fixtures'

// Use preloaded state for consistent testing
const { getByText } = render(<Component />, {
  preloadedState: preloadedWalletState(),
})
```

## Important Notes

1. Never expose private keys or sensitive data
2. Always use the Keyring for key management
3. Platform-specific code should be minimal
4. Follow existing patterns for consistency
5. Test migrations thoroughly before release
