# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

### Running the App

```bash
# Install dependencies (run from mobile directory)
yarn

# Install iOS pods
yarn pod

# Run iOS app (development)
yarn ios

# Run iOS app with specific configuration
yarn ios:dev:release    # Dev release build
yarn ios:beta           # Beta debug build
yarn ios:release        # Release build

# Run Android app (development)
yarn android

# Run Android app with specific variant
yarn android:release    # Dev release build
yarn android:build:release  # Dev release build
yarn android:prod       # Production debug build

# Start Metro bundler (usually starts automatically)
yarn start
```

### Testing

```bash
# Run all tests
yarn test

# Run tests for a specific file/pattern
yarn test path/to/test.ts

# Update snapshots
yarn snapshots

# Type checking
yarn typecheck

# Linting
yarn lint
yarn lint:fix

# Format code
yarn format
```

### iOS-Specific Commands

```bash
# Interactive iOS build selector
yarn ios:interactive

# Build iOS bundle for production
yarn ios:bundle

# Update pods
yarn pod:update
```

### Environment Setup

```bash
# Download environment variables (requires 1password CLI)
yarn env:local:download

# Reset development environment
yarn softreset    # Soft reset
yarn hardreset    # Full reset including node_modules
```

## Architecture Overview

### State Management

The app uses **Redux with Redux-Saga** for state management:

- **Store**: Configured in `src/app/store.ts` with redux-persist using MMKV storage
- **Reducers**: Combined in `src/app/mobileReducer.ts` - includes both shared wallet reducers and mobile-specific reducers
- **Sagas**: Root saga in `src/app/saga.ts` orchestrates all side effects
- **Persistence**: State is persisted between sessions with migrations support

### Navigation Structure

React Navigation is used with the following stack structure:

- **AppStack**: Main app screens (HomeScreen, TokenDetailsScreen, etc.)
- **OnboardingStack**: New user onboarding flow
- **SettingsStack**: Settings hierarchy
- **FiatOnRampStack**: Fiat on-ramp flow (separate navigation tree)
- **UnitagStack**: Unitag-related screens

Navigation is configured in `src/app/navigation/navigation.tsx`.

### Feature Organization

Features are organized in `src/features/` with self-contained functionality:

- Each feature typically has its own slice, saga, and selectors
- Key features: wallet, CloudBackup, biometrics, walletConnect, notifications, deepLinking
- Features can have platform-specific implementations

### Screen Organization

Screens are in `src/screens/` organized by functionality:

- Main screens like HomeScreen have their own directories
- Related screens are grouped (e.g., all onboarding screens in Onboarding/)
- Modal screens use either React Navigation modals or custom modal system

### Native Modules

Platform-specific functionality is implemented via native modules:

- iOS: Swift modules in `ios/Uniswap/`
- Android: Kotlin/Java modules in `android/app/src/main/`
- Key modules: RNEthersRS (key management), RNCloudStorageBackupsManager, RNWalletConnect

### Shared Code

The app is part of a monorepo and shares code via packages:

- `wallet`: Core wallet functionality shared with extension
- `uniswap`: Shared utilities and constants
- `utilities`: Common utility functions

### Data Flow

1. User actions → Redux actions
2. Reducers update state synchronously
3. Sagas handle async operations (API calls, native modules)
4. Apollo Client manages GraphQL data with cache
5. Components subscribe via hooks/selectors

## Development Tips

### Testing Approach

- Unit tests for utilities and reducers
- Integration tests for sagas using redux-saga-test-plan
- Component tests using React Native Testing Library
- E2E tests using Maestro (see docs/e2e-testing.md)

### Performance Considerations

- Heavy use of React.memo and useMemo for optimization
- FlashList used instead of FlatList for better performance
- Performance monitoring via Datadog integration

### Common Patterns

- Feature-based file organization
- Saga pattern for side effects
- Selectors for derived state
- Custom hooks for shared logic
- TypeScript for type safety throughout

### Debugging

- Reactotron support for development debugging
- Redux DevTools via Reactotron
- Native debugging via Xcode/Android Studio
- Performance profiling with React DevTools
