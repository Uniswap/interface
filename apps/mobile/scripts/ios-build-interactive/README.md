# iOS Build Interactive Tool

An interactive CLI tool for building iOS apps with various configurations.

## Structure

- `main.ts` - Main script containing the interactive build logic
- `utils.ts` - Shared utilities, constants, types, and helper functions

## Usage

From the `apps/mobile` directory:

```bash
bun ios:interactive
```

## Features

- Choose between simulator and device builds
- Select Debug or Release configurations
- Pick from multiple app schemes (Uniswap, Dev, Beta, Production)
- Auto-detect available simulators and devices
- Metro bundler management
- Build cleaning and cache reset options

## Requirements

- Xcode
- Node.js
- Bun
- CocoaPods
- iOS Simulator (for simulator builds)
- Connected iOS device (for device builds)
