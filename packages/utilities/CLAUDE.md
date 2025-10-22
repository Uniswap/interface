# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the `utilities` package within the Uniswap Universe monorepo. It provides shared utilities and services for multiple platforms (web, React Native, Chrome extension).

## Development Commands

```bash
# Build the package
bun build

# Run tests
bun run test

# Type checking
bun typecheck

# Linting
bun lint          # Check for lint errors
bun lint:fix      # Auto-fix lint errors

# Check formatting
bun format

# Check for unused dependencies
bun check:deps:usage
```

## Architecture

This package provides cross-platform utilities with platform-specific implementations:

### Platform-specific file patterns

- `.native.ts` - React Native implementations
- `.web.ts` - Web-specific implementations
- Base `.ts` files - Type definitions or shared logic

### Key directories

- `src/logger/` - Datadog logging infrastructure for error tracking
- `src/telemetry/` - Amplitude analytics implementation
- `src/contracts/` - Smart contract interaction utilities using ethers.js
- `src/device/` - Platform-specific device utilities (keyboard, locales, app state)
- `src/format/` - Number, URL, and percentage formatting utilities
- `src/react/` - React hooks and utilities
- `src/reactQuery/` - React Query utilities for data fetching

### Important patterns

1. **Multi-platform support**: Always check if you need platform-specific implementations when modifying utilities
2. **Error logging**: Use the logger utilities from `src/logger/` for consistent error tracking
3. **Analytics**: Use telemetry utilities from `src/telemetry/` for user analytics
4. **Type exports**: Ensure all public APIs are properly exported in the relevant index.ts files

## Testing

- Tests use Vitest with platform-specific configurations
- Test files should be colocated with source files using `.test.ts` or `.test.tsx` extensions
- Use testing utilities from `src/test/` for common test scenarios

## Import Guidelines

- Never use relative imports - always use the `utilities` package name
- ESLint is configured to enforce this rule

## Key Dependencies

- **React/React Native**: Core UI frameworks
- **Ethers.js**: Ethereum blockchain interactions
- **Amplitude**: User analytics
- **Datadog**: Error logging and RUM
- **React Query**: Data fetching and caching
- **Redux**: State management integration
