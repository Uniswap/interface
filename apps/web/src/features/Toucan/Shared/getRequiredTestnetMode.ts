import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'

/**
 * Toucan on-chain actions (bidding, withdrawing) call `selectChain`, which rejects any chain outside
 * the app's enabled set. `getEnabledChains` partitions that set by testnet mode (testnets only when
 * testnet mode is on, mainnets only when off), so acting on a Sepolia auction with testnet mode off
 * fails deep in the submit saga with an opaque "Failed to switch networks" error.
 *
 * Returns the testnet mode the app must be switched into for the action to go through, or `undefined`
 * when no switch is needed — already aligned, no connected wallet, the action isn't currently
 * available, or the chain is unknown. Callers turn the primary button into a one-tap CTA that flips
 * testnet mode instead of letting the user hit that dead end.
 */
export function getRequiredTestnetMode({
  isWalletConnected,
  isActionAvailable,
  isModeMismatch,
  chainId,
}: {
  isWalletConnected: boolean
  isActionAvailable: boolean
  isModeMismatch: boolean
  chainId?: UniverseChainId
}): boolean | undefined {
  if (!isWalletConnected || !isActionAvailable || chainId === undefined || !isModeMismatch) {
    return undefined
  }

  // Align testnet mode with the auction chain: testnet chain -> enable, mainnet chain -> disable.
  return isTestnetChain(chainId)
}
