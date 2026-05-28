# @universe/environment

Runtime environment detection and platform identification for the Uniswap monorepo.

## Overview

This package provides functions and constants that answer two questions:

1. **What environment is this?** — dev, staging, production, unit test, E2E test
2. **What platform is this?** — web, mobile, extension, iOS, Android

Most exports use platform-split files (`.web.ts` / `.native.ts`) so the bundler includes only the relevant implementation.

Platform constants are evaluated once at module load and are `boolean` values, not functions.

## Key files

| File | Purpose |
|---|---|
| `src/environment/env.web.ts` | Environment helpers for web and extension |
| `src/environment/env.native.ts` | Environment helpers for mobile |
| `src/platform/index.web.ts` | Platform constants for web |
| `src/platform/index.native.ts` | Platform constants for mobile |
| `src/chrome/` | Chrome runtime helpers for the extension |

## Relationship to `@universe/config`

This package depends on `@universe/config` for `getConfig()`. The environment functions wrap config fields with platform-specific logic — for example, `isDevEnv()` on the extension checks Chrome runtime IDs, while on web it checks `getConfig().nodeEnv`.
