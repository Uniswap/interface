# Taiko Mainnet Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Uniswap Interface to Taiko Mainnet (Chain ID: 167000). The interface has been thoroughly tested on Taiko Hoodi testnet and is production-ready.

## Prerequisites

### Required Contract Deployments

Before enabling the interface on Taiko Mainnet, ensure the following contracts are deployed and verified:

#### Core Contracts
- **WETH9**: Wrapped Ether contract
- **UniswapV3Factory**: Core factory contract for creating pools

#### Periphery Contracts (v3-periphery)
- **SwapRouter02**: Router for executing swaps
- **NonfungiblePositionManager**: Manages liquidity positions as NFTs
- **QuoterV2**: Provides swap quotes (Note: QuoterV1 is also compatible)
- **Multicall3**: Batches multiple contract calls
- **TickLens**: Reads tick data from pools
- **V3Migrator**: Migrates liquidity from V2 to V3
- **V3Staker**: Staking contract for LP positions

#### Additional Required Contracts
- **Permit2**: Advanced token approval contract (Solidity 0.8.17+ for Shanghai EVM)
  - Repository: https://github.com/Uniswap/permit2
  - Must be compiled with Solidity 0.8.17 or later for Shanghai EVM compatibility

- **UniversalRouter**: Unified router for all Uniswap protocols (v1.6.0+)
  - Repository: https://github.com/Uniswap/universal-router
  - Must be compiled with Solidity 0.8.17 for Shanghai EVM compatibility (no TLOAD/TSTORE)
  - Version: v1.6.0 (V3-only) recommended

### Verification Requirements

All contracts must be:
1. **Deployed** to Taiko Mainnet (Chain ID: 167000)
2. **Verified** on TaikoScan: https://taikoscan.io/
3. **Non-zero addresses** (validation system will reject `0x0000...0000`)

## Deployment Steps

### Step 1: Update Contract Addresses

Edit `/src/config/chains/taiko.ts` and update the `TAIKO_MAINNET_ADDRESSES` object with your deployed contract addresses:

```typescript
export const TAIKO_MAINNET_ADDRESSES: ChainAddresses = {
  // Core Protocol
  weth9: '0x...', // Your WETH9 deployment
  factory: '0x...', // Your UniswapV3Factory deployment

  // Periphery Contracts
  router: '0x...', // Your SwapRouter02 deployment
  positionManager: '0x...', // Your NonfungiblePositionManager deployment
  quoterV2: '0x...', // Your QuoterV2 (or QuoterV1) deployment
  multicall: '0x...', // Your Multicall3 deployment
  tickLens: '0x...', // Your TickLens deployment

  // Additional Contracts
  v3Migrator: '0x...', // Your V3Migrator deployment
  v3Staker: '0x...', // Your V3Staker deployment

  // Governance & Admin
  proxyAdmin: '0x...', // Your ProxyAdmin deployment
  nftDescriptorProxy: '0x...', // Your NonfungibleTokenPositionDescriptor deployment
  nftDescriptorImplementation: '0x...', // Your implementation address
  nftDescriptorLibrary: '0x...', // Your NFTDescriptor library deployment
}
```

### Step 2: Update UniversalRouter Address

In the same file, update the `TAIKO_UNIVERSAL_ROUTER_ADDRESS`:

```typescript
export const TAIKO_UNIVERSAL_ROUTER_ADDRESS = {
  [TAIKO_MAINNET_CHAIN_ID]: '0x...', // Your UniversalRouter v1.6.0 deployment
  [TAIKO_HOODI_CHAIN_ID]: '0x2F9c5E6f9f178CE0447a4e7e61EE5a07C990540f',
} as const
```

### Step 3: Update Permit2 Address

If Permit2 was deployed to a non-canonical address, update `/src/constants/permit2.ts`:

```typescript
const CUSTOM_PERMIT2_ADDRESSES: { [chainId: number]: string } = {
  [TAIKO_HOODI_CHAIN_ID]: '0xC723E421FE936ad9BcB5d89EF710771BA9C44C7D',
  [TAIKO_MAINNET_CHAIN_ID]: '0x...', // Your Permit2 deployment (if non-canonical)
}
```

**Note**: If Permit2 is deployed at the canonical address (`0x000000000022D473030F116dDEE9F6B43aC78BA3`), you don't need to add it to `CUSTOM_PERMIT2_ADDRESSES`.

### Step 4: Enable Mainnet in Registry

