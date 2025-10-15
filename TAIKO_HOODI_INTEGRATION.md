# Taiko Hoodi Integration Guide

## Overview

This document describes the integration of Taiko Hoodi Testnet (Chain ID: 167012) into the Uniswap Interface. The integration enables full Uniswap V3 functionality on the Taiko Hoodi testnet.

## Deployment Information

### Network Details
- **Network Name**: Taiko Hoodi Testnet
- **Chain ID**: 167012
- **RPC URL**: https://rpc.hoodi.taiko.xyz
- **Block Explorer**: https://hoodi.taikoscan.io/
- **Native Currency**: ETH (18 decimals)
- **Deployer Address**: 0xFE5124f99f544a84C3C6D0A26339a04937cD2Ff4

### Deployed Contracts

#### Core Protocol
- **WETH9**: `0x73C251a8005D31900Fe32A309C05d60adf6ba87a`
- **UniswapV3Factory**: `0xF7D0a7B04eBcB07b1bB5992d6B50a5BF55C903af`

#### Periphery Contracts
- **SwapRouter02**: `0x7812fF6117c838cC025F5cfaD5ac8C300baA0c5D`
- **NonfungiblePositionManager**: `0x6a794430DC233E3433E8a70d1a900923fd3cB9e3`
- **QuoterV2**: `0xef840140Dd75eC5Fa4Aa0002aEa52a8937da2611`
- **UniswapInterfaceMulticall**: `0xA37f6e12b224A3d6AaF5C384876B919b3122B830`
- **TickLens**: `0xFaF7dd4dF637fdcb9Abe41e98D84b3e4a906A1D0`

#### Additional Contracts
- **V3Migrator**: `0xe59A68212b91FfAb07195f95c607A2A3CdAf012B`
- **V3Staker**: `0x01715d9e4b69D25dbf1c4047287CF3f47F070d35`
- **ProxyAdmin**: `0xa3a3F71bd5a24BC65B4ba80ac14839fAAc7ae5fD`
- **NFT Descriptor Proxy**: `0x290265ACd21816EE414E64eEC77dd490d8dd9f51`

## Integration Changes

### Files Created

1. **`src/constants/taiko.ts`**
   - Defines Taiko Hoodi chain ID constant (167012)
   - Contains all Uniswap V3 contract addresses for Taiko Hoodi
   - Exports address mappings for SDK compatibility

2. **`src/utils/patchSdkAddresses.ts`**
   - Runtime patching utility for @uniswap/sdk-core address constants
   - Extends SDK address mappings to support Taiko Hoodi
   - Called at app initialization to enable SDK functionality

### Files Modified

1. **`src/constants/chainInfo.ts`**
   - Added Taiko Hoodi chain information (L2 network)
   - Configured network metadata (explorer, docs, bridge, etc.)
   - Set native currency and network type

2. **`src/constants/chains.ts`**
   - Added Taiko Hoodi to CHAIN_IDS_TO_NAMES mapping
   - Updated isSupportedChain() to recognize custom chains
   - Added to TESTNET_CHAIN_IDS and L2_CHAIN_IDS arrays
   - Updated getChainPriority() to handle Taiko chain ID

3. **`src/constants/networks.ts`**
   - Added RPC URL configuration for Taiko Hoodi
   - Set fallback RPC endpoints

4. **`src/constants/providers.ts`**
   - Added Taiko Hoodi JSON-RPC provider
   - Integrated with RPC_PROVIDERS mapping

5. **`src/constants/tokens.ts`**
   - Added WETH token for Taiko Hoodi
   - Updated WRAPPED_NATIVE_CURRENCY mapping

6. **`src/constants/routing.ts`**
   - Added common base currencies for Taiko Hoodi
   - Configured routing with native ETH and WETH

7. **`src/index.tsx`**
   - Called patchSdkAddressesForTaiko() at app initialization
   - Ensures SDK address constants include Taiko support

8. **`src/theme/colors.ts`**
   - Added Taiko brand colors based on official Taiko bridge
   - Primary: #C8047D (pink-500 from Taiko brand guidelines)
   - Soft background: rgba(200, 4, 125, 0.16)
   - Chain-specific colors for chain_167012

