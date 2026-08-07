import { permit2Address } from '@uniswap/permit2-sdk'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

/**
 * Whether an address is a canonical Uniswap protocol contract on the given chain.
 * Used to show the Uniswap-verified badge on contracts approved from first-party
 * Uniswap sites.
 *
 * Scoped to Permit2 — the spender for first-party approvals — until the unified
 * address inventory lands and broader coverage (routers, position managers,
 * UniswapX reactors) can be checked against an attested list.
 */
export function isUniswapContract({ chainId, address }: { chainId: UniverseChainId; address: string }): boolean {
  try {
    return areAddressesEqual({
      addressInput1: { address, chainId },
      addressInput2: { address: permit2Address(chainId), chainId },
    })
  } catch {
    // malformed address input — not a Uniswap contract
    return false
  }
}
