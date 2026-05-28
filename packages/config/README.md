# @universe/config

Shared configuration management for the Uniswap monorepo.

## Overview

This package provides:

- **`BaseConfigValues`** / **`BaseConfigSchema`** — shared config fields (API keys, feature flags, URL overrides) used by all apps
- **`parseConfig()`** — validates values against a zod schema, auto-extending the base config
- **Common zod schemas** — `boolFromString`, `boolIfDefined`, `boolFromOne`, `optionalString`

Each app (web, mobile, extension) has its own `config.ts` that defines app-specific fields and calls `parseConfig()`.

## How env vars work

All platforms use `process.env.X` references directly. Each build tool replaces these at build time:

- **Vite** (web) — `define` block in `vite.config.mts` statically replaces `process.env.X`
- **Metro + Babel** (mobile) — `transform-inline-environment-variables` plugin inlines values from the shell; `.env` files are loaded via `dotenv` in `babel.config.js`
- **WXT/Webpack** (extension) — `DefinePlugin` / WXT config handles replacements

No `REACT_APP_` prefix is required. The base config uses `??` fallbacks (e.g. `process.env.ALCHEMY_API_KEY ?? process.env.REACT_APP_ALCHEMY_API_KEY`) for backward compatibility with env vars that still use the legacy prefix.

## Key files

| File | Purpose |
|---|---|
| `src/BaseConfig.ts` | `BaseConfigValues`, `BaseConfigSchema`, `BaseConfig` type |
| `src/parseConfig.ts` | `parseConfig()` function |
| `src/getConfig.ts` | Deprecated `getConfig()` for shared packages |
| `src/commonSchemas.ts` | Reusable zod schemas |
| `src/types.ts` | `ConfigValues`, `ConfigSchema` types |
