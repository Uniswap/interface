# CI Test Strategy for @uniswap/interface

This document outlines the test execution strategies for the Uniswap Interface package in CI environments.

## Problem

Large test suites can encounter memory issues and timeouts in CI environments like GitHub Actions, leading to test failures despite passing locally.

## Solutions

### 1. Chunked Test Execution (Recommended for CI)

The test suite is divided into 4 chunks to reduce memory pressure:

```bash
yarn test:ci:chunked  # Runs all test chunks sequentially
```

Individual chunks:
```bash
yarn test:set1        # Components tests
yarn test:set2        # Pages and state tests  
yarn test:set3        # Hooks, NFT, and utility tests
yarn test:set4        # Remaining tests
```

### 2. CI-Optimized Single Run

For CI environments that prefer single runs:
```bash
yarn test:ci          # Single run with CI optimizations
```

### 3. Standard Test Run

For local development:
```bash
yarn test             # Standard test run
```

## CI Configuration

The test configuration automatically detects CI environments (`process.env.CI`) and applies:

- Reduced thread concurrency (2 threads max vs unlimited)
- Increased timeouts (30s vs 15s)
- Higher memory limits (6GB vs 4GB) 
- Disabled file parallelism for stability
- Optimized garbage collection

## Usage in GitHub Actions

For maximum reliability in GitHub Actions, use the chunked approach:

```yaml
- name: Run tests
  run: yarn workspace @uniswap/interface test:ci:chunked
```

Alternatively, run chunks in parallel jobs:

```yaml
strategy:
  matrix:
    chunk: [set1, set2, set3, set4]
steps:
  - name: Run tests
    run: yarn workspace @uniswap/interface test:${{ matrix.chunk }}
```

## Memory Optimizations Applied

1. **Node.js Memory Limits**: 
   - Heap size: 4GB (local) / 6GB (CI)
   - Semi-space: 256MB (local) / 512MB (CI)
   - Garbage collection intervals in CI

2. **Vitest Optimizations**:
   - Reduced max concurrency (5 vs 50 in CI)
   - Disabled file parallelism in CI
   - Increased teardown timeout for cleanup
   - Optimized reporter for CI

## Test Distribution

- **Set 1 (Components)**: ~140 tests - UI components and interactions
- **Set 2 (Pages/State)**: ~50 tests - Page components and Redux state
- **Set 3 (Hooks/NFT/Utils)**: ~100 tests - React hooks and utilities  
- **Set 4 (Remaining)**: ~50 tests - Integration and misc tests

Total: ~340 tests across all chunks