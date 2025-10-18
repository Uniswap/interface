# Chain Configuration System

## Overview

This document describes the production-ready, modular chain configuration system for the Taiko-only Uniswap interface. The system provides validated, type-safe chain configurations with automatic validation to prevent zero addresses and invalid contract deployments.

## Table of Contents

- [Architecture](#architecture)
- [Key Features](#key-features)
- [Directory Structure](#directory-structure)
- [Core Concepts](#core-concepts)
- [Usage Examples](#usage-examples)
- [Adding New Chains](#adding-new-chains)
- [Enabling Taiko Mainnet](#enabling-taiko-mainnet)
- [Validation System](#validation-system)
- [Production Deployment](#production-deployment)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)

## Architecture

The chain configuration system is built on three core modules:

```
src/config/chains/
├── validation.ts    # Address validation and error handling
├── taiko.ts         # Taiko-specific chain configurations
├── registry.ts      # Centralized chain registry with validation
└── index.ts         # Public API exports
```

### Design Principles

1. **Single Source of Truth**: All chain configurations live in the registry
2. **Fail Fast**: Invalid configurations throw errors at startup
3. **Type Safety**: Full TypeScript support with strict typing
4. **Modular**: Easy to add/remove chains without touching core code
5. **Backward Compatible**: Old imports still work via re-exports

## Key Features

### 1. Automatic Validation

All enabled chains are automatically validated on application startup:

```typescript
// Validation runs automatically when registry is imported
import { getEnabledChains } from 'config/chains'

// If any enabled chain has zero addresses, the app fails to start with detailed error
```

### 2. Zero Address Detection

The system prevents zero addresses from being used:

```typescript
// ✓ Valid address
const address = '0x73C251a8005D31900Fe32A309C05d60adf6ba87a'

// ✗ Invalid - will throw error
const address = '0x0000000000000000000000000000000000000000'
```

### 3. Enable/Disable Chains

Chains can be easily enabled or disabled in the registry:

```typescript
// In registry.ts
{
  chainId: TAIKO_HOODI_CHAIN_ID,
  addresses: TAIKO_HOODI_ADDRESSES,
  metadata: TAIKO_HOODI_METADATA,
  enabled: true, // Set to false to disable
}
```

### 4. Production-Ready Error Messages

When validation fails, you get detailed, actionable error messages:

```
========================================
CHAIN VALIDATION FAILED: Taiko Mainnet (167000)
========================================

The following required contracts have invalid (zero) addresses:
  - weth9: 0x0000000000000000000000000000000000000000
  - factory: 0x0000000000000000000000000000000000000000
  - router: 0x0000000000000000000000000000000000000000

This chain cannot be enabled until all required contracts are deployed.

Action Required:
1. Verify contract deployments on the block explorer
2. Update the chain configuration with correct addresses
3. Re-run validation

To temporarily disable this chain:
- Remove it from the enabled chains list in registry.ts

========================================
```

## Directory Structure

```
src/
├── config/
│   └── chains/
│       ├── index.ts           # Main exports (use this)
│       ├── validation.ts      # Validation logic
│       ├── taiko.ts           # Taiko chain configs
│       └── registry.ts        # Chain registry
│
└── constants/
    ├── chains.ts              # Uses registry (updated)
    ├── tokens.ts              # Uses registry (updated)
    ├── chainInfo.ts           # Uses registry (updated)
    ├── providers.ts           # Uses registry (updated)
    ├── networks.ts            # Uses registry (updated)
    └── taiko.ts               # DEPRECATED - re-exports from config/chains
```

## Core Concepts

### Chain Configuration

Each chain has:

```typescript
interface ChainConfig {
  chainId: number                 // Unique chain identifier
  addresses: ChainAddresses       // All contract addresses
  metadata: TaikoChainMetadata   // Chain metadata (name, RPC, explorer)
  enabled: boolean                // Whether chain is active in UI
}
```

### Chain Addresses

Required contracts for a chain:

```typescript
interface ChainAddresses {
  // Core Protocol (REQUIRED)
  weth9: string
  factory: string

  // Periphery Contracts (REQUIRED)
  router: string
  positionManager: string
  quoterV2: string
  multicall: string

  // Optional Contracts
  tickLens: string
  v3Migrator: string
  v3Staker: string
  proxyAdmin: string
  nftDescriptorProxy: string
  nftDescriptorImplementation: string
  nftDescriptorLibrary: string
}
```

### Validation Levels

- **Required Contracts**: Must have valid addresses for chain to be enabled
  - `weth9`, `factory`, `router`, `positionManager`, `quoterV2`, `multicall`

- **Optional Contracts**: Nice to have but not required
  - `tickLens`, `v3Migrator`, `v3Staker`, governance contracts

## Usage Examples

### Get Enabled Chains

```typescript
import { getEnabledChains, getEnabledChainIds } from 'config/chains'

// Get all enabled chain configurations
const chains = getEnabledChains()

// Get just the chain IDs
const chainIds = getEnabledChainIds()
// [167012] - Only Taiko Hoodi is enabled
```

### Get Chain Addresses

```typescript
import { getChainAddresses } from 'config/chains'

const addresses = getChainAddresses(167012) // Taiko Hoodi
console.log(addresses.weth9)     // 0x73C251a8005D31900Fe32A309C05d60adf6ba87a
console.log(addresses.factory)   // 0xF7D0a7B04eBcB07b1bB5992d6B50a5BF55C903af
```

### Check if Chain is Enabled

```typescript
import { isChainEnabled } from 'config/chains'

isChainEnabled(167012)  // true  - Taiko Hoodi
isChainEnabled(167000)  // false - Taiko Mainnet (disabled)
```

### Get SDK-Compatible Addresses

```typescript
import {
  V3_CORE_FACTORY_ADDRESSES,
  MULTICALL_ADDRESSES,
  QUOTER_ADDRESSES,
} from 'config/chains'

// These exports only include enabled chains
const factory = V3_CORE_FACTORY_ADDRESSES[167012]
```

### Validate Custom Configuration

```typescript
import { validateChainAddresses } from 'config/chains'

const result = validateChainAddresses(
  myAddresses,
  'My Chain',
  123456
)

if (!result.isValid) {
  console.error('Validation failed:', result.errors)
}
```

## Adding New Chains

### Step 1: Add Chain Configuration

Edit `src/config/chains/taiko.ts`:

```typescript
// 1. Define chain ID
export const MY_CHAIN_ID = 999999 as const

// 2. Define addresses
export const MY_CHAIN_ADDRESSES: ChainAddresses = {
  weth9: '0x...',
  factory: '0x...',
  router: '0x...',
  positionManager: '0x...',
  quoterV2: '0x...',
  multicall: '0x...',
  tickLens: '0x...',
  v3Migrator: '0x...',
  v3Staker: '0x...',
  proxyAdmin: '0x...',
  nftDescriptorProxy: '0x...',
  nftDescriptorImplementation: '0x...',
  nftDescriptorLibrary: '0x...',
}

// 3. Define metadata
export const MY_CHAIN_METADATA: TaikoChainMetadata = {
  chainId: MY_CHAIN_ID,
  name: 'My Chain',
  rpcUrl: 'https://rpc.mychain.xyz',
  explorerUrl: 'https://explorer.mychain.xyz',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  isTestnet: false,
}
```

### Step 2: Add to Registry

Edit `src/config/chains/registry.ts`:

```typescript
const ALL_CHAINS: ChainConfig[] = [
  // ... existing chains ...
  {
    chainId: MY_CHAIN_ID,
    addresses: MY_CHAIN_ADDRESSES,
    metadata: MY_CHAIN_METADATA,
    enabled: true, // Set to false if not ready
  },
]
```

### Step 3: Validation Happens Automatically

When you start the app, validation runs automatically:

```bash
npm start

# Output:
✓ Taiko Hoodi (167012) validated successfully
✓ My Chain (999999) validated successfully

CHAIN VALIDATION SUMMARY
========================================
Total Chains: 3
Valid Chains: 2
Invalid Chains: 0
========================================
```

### Step 4: Update UI Components (if needed)

Add chain to relevant UI components:

```typescript
// constants/chainInfo.ts
[MY_CHAIN_ID]: {
  networkType: NetworkType.L2,
  label: 'My Chain',
  // ... other chain info
}

// constants/networks.ts
[MY_CHAIN_ID]: ['https://rpc.mychain.xyz']
```

## Enabling Taiko Mainnet

Currently, Taiko Mainnet (167000) is **disabled** because it has zero addresses for critical contracts.

### Why is it Disabled?

```typescript
// Only positionManager is deployed, rest are zero addresses
export const TAIKO_MAINNET_ADDRESSES = {
  weth9: '0x0000000000000000000000000000000000000000', // ✗ Not deployed
  factory: '0x0000000000000000000000000000000000000000', // ✗ Not deployed
  router: '0x0000000000000000000000000000000000000000', // ✗ Not deployed
  positionManager: '0x8b3c541c30f9b29560f56b9e44b59718916b69ef', // ✓ Deployed
  // ...
}
```

### How to Enable It

1. **Verify Contract Deployments**

   Visit https://taikoscan.io/ and verify all required contracts are deployed:
   - WETH9
   - V3 Factory
   - Swap Router
   - Position Manager (already confirmed)
   - Quoter V2
   - Multicall

2. **Update Addresses**

   Edit `src/config/chains/taiko.ts`:

   ```typescript
   export const TAIKO_MAINNET_ADDRESSES: ChainAddresses = {
     weth9: '0x...actual-address...',
     factory: '0x...actual-address...',
     router: '0x...actual-address...',
     positionManager: '0x8b3c541c30f9b29560f56b9e44b59718916b69ef',
     quoterV2: '0x...actual-address...',
     multicall: '0x...actual-address...',
     // ... rest of addresses
   }
   ```

3. **Enable in Registry**

   Edit `src/config/chains/registry.ts`:

   ```typescript
   {
     chainId: TAIKO_MAINNET_CHAIN_ID,
     addresses: TAIKO_MAINNET_ADDRESSES,
     metadata: TAIKO_MAINNET_METADATA,
     enabled: true, // Change from false to true
   }
   ```

4. **Run Validation**

   ```bash
   npm start
   ```

   If all addresses are valid, the chain will be enabled. If any are still zero, you'll get an error.

5. **Update UI Constants**

   Add back to:
   - `constants/chains.ts` - MAINNET_CHAIN_IDS array
   - `constants/chainInfo.ts` - CHAIN_INFO object
   - Other relevant files

## Validation System

### Validation Flow

```
1. Application starts
   ↓
2. registry.ts is imported
   ↓
3. validateRegistry() runs automatically
   ↓
4. For each enabled chain:
   - Validates required contracts
   - Checks for zero addresses
   - Throws error if invalid
   ↓
5. If all valid:
   - Logs success
   - App continues

6. If any invalid:
   - Logs detailed error
   - App fails to start
```

### Manual Validation

You can manually validate configurations:

```typescript
import { validateChainAddresses, validateMultipleChains } from 'config/chains'

// Validate single chain
const result = validateChainAddresses(
  addresses,
  'Chain Name',
  chainId,
  false  // strict mode
)

// Validate multiple chains
const results = validateMultipleChains([
  { addresses: addr1, chainName: 'Chain 1', chainId: 1 },
  { addresses: addr2, chainName: 'Chain 2', chainId: 2 },
])
```

### Strict Mode

```typescript
// Normal mode: Only required contracts must be valid
validateChainAddresses(addresses, name, id, false)

// Strict mode: ALL contracts must be valid (including optional)
validateChainAddresses(addresses, name, id, true)
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All enabled chains have valid addresses
- [ ] Validation passes with no errors
- [ ] Block explorer links verified
- [ ] RPC URLs tested and working
- [ ] Token lists configured (if applicable)
- [ ] UI components updated for new chains
- [ ] ENS disabled for Taiko chains (Ethereum-specific)
- [ ] No Infura/Ethereum fallbacks for Taiko chains

### Environment Variables

Ensure these are set:

```bash
# Required
REACT_APP_INFURA_KEY=your-key        # For Ethereum chains
REACT_APP_BNB_RPC_URL=your-bnb-url  # For BNB chain
```

### Build Process

```bash
# 1. Install dependencies
npm install

# 2. Validation runs on build
npm run build

# 3. If validation fails, build fails
# Fix errors and rebuild
```

### Deployment Validation

After deploying, verify:

1. **Chain Registry Loads**: Check browser console for validation logs
2. **Correct Chains Enabled**: Only expected chains appear in UI
3. **No Zero Addresses**: Inspect network calls for 0x000... addresses
4. **Transactions Work**: Test swaps, adds liquidity on enabled chains

## Migration Guide

### From Old System

If you have code using the old `constants/taiko.ts`:

**Before:**
```typescript
import { TAIKO_HOODI_ADDRESSES } from 'constants/taiko'
```

**After:**
```typescript
import { TAIKO_HOODI_ADDRESSES } from 'config/chains'
```

The old imports still work (re-exported), but update to new imports for best practice.

### Breaking Changes

None. The system is backward compatible via re-exports.

### Deprecation Warnings

The old `constants/taiko.ts` is deprecated but still works:

```typescript
/**
 * DEPRECATED: This file is deprecated.
 * Import from 'config/chains' instead.
 */
```

## Troubleshooting

### Error: "Invalid address for [contract]"

**Cause**: Contract has zero address (0x0000...)

**Fix**:
1. Verify contract is deployed on block explorer
2. Update address in `src/config/chains/taiko.ts`
3. Restart app

### Error: "No chains are enabled in the registry"

**Cause**: All chains in registry have `enabled: false`

**Fix**:
1. Enable at least one chain in `src/config/chains/registry.ts`
2. Ensure that chain has valid addresses
3. Restart app

### Chain not appearing in UI

**Possible causes**:
1. Chain is disabled in registry (`enabled: false`)
2. Chain has invalid addresses (validation failed)
3. Chain not added to UI components

**Fix**:
1. Check registry configuration
2. Check console for validation errors
3. Add chain to `constants/chainInfo.ts`, `constants/networks.ts`

### Validation passes but transactions fail

**Possible causes**:
1. Addresses are valid but contracts not actually deployed
2. RPC URL is incorrect
3. Contract versions incompatible

**Fix**:
1. Verify contracts on block explorer
2. Test RPC URL manually
3. Check contract deployment versions

### TypeScript errors after migration

**Cause**: Old type imports

**Fix**:
```typescript
// Old
import { TAIKO_HOODI_CHAIN_ID } from './taiko'

// New
import { TAIKO_HOODI_CHAIN_ID } from 'config/chains'
```

## Best Practices

### 1. Always Validate Before Enabling

```typescript
// Test configuration before enabling
const result = validateChainAddresses(addresses, name, id)
if (result.isValid) {
  // Safe to enable
} else {
  // Fix errors first
  console.error(result.errors)
}
```

### 2. Use Type-Safe Exports

```typescript
// ✓ Good - type-safe, validated
import { getChainAddresses } from 'config/chains'
const addresses = getChainAddresses(chainId)

// ✗ Avoid - direct access, no validation
const addresses = SOME_ADDRESSES[chainId]
```

### 3. Disable Rather Than Delete

```typescript
// ✓ Good - can easily re-enable later
{
  chainId: TAIKO_MAINNET_CHAIN_ID,
  enabled: false,
}

// ✗ Avoid - loses configuration
// (delete the chain entry)
```

### 4. Document Deployment Status

```typescript
// Good - clear status
export const TAIKO_MAINNET_ADDRESSES = {
  weth9: '0x...', // CONFIRMED: Deployed 2024-01-15
  factory: '0x...', // CONFIRMED: Deployed 2024-01-15
  router: '0x0000...', // TODO: Deploy router contract
}
```

## Support

For issues or questions:

1. Check this documentation
2. Review error messages (they're detailed!)
3. Check browser console for validation logs
4. Verify addresses on block explorer
5. Check the codebase for similar configurations

## Summary

The new chain configuration system provides:

- **Automatic validation** of all contract addresses
- **Type-safe** configuration with TypeScript
- **Modular design** for easy chain additions
- **Production-ready** error handling
- **Backward compatible** with existing code
- **Zero-address protection** to prevent runtime errors

By using this system, you can confidently add new chains knowing that invalid configurations will be caught before they cause runtime errors.
