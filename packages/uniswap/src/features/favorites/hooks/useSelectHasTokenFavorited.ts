import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { useMultichainFavoritesRankings } from 'uniswap/src/features/favorites/hooks/useMultichainFavoritesRankings'
import {
  makeSelectHasTokenFavorited,
  makeSelectHasTokenFavoritedByAddress,
} from 'uniswap/src/features/favorites/selectors'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export function useSelectHasTokenFavorited(currencyId: string): boolean {
  const isMultichainEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const selectExact = useMemo(makeSelectHasTokenFavorited, [])
  const selectByAddress = useMemo(makeSelectHasTokenFavoritedByAddress, [])
  const { canonicalByKey } = useMultichainFavoritesRankings()

  return useSelector((state: UniswapState) => {
    if (!isMultichainEnabled) {
      return selectExact(state, normalizeCurrencyIdForMapLookup(currencyId))
    }
    // Projects like USDC / USDT / WBTC have a different address on every chain, so an address-only
    // compare misses them. Resolve the input to its canonical (mainnet) CurrencyId first and check
    // membership against that. Falls through to address-match for tokens not in rankings data.
    const canonical = canonicalByKey.get(normalizeCurrencyIdForMapLookup(currencyId))
    if (canonical && state.favorites.tokens.includes(canonical)) {
      return true
    }
    return selectByAddress(state, currencyId)
  })
}
