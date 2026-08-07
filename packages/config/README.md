# @universe/config

Shared configuration management for the Uniswap monorepo.

## Overview

This package provides:

- **`BaseConfigValues`** / **`BaseConfigSchema`** — shared config fields (API keys, feature flags, URL overrides) used by all apps
- **`parseConfig()`** — validates values against a zod schema, auto-extending the base config
- **Common zod schemas** — `boolFromString`, `boolIfDefined`, `boolFromOne`, `optionalString`
- **Env field rules** — per-environment required/forbidden field lists (`EnvFieldRules`), enforced by `parseConfig()`

Each app (web, mobile, extension) has its own `config.ts` that defines app-specific fields and calls `parseConfig()`.

## Env field rules

`parseConfig()` accepts an optional `envFieldRules` parameter declaring, per environment, which fields must be set (`required`) and which must be unset (`forbidden`). The rules are typed against the merged config shape (base + app fields), so a typo in a field name is a compile error:

```ts
const webEnvFieldRules: EnvFieldRules<Config> = {
  [Environment.Production]: {
    required: ['statsigApiKey', 'tradingApiKey', 'uniswapApiKey'],
    forbidden: ['viteBackendUrl', 'debugProxy'],
  },
}

parseConfig({ values, schema, envFieldRules: webEnvFieldRules })
```

- `required` — the field must be non-empty when `environment` matches
- `forbidden` — the field must be unset when `environment` matches (an empty string, or a value equal to what the field parses when unset — e.g. a `.default()` value or a `boolFromString` `false` — counts as unset)

App rules are merged with `BaseEnvFieldRules` (the base config's own rules, currently the URL override fields forbidden in production), unioning the field lists per environment. Enforcement is a single object-level check attached to the merged schema: it reads the parsed sibling `environment` and reports violations as ordinary zod issues, aggregated with the schema's own. Because rules are keyed by field name, an app schema overriding a base field does not detach the base rule.

Note `BaseConfigSchema` itself is NOT self-enforcing — rules apply only through `parseConfig()` (including the deprecated `getConfig()`, which parses `BaseConfigSchema` via `parseConfig`). Because enforcement needs the environment, `environment` is mandatory: the schema does not default it, and `BaseConfigValues` always derives it from `ENVIRONMENT ?? NODE_ENV`.

## Config schema version

`configSchemaVersion` (from `CONFIG_SCHEMA_VERSION`) versions the config schema for future breaking changes. It defaults to `0`, so unversioned `.env` files keep parsing unchanged. There is no migration machinery yet.

## How env vars work

All platforms use `process.env.X` references directly. Each build tool replaces these at build time:

- **Vite** (web) — `define` block in `vite.config.mts` statically replaces `process.env.X`
- **Metro + Babel** (mobile) — `transform-inline-environment-variables` plugin inlines values from the shell; `.env` files are loaded via `dotenv` in `babel.config.js`
- **WXT/Webpack** (extension) — `DefinePlugin` / WXT config handles replacements

No `REACT_APP_` prefix is required. The base config uses `??` fallbacks (e.g. `process.env.ALCHEMY_API_KEY ?? process.env.REACT_APP_ALCHEMY_API_KEY`) for backward compatibility with env vars that still use the legacy prefix.

## Key files

| File | Purpose |
|---|---|
| `src/BaseConfig.ts` | `BaseConfigValues`, `BaseConfigSchema`, `BaseConfig` type, `BaseEnvFieldRules` |
| `src/parseConfig.ts` | `parseConfig()` function |
| `src/envFieldRules.ts` | `EnvFieldRules` type and rule merging/enforcement helpers |
| `src/getConfig.ts` | Deprecated `getConfig()` for shared packages |
| `src/commonSchemas.ts` | Reusable zod schemas |
| `src/types.ts` | `ConfigValues`, `ConfigSchema` types |
