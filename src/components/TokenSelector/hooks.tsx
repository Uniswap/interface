import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { COMMON_BASES } from 'src/constants/tokens'
import { useTokenProjects } from 'src/features/dataApi/tokenProjects'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { currencyId } from 'src/utils/currencyId'

export function useFavoriteCurrencies(): CurrencyInfo[] {
  const favoriteCurrencyIds = useAppSelector(selectFavoriteTokensSet)
  return useTokenProjects(Array.from(favoriteCurrencyIds))
}

export function useCommonBases(chainFilter: ChainId | null): CurrencyInfo[] {
  const baseCurrencyIds = useMemo(() => {
    // If no chain filter is selected (All networks), use mainnet common bases
    const baseCurrencies = COMMON_BASES[chainFilter ?? ChainId.Mainnet]
    return baseCurrencies.map((currency) => currencyId(currency))
  }, [chainFilter])

  return useTokenProjects(baseCurrencyIds)
}

export function useFilterCallbacks(chainId: ChainId | null) {
  const [chainFilter, setChainFilter] = useState<ChainId | null>(chainId)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)

  useEffect(() => {
    setChainFilter(chainId)
  }, [chainId])

  const onChangeChainFilter = useCallback((newChainFilter: typeof chainFilter) => {
    setChainFilter(newChainFilter)
  }, [])

  const onClearSearchFilter = useCallback(() => {
    setSearchFilter(null)
  }, [])

  const onChangeText = useCallback(
    (newSearchFilter: string) => setSearchFilter(newSearchFilter),
    [setSearchFilter]
  )

  return {
    chainFilter,
    searchFilter,
    onChangeChainFilter,
    onClearSearchFilter,
    onChangeText,
  }
}
