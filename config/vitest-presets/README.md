# Vitest Presets

This package provides Vitest configuration presets that mirror the functionality of jest-presets.

## Usage

In your `vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config'
import vitestPreset from 'config/vitest-presets/vitest/vitest-preset.js'

export default defineConfig({
  ...vitestPreset,
  // Add any additional overrides here
})
```

## Migration from Jest

### Key Differences

1. **Globals**: Vitest globals are opt-in. We've enabled them in the preset with `globals: true`.

2. **Module Mocking**: Use `vi.mock()` instead of `jest.mock()`. Mocks are hoisted automatically.

3. **Transform Configuration**: Vitest uses Vite's transform pipeline, so `transformIgnorePatterns` is replaced with `optimizeDeps.include`.

4. **Module Mapping**: Jest's `moduleNameMapper` is replaced with Vite's `resolve.alias`.

5. **Setup Files**: Jest's `setupFilesAfterEnv` becomes Vitest's `setupFiles`.

### Configuration Mapping

| Jest | Vitest |
|------|--------|
| `preset: 'ts-jest'` | Not needed (TypeScript support is built-in) |
| `testEnvironment: 'jsdom'` | `test.environment: 'jsdom'` |
| `moduleNameMapper` | `resolve.alias` |
| `setupFilesAfterEnv` | `test.setupFiles` |
| `transformIgnorePatterns` | `optimizeDeps.include` |
| `collectCoverage` | `test.coverage.enabled` |
| `coverageReporters` | `test.coverage.reporter` |
| `globals` | `test.env` |

## Mocked Libraries

All mocks from jest-presets have been migrated:

- Chrome storage API (using `mem-storage-area`)
- React Native AsyncStorage
- Redux Persist
- Expo libraries (clipboard, blur, haptics, linear-gradient, screen-capture)
- Amplitude Analytics
- React Native Device Info
- NetInfo
- WalletConnect packages
- AppsFlyer

## Features Not Migrated

1. **SVG Transform**: The `jest-transformer-svg` package needs a Vitest equivalent. For now, SVGs are handled through the alias system.

2. **Babel Transform**: Vitest uses Vite's transform pipeline which handles modern JavaScript/TypeScript natively. Babel-specific transforms may need custom Vite plugins.

3. **Jest-specific mock packages**: Some packages provide Jest-specific mocks (e.g., `@react-native-community/netinfo/jest/netinfo-mock.js`). These have been replaced with custom Vitest mocks in the setup file.

4. **Statsig mocks**: The Statsig SDK mocks that were importing from `uniswap/src/features/gating/*` have been removed to avoid cross-package dependencies.

## Testing the Configuration

Run the included tests to verify the configuration:

```bash
cd config/vitest-presets
bun run test
```
