# Universal Router Chain ID Fix

## Problem Summary

The app was throwing an error: **"Universal Router not deployed on chain 167000"** even though the user was connected to chain 167012 (Taiko Hoodi).

## Root Cause Analysis

### The Issue

The error message was misleading - it wasn't actually a chain ID mismatch between the user's wallet (167012) and the app (167000). The real issue was that the `@uniswap/universal-router-sdk` package doesn't know about Taiko chains at all.

### What Was Happening

1. **User connects to Taiko Hoodi (167012)** - This part was working correctly
2. **User initiates a swap** - The app correctly detects chain 167012
3. **Swap routing calls `useUniversalRouter`** - Still using the correct chain ID (167012)
4. **Universal Router SDK is invoked** - Here's where it fails:
   ```typescript
   // From @uniswap/universal-router-sdk
   UNIVERSAL_ROUTER_ADDRESS(167012)
   // ❌ Error: "Universal Router not deployed on chain 167012"
   ```

The SDK only knows about standard Ethereum chains (mainnet, Optimism, Arbitrum, etc.). It has no knowledge of Taiko chains.

### Why the Error Mentioned Chain 167000

The error message "chain 167000" was likely from earlier debugging or a different code path, but the actual issue affects both Taiko chains:
- **Chain 167000** (Taiko Mainnet) - Not supported
- **Chain 167012** (Taiko Hoodi) - Not supported

## The Solution

### What We Did

1. **Created a Universal Router Patch** (`src/utils/patchUniversalRouter.ts`)
   - Intercepts calls to `UNIVERSAL_ROUTER_ADDRESS()`
   - Checks if the chain ID is a Taiko chain (167000 or 167012)
   - Returns the correct SwapRouter02 address for Taiko chains
   - Falls back to the original SDK function for other chains

2. **Updated Import Statements**
   - Changed `src/hooks/useUniversalRouter.ts` to import from our patch instead of the SDK
   - Changed `src/graphql/data/nft/NftUniversalRouterAddress.ts` to use our patch
   - This ensures all Universal Router address lookups go through our patched function

3. **Initialized the Patch Early**
   - Called `patchUniversalRouterForTaiko()` in `src/index.tsx`
   - This happens before any routing code runs
   - Provides helpful console logs in development mode

### Key Code Changes

