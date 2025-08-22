# Maestro Performance Scripts

This directory contains TypeScript scripts for tracking performance metrics in Maestro E2E tests. The scripts are compiled to GraalJS-compatible JavaScript for execution within Maestro's runtime environment.

## Architecture

### Source Files (`src/`)

- **actions/** - Individual action scripts executed by Maestro YAML flows
  - `init-tracking.ts` - Initialize performance tracking session
  - `start-flow.ts` - Mark the beginning of a test flow
  - `end-flow.ts` - Mark the end of a test flow
  - `start-sub-flow.ts` - Mark the beginning of a sub-flow
  - `end-sub-flow.ts` - Mark the end of a sub-flow
  - `track-action.ts` - Track individual UI actions
- **utils/** - Shared utility functions
  - `bufferMetric.ts` - Buffer metrics for batch upload
  - `emitMetric.ts` - Emit metrics to console
  - `getTimestamp.ts` - Timestamp utilities
  - `metricCreators.ts` - Factory functions for creating metrics
  - `validateEnv.ts` - Environment variable validation
- **types.ts** - TypeScript type definitions
- **globals.d.ts** - Global type declarations for Maestro environment

### Compiled Files (`dist/`)

Generated JavaScript files optimized for GraalJS ES2020 runtime.

## Build System

### GraalJS Compilation

The build system compiles TypeScript to GraalJS-compatible JavaScript:

1. **Target**: ES2020 (fully supported by GraalJS)
2. **Module System**: None (GraalJS uses global scope)
3. **Optimizations**:
   - Removes all module imports/exports
   - Inlines utility functions
   - Wraps in IIFE for isolation
   - Removes TypeScript-specific constructs

### Build Commands

```bash
# Install dependencies
npm install

# Build for GraalJS
npm run build

# Watch mode for development
npm run build:watch

# Clean build directory
npm run clean

# Full rebuild
npm run rebuild

# Type checking only
npm run typecheck
```

## GraalJS Compatibility

### Supported Features

- ES2020 syntax (async/await, optional chaining, etc.)
- JSON operations
- Date and Math objects
- Console logging
- Global variables

### Limitations

- No ES modules (import/export)
- No Node.js APIs
- No npm packages
- Limited to Maestro-provided globals

## Maestro Integration

### Global Variables

Maestro provides these globals at runtime:

- `output` - Persistent state between script runs
- `FLOW_NAME`, `SUB_FLOW_NAME`, `ACTION`, `TARGET`, `PHASE` - Environment variables

### Usage in YAML

```yaml
- runScript:
    file: .maestro/scripts/performance/dist/actions/init-tracking.js

- runScript:
    file: .maestro/scripts/performance/dist/actions/start-flow.js
    env:
      FLOW_NAME: swap

- tapOn: "Swap Button"
- runScript:
    file: .maestro/scripts/performance/dist/actions/track-action.js
    env:
      ACTION: tap
      TARGET: "Swap Button"
      PHASE: end

- runScript:
    file: .maestro/scripts/performance/dist/actions/end-flow.js
    env:
      FLOW_NAME: swap
```

## Metrics Format

Metrics follow this structure:

```typescript
interface Metric {
  timestamp: number
  platform: string
  testRunId: string
  // Additional fields based on metric type
}
```

## Development Workflow

1. **Edit TypeScript files** in `src/`
2. **Run build** to compile to GraalJS
3. **Test locally** with Maestro
4. **Commit both** source and dist files

## Troubleshooting

### Compilation Errors

- Ensure no ES module syntax in source files
- Check for Node.js-specific APIs
- Verify TypeScript version compatibility

### Runtime Errors

- Check Maestro console output
- Verify global variables are defined
- Ensure scripts are in correct order

### Performance Issues

- Minimize JSON operations
- Avoid large string concatenations
- Keep metrics buffer reasonable size
