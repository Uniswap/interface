import { useQuery } from '@tanstack/react-query'
import { checkWalletDelegation } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { deriveEmbeddedWalletDelegationResult } from 'uniswap/src/features/passkey/embeddedWalletDelegation'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_HOUR_MS } from 'utilities/src/time/time'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useIsEmbeddedWallet } from '~/hooks/useIsEmbeddedWallet'

const NO_DELEGATION: SwapDelegationInfo = { delegationAddress: undefined, delegationInclusion: false }

/**
 * Web source of swap delegation info for embedded wallets (EW).
 *
 * Mirrors mobile/extension's `useGetSwapDelegationInfoForActiveAccount`
 * (`packages/wallet/src/features/smartWallet/WalletDelegationProvider.tsx`), but
 * keyed off web's embedded-wallet account instead of the wallet redux store. When
 * the active wallet is an embedded wallet, this fetches delegation status for its
 * address across the enabled chains via the Trading API and derives the result with
 * the same helper the EW execution path uses (`deriveEmbeddedWalletDelegationResult`
 * via `checkEmbeddedWalletDelegation`), so the displayed routing/gas matches what
 * executes through `sendDelegatedTransaction`.
 *
 * With this provided on `UniswapContext`, the swap review's
 * `evmSwapInstructionsService` routes delegation-eligible EW swaps to `/swap_7702`,
 * which sets `includesDelegation` (the "Includes smart wallet activation" subtitle)
 * and returns delegation-aware gas.
 *
 * Returns `{ delegationAddress: undefined, delegationInclusion: false }` for non-EW
 * accounts so regular-wallet swaps are never routed to the 7702 path — the routing
 * gate in `evmSwapInstructionsService` keys on `delegationAddress` being truthy.
 */
export function useGetSwapDelegationInfo(): (chainId?: UniverseChainId) => SwapDelegationInfo {
  const isEmbeddedWallet = useIsEmbeddedWallet()
  const evmAddress = useActiveAddress(Platform.EVM)
  const { chains } = useEnabledChains()

  // Only track delegation for embedded wallets so regular wallets make no extra request.
  const enabled = isEmbeddedWallet && Boolean(evmAddress) && chains.length > 0

  const delegationQuery = useQuery({
    queryKey: [ReactQueryCacheKey.WalletDelegation, evmAddress, ...chains],
    queryFn: async () =>
      checkWalletDelegation({
        walletAddresses: evmAddress ? [evmAddress] : [],
        chainIds: chains.map((chain) => chain.valueOf()),
      }),
    enabled,
    staleTime: ONE_HOUR_MS,
    gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
    refetchInterval: ONE_HOUR_MS,
    refetchOnMount: 'always',
  })

  return useEvent((chainId?: UniverseChainId): SwapDelegationInfo => {
    if (!isEmbeddedWallet || !evmAddress || !chainId) {
      return NO_DELEGATION
    }
    const result = deriveEmbeddedWalletDelegationResult(delegationQuery.data?.delegationDetails[evmAddress]?.[chainId])
    return {
      delegationAddress: result?.contractAddress,
      delegationInclusion: result?.needsDelegation ?? false,
      isWalletDelegatedToUniswap: result?.isWalletDelegatedToUniswap,
    }
  })
}
