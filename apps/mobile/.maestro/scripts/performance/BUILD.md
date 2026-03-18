# Building Performance Scripts for GraalJS

## Overview

The performance tracking scripts need to be compiled from TypeScript to JavaScript and bundled for compatibility with GraalJS (Maestro's JavaScript runtime).

## Build Process

The build process uses **esbuild** to:

1. Compile TypeScript to JavaScript
2. Bundle all dependencies into self-contained files
3. Target ES2015 for GraalJS compatibility
4. Generate source maps for debugging

## How to Build

Run the build command:

```bash
yarn e2e:build-js
```

This executes `.maestro/scripts/tooling/buildPerformanceScripts.ts` which:

- Bundles each action script with all its dependencies
- Outputs to `.maestro/scripts/performance/dist/actions/`
- Creates IIFE (Immediately Invoked Function Expression) format for isolation

## Configuration

The build script uses these esbuild settings:

- **target**: `es2015` - Compatible with GraalJS
- **format**: `iife` - Self-contained execution
- **platform**: `neutral` - No Node.js or browser assumptions
- **bundle**: `true` - Include all dependencies
- **minify**: `false` - Keep code readable for debugging
- **sourcemap**: `true` - Enable debugging

## Output Structure

```
dist/
├── actions/
│   ├── init-tracking.js
│   ├── init-tracking.js.map
│   ├── start-flow.js
│   ├── start-flow.js.map
│   ├── end-flow.js
│   ├── end-flow.js.map
│   ├── track-action.js
│   ├── track-action.js.map
│   ├── start-sub-flow.js
│   ├── start-sub-flow.js.map
│   ├── end-sub-flow.js
│   └── end-sub-flow.js.map
└── utils/
```

## Adding New Scripts

To add a new script:

1. Create the TypeScript file in `src/actions/` or `src/utils/`
2. Run `yarn e2e:build-js` to build

The build script automatically discovers and builds:

- All TypeScript files in `src/actions/`
- Executable utility scripts in `src/utils/` (those containing 'upload', 'submit', or 'extract' in their names)

## Troubleshooting

If you encounter build errors:

- Check that all imports are resolvable
- Ensure TypeScript syntax is compatible with ES2015 target
- Verify that no Node.js-specific APIs are used
