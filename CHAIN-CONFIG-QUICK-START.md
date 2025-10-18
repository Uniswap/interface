# Chain Configuration System - Quick Start Guide

## TL;DR

A modular chain configuration system that:
- **Validates** all addresses automatically
- **Prevents** zero addresses from being used
- **Disables** Taiko Mainnet (zero addresses)
- **Enables** only Taiko Hoodi (verified contracts)

## Quick Examples

### Get Enabled Chains

```typescript
import { getEnabledChainIds } from 'config/chains'

const chainIds = getEnabledChainIds()
// [167012] - Only Taiko Hoodi
```

### Get Chain Addresses

```typescript
import { getChainAddresses } from 'config/chains'

const addresses = getChainAddresses(167012)
addresses.weth9      // 0x73C251a8005D31900Fe32A309C05d60adf6ba87a
addresses.factory    // 0xF7D0a7B04eBcB07b1bB5992d6B50a5BF55C903af
```

### Check if Chain Enabled

```typescript
import { isChainEnabled } from 'config/chains'

isChainEnabled(167012)  // true  - Taiko Hoodi
isChainEnabled(167000)  // false - Taiko Mainnet
```

## Adding a New Chain

### 1. Create Configuration

Edit `src/config/chains/taiko.ts`:

```typescript
export const MY_CHAIN_ID = 999999 as const

export const MY_CHAIN_ADDRESSES = {
  weth9: '0x...',
  factory: '0x...',
  router: '0x...',
  positionManager: '0x...',
  quoterV2: '0x...',
  multicall: '0x...',
  // ... other addresses
}

export const MY_CHAIN_METADATA = {
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

### 2. Add to Registry

Edit `src/config/chains/registry.ts`:

```typescript
const ALL_CHAINS: ChainConfig[] = [
  // ... existing chains
  {
    chainId: MY_CHAIN_ID,
    addresses: MY_CHAIN_ADDRESSES,
    metadata: MY_CHAIN_METADATA,
    enabled: true,
  },
]
```

### 3. Start App

```bash
npm start
```

Validation runs automatically. If successful:

```
✓ My Chain (999999) validated successfully
```

If failed:

```
✗ CHAIN VALIDATION FAILED: My Chain (999999)

Invalid addresses found:
  - weth9: 0x0000000000000000000000000000000000000000
  - factory: 0x0000000000000000000000000000000000000000

Action Required:
1. Verify contract deployments
2. Update addresses
3. Re-run validation
```

## Enabling Taiko Mainnet

### Current Status

**Disabled** - Zero addresses for critical contracts

### To Enable

1. **Verify deployments** on https://taikoscan.io/

2. **Update addresses** in `src/config/chains/taiko.ts`:
   ```typescript
   export const TAIKO_MAINNET_ADDRESSES = {
     weth9: '0x...verified-address...',
     factory: '0x...verified-address...',
     router: '0x...verified-address...',
     // ... etc
   }
   ```

3. **Enable in registry** (`src/config/chains/registry.ts`):
   ```typescript
   {
     chainId: TAIKO_MAINNET_CHAIN_ID,
     addresses: TAIKO_MAINNET_ADDRESSES,
     metadata: TAIKO_MAINNET_METADATA,
     enabled: true, // Change to true
   }
   ```

4. **Restart app** - validation runs automatically

## Current Configuration

### Enabled Chains
- **Taiko Hoodi (167012)** - All contracts verified ✓

### Disabled Chains
- **Taiko Mainnet (167000)** - Zero addresses ✗

### Removed From
- All UI components
- Chain selectors
- Token configurations
- Provider configurations
- Network configurations

## File Structure

```
src/config/chains/          # New system
├── index.ts               # Main exports (use this)
├── validation.ts          # Validation logic
├── taiko.ts              # Taiko configs
└── registry.ts           # Chain registry

src/constants/             # Updated to use new system
├── chains.ts             # ✓ Updated
├── tokens.ts             # ✓ Updated
├── chainInfo.ts          # ✓ Updated
├── providers.ts          # ✓ Updated
├── networks.ts           # ✓ Updated
└── taiko.ts              # DEPRECATED (re-exports)
```

## Common Tasks

### Disable a Chain

```typescript
// In registry.ts
{
  chainId: SOME_CHAIN_ID,
  enabled: false, // Set to false
}
```

### Validate Custom Config

```typescript
import { validateChainAddresses } from 'config/chains'

const result = validateChainAddresses(
  myAddresses,
  'Chain Name',
  chainId
)

if (!result.isValid) {
  console.error('Validation failed:', result.errors)
}
```

### Get All Chain Info

```typescript
import {
  getAllChains,
  getEnabledChains,
  getDisabledChains,
} from 'config/chains'

const all = getAllChains()       // All chains
const enabled = getEnabledChains()   // Only enabled
const disabled = getDisabledChains() // Only disabled
```

## Migration from Old System

### Old Imports (Still Work)

```typescript
import { TAIKO_HOODI_CHAIN_ID } from 'constants/taiko'
```

### New Imports (Recommended)

```typescript
import { TAIKO_HOODI_CHAIN_ID } from 'config/chains'
```

## Testing Checklist

- [ ] App starts without errors
- [ ] Validation success messages in console
- [ ] Only Taiko Hoodi in chain selector
- [ ] Swaps work on Taiko Hoodi
- [ ] No zero addresses in network calls
- [ ] No Ethereum/Infura calls for Taiko

## Troubleshooting

### Error: "Invalid address for weth9"

**Fix**: Update address in `src/config/chains/taiko.ts`

### Error: "No chains are enabled"

**Fix**: Set `enabled: true` for at least one chain in registry

### Chain not in UI

**Fix**:
1. Check `enabled: true` in registry
2. Check validation passed (console)
3. Add to `constants/chainInfo.ts`

## Key Benefits

- ✓ **Automatic validation** on startup
- ✓ **Type-safe** configurations
- ✓ **Modular** - easy to add/remove chains
- ✓ **Production-ready** error messages
- ✓ **Backward compatible** with old imports
- ✓ **Zero-address protection**

## Documentation

- **Full docs**: `README-CHAIN-CONFIG.md`
- **Implementation**: `CHAIN-CONFIG-IMPLEMENTATION.md`
- **This guide**: Quick reference

## Support

1. Check error messages (they're detailed!)
2. Read README-CHAIN-CONFIG.md
3. Check browser console logs
4. Verify addresses on block explorer

## Summary

```typescript
// Import from new system
import {
  getEnabledChains,
  getChainAddresses,
  isChainEnabled,
} from 'config/chains'

// Get enabled chains
const chainIds = getEnabledChainIds()  // [167012]

// Get addresses
const addresses = getChainAddresses(167012)

// Check if enabled
isChainEnabled(167012)  // true
isChainEnabled(167000)  // false

// Add new chain - just 3 steps:
// 1. Add config to taiko.ts
// 2. Add to registry.ts
// 3. Start app (validation automatic)
```

That's it! The system handles validation, type safety, and error handling automatically.
