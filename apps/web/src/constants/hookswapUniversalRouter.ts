import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from '@uniswap/universal-router-sdk'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * HookSwap-aware Universal Router address resolver.
 *
 * The upstream `@uniswap/universal-router-sdk` `CHAIN_CONFIGS` has NO entry for the
 * HookSwap custom chains, so `UNIVERSAL_ROUTER_ADDRESS()` either THROWS
 * ("Universal Router not deployed on chain" — 999/4663/4326/57073) or returns a
 * wrong/zero address (196/4217). This wrapper returns the REAL deployed
 * HookSwap-owned Universal Router for those chains (from
 * `contracts/deployments/<chain>.json`) and delegates every other chain
 * (Mainnet, Sepolia, canonical L2s) to the SDK unchanged.
 *
 * NOTE (validate before GA): the deployed UR is the newer v4+Across fork (11-field
 * RouterParameters, v4 fields zeroed). The address is correct here, but the swap
 * CALLDATA is produced by this SDK's `SwapRouter.swapCallParameters` — its command
 * set must match what the deployed router accepts. Confirm the deployed
 * `supportedURVersions` (`_2_0`) against the calldata on a testnet swap before
 * enabling execution on the custom chains. Address resolution ≠ version compat.
 */
const HOOKSWAP_UNIVERSAL_ROUTER: Partial<Record<UniverseChainId, string>> = {
  [UniverseChainId.MegaETH]: '0x3D30133F4d4A80684F02d8310faF572E3dc193b3',
  [UniverseChainId.Robinhood]: '0x3D30133F4d4A80684F02d8310faF572E3dc193b3',
  [UniverseChainId.Ink]: '0x3D30133F4d4A80684F02d8310faF572E3dc193b3',
  [UniverseChainId.XLayer]: '0x6d8a0783213B3b06648DB3708a89732af3661005',
  [UniverseChainId.HyperEvm]: '0xD9d4795F2A12305a12C36455ADAD011F2D6143AB',
  [UniverseChainId.Tempo]: '0x62aE013cb2b232C20094B466C94bb39714eF661E',
}

/**
 * Drop-in replacement for the SDK's `UNIVERSAL_ROUTER_ADDRESS(version, chainId)`.
 * For HookSwap custom chains the `version` arg is intentionally ignored (there is a
 * single deployed UR per chain); for all others it delegates to the SDK verbatim.
 */
export function hookswapUniversalRouterAddress(version: UniversalRouterVersion, chainId: number): string {
  const own = HOOKSWAP_UNIVERSAL_ROUTER[chainId as UniverseChainId]
  return own ?? UNIVERSAL_ROUTER_ADDRESS(version, chainId)
}