## Architecture Notes

### Custom Chain Integration

Since Taiko Hoodi (Chain ID 167012) is not in the official @uniswap/sdk-core package, we use a hybrid approach:

1. **Configuration Layer**: Define all chain-specific data in application constants
2. **Runtime Patching**: Patch SDK address constants at app initialization
3. **Type Extensions**: Extend SupportedInterfaceChain type to include custom chain

This approach allows the interface to work with custom chains without forking the SDK.

### SDK Address Patching

The `patchSdkAddressesForTaiko()` function uses `Object.assign()` to add Taiko addresses to SDK constants:

```typescript
Object.assign(V3_CORE_FACTORY_ADDRESSES, TAIKO_HOODI_V3_CORE_FACTORY_ADDRESSES)
Object.assign(MULTICALL_ADDRESSES, TAIKO_HOODI_MULTICALL_ADDRESSES)
// ... etc
```

This is called early in `index.tsx` to ensure all SDK-dependent code sees the patched addresses.

## TODO / Known Limitations

### Pending Tasks

1. **Logo Assets**: Currently using Ethereum logo as placeholder
   - [ ] Add official Taiko logo SVG to `src/assets/svg/`
   - [ ] Add Taiko square logo variant
   - [ ] Update `src/constants/chainInfo.ts` with proper logo paths

2. **Theme Colors**: ✅ Completed
   - [x] Added Taiko brand color (#C8047D - pink/magenta from bridge.taiko.xyz)
   - [x] Added soft variant for backgrounds (rgba(200, 4, 125, 0.16))
   - [x] Updated `src/constants/chainInfo.ts` with proper Taiko colors

3. **Token List**: No default token list configured
   - [ ] Create or import Taiko Hoodi token list
   - [ ] Update `src/constants/lists.ts` with Taiko token list
   - [ ] Set defaultListUrl in chainInfo.ts

4. **Testing**: Integration not yet tested
   - [ ] Test wallet connection with Taiko Hoodi
   - [ ] Test token swaps on Taiko Hoodi
   - [ ] Test liquidity provision on Taiko Hoodi
   - [ ] Verify all contract interactions work correctly

### Limitations

- **V2 Support**: Only V3 is supported (no V2 pools on Taiko)
- **Governance**: Governance contracts not deployed on Taiko
- **Analytics**: No analytics/info page integration yet
- **Testnet Only**: This integration is for testnet only

## Usage

### Adding Taiko Hoodi to MetaMask

Users can manually add the network with these parameters:
- Network Name: Taiko Hoodi
- RPC URL: https://rpc.hoodi.taiko.xyz
- Chain ID: 167012
- Currency Symbol: ETH
- Block Explorer: https://hoodi.taikoscan.io/

### For Developers

To add additional chains, follow this pattern:

1. Create constants file in `src/constants/` (e.g., `taiko.ts`)
2. Update all relevant constant files (chains, chainInfo, networks, etc.)
3. Create address patch utility in `src/utils/`
4. Call patch function in `src/index.tsx`
5. Add appropriate assets (logos, theme colors)

## Testing Checklist

Before deploying to production, verify:

- [ ] App builds without TypeScript errors
- [ ] Taiko Hoodi appears in network selector
- [ ] Can connect wallet to Taiko Hoodi
- [ ] Can view balances on Taiko Hoodi
- [ ] Can perform swaps (if liquidity exists)
- [ ] Can add liquidity (create positions)
- [ ] Can remove liquidity
- [ ] Transaction history displays correctly
- [ ] Block explorer links work
- [ ] Network switching works smoothly

## References

- Taiko Documentation: https://docs.taiko.xyz/
- Uniswap V3 Docs: https://docs.uniswap.org/protocol/introduction
- Original Deployment Summary: `~/dev/taiko/repos/deploy-v3/worktrees/taiko-hoodi/DEPLOYMENT_SUMMARY.md`

## Deployment Date

**Integration Date**: 2025-10-14
**Deployment Summary**: Based on deployment from 2025-10-14
