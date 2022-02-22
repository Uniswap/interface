import { Currency } from '@uniswap/sdk-core'
import { useCallback, useMemo, useState } from 'react'
import { ChainId } from 'src/constants/chains'
import { useDebounce } from 'src/utils/timing'
import { filter } from './util'

export function useFilteredCurrencies(
  currencies: Currency[],
  initialChainId: ChainId | undefined | null = null
) {
  const [chainFilter, setChainFilter] = useState<ChainId | null>(initialChainId)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)

  const debouncedSearchFilter = useDebounce(searchFilter)

  const filteredCurrencies = useMemo(
    () => filter(currencies ?? null, chainFilter, debouncedSearchFilter),
    [chainFilter, currencies, debouncedSearchFilter]
  )

  const onChainPress = (newChainFilter: typeof chainFilter) => {
    if (chainFilter === newChainFilter) {
      setChainFilter(null)
    } else {
      setChainFilter(newChainFilter)
    }
  }

  const onClearChainFilter = useCallback(() => setChainFilter(null), [])
  const onClearSearchFilter = useCallback(() => setSearchFilter(null), [])

  const onChangeText = useCallback(
    (newSearchFilter: string) => setSearchFilter(newSearchFilter),
    [setSearchFilter]
  )

  return {
    chainFilter,
    searchFilter,
    filteredCurrencies,
    onChainPress,
    onClearChainFilter,
    onClearSearchFilter,
    onChangeText,
  }
}
