# @universe/config

Configuration management package for the Uniswap Universe monorepo.

## Overview

This package provides centralized configuration management for all Uniswap applications (web, mobile, and extension). It handles environment variables and provides a platform-specific implementation for accessing configuration values.

## Usage

```typescript
import { getConfig } from '@universe/config'

const config = getConfig()
console.log(config.infuraKey)
```

## Platform Support

- **Web/Extension**: Uses `process.env` directly
- **Mobile**: Uses `react-native-dotenv` for environment variable management

## Configuration Values

See `src/config-types.ts` for the complete list of configuration options.

## Environment Variable Naming

- **Web**: Variables must be prefixed with `REACT_APP_`
- **Extension**: Variables use standard naming without prefix
- **Mobile**: Variables use standard naming without prefix, but also require `react-native-dotenv` setup