Edit `/src/config/chains/registry.ts` and update the Taiko Mainnet configuration:

```typescript
const ALL_CHAINS: ChainConfig[] = [
  // Taiko Hoodi - ENABLED (testnet)
  {
    chainId: TAIKO_HOODI_CHAIN_ID,
    addresses: TAIKO_HOODI_ADDRESSES,
    metadata: TAIKO_HOODI_METADATA,
    enabled: true,
    isDefault: false, // Set to false when mainnet is enabled
  },
  // Taiko Mainnet - ENABLE THIS
  {
    chainId: TAIKO_MAINNET_CHAIN_ID,
    addresses: TAIKO_MAINNET_ADDRESSES,
    metadata: TAIKO_MAINNET_METADATA,
    enabled: true, // Change from false to true
    isDefault: true, // Set as default for production
  },
]
```

### Step 5: Validation

The chain registry has built-in validation that runs on application startup. When you start the app:

1. **Automatic Validation**: All enabled chains are validated
2. **Zero Address Check**: Any `0x0000...0000` addresses will fail validation
3. **Build Failure**: If validation fails, the app will not start

To validate before deployment:

```bash
npm run build
```

If all contracts are properly configured, you'll see:
```
✓ Taiko (167000) validated successfully
```

If validation fails, you'll see detailed error messages indicating which contracts have invalid addresses.

### Step 6: Update Environment Variables

Ensure your `.env` file has the correct RPC endpoint:

```bash
# Add Taiko Mainnet RPC
REACT_APP_TAIKO_MAINNET_RPC_URL=https://rpc.mainnet.taiko.xyz
```

### Step 7: Build and Deploy

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build

