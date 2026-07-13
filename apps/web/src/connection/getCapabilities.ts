import { hexToNumber, isValidHexString } from '@universe/encoding'
import { getFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEnabledChains } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getCapabilitiesCore } from 'wallet/src/features/batchedTransactions/utils'
import type { Capability } from 'wallet/src/features/dappRequests/types'

/**
 * EIP-5792 `wallet_getCapabilities` for the embedded wallet. Reports atomic
 * batching + paymaster sponsorship per chain, derived from on-chain delegation
 * status via the shared `getCapabilitiesCore` (same code mobile/extension use
 * for their dapp-request handlers):
 *   - 'supported'  → wallet already delegated to Calibur on this chain
 *   - 'ready'      → not yet delegated; first 5792 call will include the
 *                    EIP-7702 authorization
 *   - 'unsupported'→ chain is non-Uniswap-delegated or trading-api call failed
 *
 * `requestedChainIds`: the caller-requested chain ids when provided (per the
 * 5792 spec, `params[1]`), otherwise the production EVM chains enabled by
 * feature flags — mirroring the extension's `request.chainIds ?? enabledChains`
 * derivation.
 * Testnet-mode chains are deliberately excluded: missing chains just mean
 * flows fall back to non-batched execution, while advertising chains we can't
 * delegate on would break them.
 *
 * EW users have implicit smart-wallet consent (the wallet wouldn't exist
 * otherwise), so `hasSmartWalletConsent` is always true.
 */
export async function getEmbeddedWalletCapabilities({
  address,
  requestedChainIds,
}: {
  address: string
  requestedChainIds?: string[]
}): Promise<Record<string, Capability>> {
  const requested = requestedChainIds
    ?.filter((chainId) => isValidHexString(chainId))
    .map((chainId) => hexToNumber(chainId) as UniverseChainId)

  const chainIds =
    requested && requested.length > 0
      ? requested
      : getEnabledChains({
          platform: Platform.EVM,
          isTestnetModeEnabled: false,
          featureFlaggedChainIds: getFeatureFlaggedChainIds(),
        }).chains

  return getCapabilitiesCore({
    address,
    chainIds: chainIds.map((chainId) => chainId.valueOf()),
    hasSmartWalletConsent: true,
  })
}