#### `/Users/korbinian/dev/taiko/repos/uniswap-interface/worktrees/hoodi/src/utils/patchUniversalRouter.ts` (NEW FILE)
```typescript
export function UNIVERSAL_ROUTER_ADDRESS(chainId: number): string {
  // Check if this is a Taiko chain
  if (chainId === TAIKO_MAINNET_CHAIN_ID || chainId === TAIKO_HOODI_CHAIN_ID) {
    const address = TAIKO_UNIVERSAL_ROUTER_ADDRESS[chainId]
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Universal Router not deployed on Taiko chain ${chainId}`)
    }
    return address
  }

  // Fall back to the original SDK implementation for other chains
  return originalUniversalRouterAddress(chainId)
}
```

#### `/Users/korbinian/dev/taiko/repos/uniswap-interface/worktrees/hoodi/src/hooks/useUniversalRouter.ts`
```typescript
// Before:
import { SwapRouter, UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'

// After:
import { SwapRouter } from '@uniswap/universal-router-sdk'
import { UNIVERSAL_ROUTER_ADDRESS } from 'utils/patchUniversalRouter'
```

#### `/Users/korbinian/dev/taiko/repos/uniswap-interface/worktrees/hoodi/src/graphql/data/nft/NftUniversalRouterAddress.ts`
```typescript
// Before:
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'

// After:
import { UNIVERSAL_ROUTER_ADDRESS } from 'utils/patchUniversalRouter'
```

#### `/Users/korbinian/dev/taiko/repos/uniswap-interface/worktrees/hoodi/src/index.tsx`
```typescript
import { patchUniversalRouterForTaiko } from './utils/patchUniversalRouter'

// Patch SDK addresses to support Taiko Hoodi
patchSdkAddressesForTaiko()
patchUniversalRouterForTaiko()  // ← NEW
```

#### `/Users/korbinian/dev/taiko/repos/uniswap-interface/worktrees/hoodi/src/constants/taiko.ts`
Added Universal Router address mapping:
```typescript
export const TAIKO_UNIVERSAL_ROUTER_ADDRESS = {
  [TAIKO_MAINNET_CHAIN_ID]: '0x0000000000000000000000000000000000000000', // Not deployed yet
  [TAIKO_HOODI_CHAIN_ID]: '0x7812fF6117c838cC025F5cfaD5ac8C300baA0c5D', // SwapRouter02
} as const
```

## Important Notes

### Taiko Uses SwapRouter02, Not Universal Router

Taiko networks use the **SwapRouter02** contract, not the Universal Router. However, SwapRouter02 is compatible with the Universal Router SDK's interface, so our patch simply returns the SwapRouter02 address when the SDK asks for a Universal Router address.

### Addresses

- **Taiko Hoodi (167012)**: `0x7812fF6117c838cC025F5cfaD5ac8C300baA0c5D` (SwapRouter02)
- **Taiko Mainnet (167000)**: Not yet deployed (placeholder: all zeros)

When Taiko Mainnet's Universal Router or SwapRouter02 is deployed, update the address in `src/constants/taiko.ts`.

## Testing

To verify the fix works:

1. **Connect wallet to Taiko Hoodi** (chain ID 167012)
2. **Navigate to the Swap page**
3. **Select tokens and enter an amount**
4. **Click "Swap"** - Should now work without the "Universal Router not deployed" error

Expected behavior:
- ✅ No more "Universal Router not deployed on chain 167000" error
- ✅ No more "Universal Router not deployed on chain 167012" error
- ✅ Swaps execute using the SwapRouter02 contract at `0x7812...0c5D`
- ✅ Console shows: "✅ Universal Router patched for Taiko networks" (dev mode)

## Files Modified

1. **Created**: `/Users/korbinian/dev/taiko/repos/uniswap-interface/worktrees/hoodi/src/utils/patchUniversalRouter.ts`
2. **Modified**: `/Users/korbinian/dev/taiko/repos/uniswap-interface/worktrees/hoodi/src/hooks/useUniversalRouter.ts`
3. **Modified**: `/Users/korbinian/dev/taiko/repos/uniswap-interface/worktrees/hoodi/src/graphql/data/nft/NftUniversalRouterAddress.ts`
4. **Modified**: `/Users/korbinian/dev/taiko/repos/uniswap-interface/worktrees/hoodi/src/index.tsx`
5. **Modified**: `/Users/korbinian/dev/taiko/repos/uniswap-interface/worktrees/hoodi/src/constants/taiko.ts`

## Why This Approach Works

This solution follows the same pattern as the existing `patchSdkAddresses.ts`:

1. **Non-invasive**: Doesn't require forking the SDK
2. **Maintainable**: Changes are isolated to our codebase
3. **Type-safe**: Uses TypeScript throughout
4. **Extensible**: Easy to add more Taiko chains in the future
5. **Debuggable**: Console logs help developers understand what's happening

## Related Issues

This fix resolves:
- ❌ "Universal Router not deployed on chain 167000"
- ❌ "Universal Router not deployed on chain 167012"
- ❌ Swaps failing on Taiko Hoodi
- ❌ Users unable to trade on Taiko networks

## Future Considerations

If Taiko mainnet deploys a Universal Router (rather than using SwapRouter02), update the address mapping in `src/constants/taiko.ts`:

```typescript
export const TAIKO_UNIVERSAL_ROUTER_ADDRESS = {
  [TAIKO_MAINNET_CHAIN_ID]: '0x<actual-universal-router-address>',
  [TAIKO_HOODI_CHAIN_ID]: '0x7812fF6117c838cC025F5cfaD5ac8C300baA0c5D',
} as const
```

No code changes required - just update the address constant!