# Deploy the build folder to your hosting provider
```

## Architecture Overview

### Chain Configuration System

The interface uses a modular, registry-based chain configuration:

```
src/config/chains/
├── index.ts          # Re-exports all chain configurations
├── registry.ts       # Central registry with validation
├── taiko.ts          # Taiko-specific configurations
└── validation.ts     # Validation utilities
```

**Key Features:**
- ✅ **Validated on startup**: Prevents zero addresses and invalid configs
- ✅ **Centralized configuration**: Single source of truth
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Easy mainnet adoption**: Simple enabled/disabled flag

### Necessary Patches & Workarounds

#### 1. Permit2 SDK Patch (`src/constants/permit2.ts`)
**Why**: Taiko deployed Permit2 at non-canonical address
**Solution**: Centralized patch module that re-exports SDK with chain-specific overrides
**Production Ready**: ✅ Yes

#### 2. UniversalRouter Patch (`src/utils/patchUniversalRouter.ts`)
**Why**: SDK doesn't support Taiko chains
**Solution**: Override `UNIVERSAL_ROUTER_ADDRESS` function to add Taiko support
**Production Ready**: ✅ Yes

#### 3. Taiko On-Chain Quoter (`src/lib/hooks/routing/taikoQuoter.ts`)
**Why**: Uniswap Routing API doesn't support Taiko chains
**Solution**: Direct on-chain quoter calls to deployed QuoterV1/V2 contract
**Production Ready**: ✅ Yes

#### 4. ClassicTrade InputTax/OutputTax (`src/state/routing/types.ts`)
**Why**: Override readonly properties from base Trade class
**Solution**: Private fields with public getter overrides (proper TypeScript pattern)
**Production Ready**: ✅ Yes

### What Was Removed

The following unnecessary workarounds were **removed** during production hardening:

- ❌ **Runtime SDK Mutation** (`patchSdkAddresses.ts`): Removed dangerous Object.assign mutations
- ❌ **Debug Logging**: All emoji-prefixed console.logs removed or wrapped in `NODE_ENV` checks
- ❌ **Unused Code**: `taikoSimpleQuoter.ts` removed (dead code)

## Security Considerations

### For Production Deployment

1. **Contract Verification**: All contracts MUST be verified on TaikoScan
2. **Address Validation**: The registry will reject zero addresses automatically
3. **RPC Endpoints**: Use reliable, production-grade RPC providers
4. **Error Handling**: Errors are logged in development only, sanitized in production
5. **No Runtime Mutations**: All SDK patches are immutable imports, no Object.assign

### Critical Contracts

These contracts handle billions in TVL and must be:
- ✅ Audited by reputable security firms
- ✅ Deployed from verified source code
- ✅ Matching Uniswap's canonical deployments where possible
- ✅ Tested extensively on testnet first

## Testing Checklist

Before deploying to mainnet, verify the following on Taiko Hoodi testnet:

- [ ] ✅ Add liquidity to a new pool
- [ ] ✅ Add liquidity to an existing pool
- [ ] ✅ Remove liquidity from a position
- [ ] ✅ Execute a swap (ETH → Token)
- [ ] ✅ Execute a swap (Token → ETH)
- [ ] ✅ Execute a swap (Token → Token)
- [ ] ✅ Approve tokens with Permit2 signature
- [ ] ✅ Approve tokens with direct approval
- [ ] ✅ View position details
- [ ] ✅ View pool analytics
- [ ] ✅ Connect wallet (MetaMask, WalletConnect, etc.)
- [ ] ✅ Switch networks
- [ ] ✅ Transaction history
- [ ] ✅ Gas estimation accuracy
- [ ] ✅ Slippage protection

## Rollback Plan

If issues are discovered after mainnet deployment:

1. **Immediate**: Set `enabled: false` for Taiko Mainnet in `registry.ts`
2. **Rebuild**: Run `npm run build` to regenerate with mainnet disabled
3. **Redeploy**: Deploy the new build
4. **Investigate**: Debug issues on Hoodi testnet
5. **Re-enable**: Once fixed, set `enabled: true` and redeploy

## Support & Resources

- **Taiko Documentation**: https://docs.taiko.xyz/
- **Taiko Explorer**: https://taikoscan.io/
- **Taiko RPC**: https://rpc.mainnet.taiko.xyz
- **Uniswap V3 Docs**: https://docs.uniswap.org/contracts/v3/overview
- **UniversalRouter Repo**: https://github.com/Uniswap/universal-router
- **Permit2 Repo**: https://github.com/Uniswap/permit2

## Deployment Checklist

### Pre-Deployment
- [ ] All contracts deployed and verified on Taiko Mainnet
- [ ] Contract addresses updated in `config/chains/taiko.ts`
- [ ] UniversalRouter address updated
- [ ] Permit2 address configured (if non-canonical)
- [ ] Mainnet enabled in `registry.ts` with `isDefault: true`
- [ ] Environment variables configured
- [ ] Build completes without errors
- [ ] Validation passes (no zero addresses)
- [ ] All tests passing on Hoodi testnet

### Post-Deployment
- [ ] Verify app loads on Taiko Mainnet
- [ ] Test wallet connection
- [ ] Execute a small test swap
- [ ] Verify pool data loads correctly
- [ ] Check liquidity management functions
- [ ] Monitor for errors in production logs
- [ ] Verify gas estimates are reasonable
- [ ] Test with multiple wallet providers

### Production Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor RPC endpoint health
- [ ] Track transaction success rates
- [ ] Monitor gas price fluctuations
- [ ] Set up alerts for critical errors

## Common Issues & Solutions

### Issue: "No route found"
**Cause**: No liquidity pools exist for the token pair
**Solution**: Create initial liquidity pools on Taiko Mainnet

### Issue: "Insufficient liquidity"
**Cause**: Pool exists but has low liquidity
**Solution**: Add more liquidity to the pool

### Issue: "Transaction failed"
**Cause**: Various (slippage, gas, approval)
**Solution**: Check slippage tolerance, gas limits, and token approvals

### Issue: "Validation failed for chain"
**Cause**: Zero addresses or missing contracts
**Solution**: Update all addresses in `config/chains/taiko.ts`

### Issue: "QuoterV2 not found"
**Cause**: QuoterV2 not deployed
**Solution**: Either deploy QuoterV2 or use QuoterV1 (both compatible)

## Performance Optimization

For production deployment:

1. **Enable Production Build**: `NODE_ENV=production npm run build`
2. **CDN Configuration**: Serve static assets via CDN
3. **Caching**: Configure proper cache headers
4. **Code Splitting**: Enabled by default with React lazy loading
5. **RPC Load Balancing**: Use multiple RPC endpoints for redundancy

## Conclusion

This deployment guide ensures a smooth, secure transition from Taiko Hoodi testnet to Taiko Mainnet. The codebase is production-ready, having been hardened with:

- ✅ Enterprise-grade architecture
- ✅ Comprehensive validation
- ✅ Production-grade error handling
- ✅ No debug logging in production
- ✅ Type-safe configuration
- ✅ Easy rollback capabilities

For questions or issues, refer to the Taiko and Uniswap documentation linked above.
