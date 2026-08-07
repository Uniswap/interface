import type { Currency } from '@uniswap/sdk-core'
import { usePermissionedSwapPair } from 'uniswap/src/features/permissionedTokens/usePermissionedSwapPair'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'

export type PoolLookupTokenAddresses = {
  lookupAddress0: string | undefined
  lookupAddress1: string | undefined
  /**
   * True when adapter substitution reverses the pair's sort order relative to the displayed
   * currencies. The on-chain sqrtPriceX96/tick are denominated in adapter order, while SDK
   * pools built from the displayed currencies sort by sec-token address, so a flipped pair
   * would interpret the price inverted. Consumers must not build an SDK pool when flipped.
   */
  orientationFlipped: boolean
  isLoading: boolean
}

/**
 * Addresses to key pool lookups (existence checks, fee-tier discovery) on. Permissioned v4
 * pools hold the PA adapter token, not the displayed sec-token, and the pool index returns
 * nothing for the underlying pair, so each permissioned side maps to its adapter (from
 * CheckPermissions) and the pair is re-sorted lexically, mirroring
 * useRecommendedPermissionedHook's verified-live query shape. Non-permissioned pairs pass
 * through unchanged (original casing and order).
 */
export function usePoolLookupTokenAddresses({
  token0,
  token1,
}: {
  token0: Maybe<Currency>
  token1: Maybe<Currency>
}): PoolLookupTokenAddresses {
  const activeAddress = useActiveAddress(Platform.EVM)
  const { isPermissioned, isLoading, inputAdapterAddress, outputAdapterAddress } = usePermissionedSwapPair({
    inputCurrency: token0 ?? undefined,
    outputCurrency: token1 ?? undefined,
    walletAddress: activeAddress ?? undefined,
  })

  const rawAddress0 = getTokenOrZeroAddress(token0)
  const rawAddress1 = getTokenOrZeroAddress(token1)

  if (!isPermissioned) {
    return { lookupAddress0: rawAddress0, lookupAddress1: rawAddress1, orientationFlipped: false, isLoading }
  }

  const mapped0 = (inputAdapterAddress ?? rawAddress0)?.toLowerCase()
  const mapped1 = (outputAdapterAddress ?? rawAddress1)?.toLowerCase()
  const orientationFlipped = !!mapped0 && !!mapped1 && mapped0 > mapped1
  const [lookupAddress0, lookupAddress1] = orientationFlipped ? [mapped1, mapped0] : [mapped0, mapped1]

  return { lookupAddress0, lookupAddress1, orientationFlipped, isLoading }
}
