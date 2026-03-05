# hashcash-native

A React Native Nitro Module providing native hashcash proof-of-work solving for iOS and Android.

## Overview

This package provides native implementations for computing hashcash proofs, which are used for proof-of-work challenges. Native implementations offer significantly better performance than JavaScript-based solutions.

## Structure

- `android/` - Android JNI/Kotlin implementation
- `ios/` - iOS Swift implementation
- `cpp/` - Cross-platform C++ implementation (to be added)
- `src/` - TypeScript interface definitions
- `nitrogen/` - Generated Nitro bindings

## Development

This package uses [Nitro Modules](https://nitro.margelo.com/) for native bindings.

```bash
# Generate Nitro bindings
bun run specs
```
