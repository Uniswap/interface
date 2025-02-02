import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Text, TouchableArea } from 'ui/src'
import { currencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { TokenOptionSection, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { useTokenOptionsSection } from 'uniswap/src/components/TokenSelector/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { gqlTokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils'
import { clearSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { usePopularTokens } from 'uniswap/src/features/tokens/hooks'

function ClearAll({ onPress }: { onPress: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <TouchableArea onPress={onPress}>
      <Text color="$accent1" variant="buttonLabel3">
        {t('tokens.selector.button.clear')}
      </Text>
    </TouchableArea>
  )
}

export function useTokenSectionsForEmptySearch(chainFilter: UniverseChainId | null): GqlResult<TokenSection[]> {
  const dispatch = useDispatch()

  const { popularTokens, loading } = usePopularTokens()

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter)

  // it's a dependency of useMemo => useCallback
  const onPressClearSearchHistory = useCallback((): void => {
    dispatch(clearSearchHistory())
  }, [dispatch])

  const recentSection = useTokenOptionsSection({
    sectionKey: TokenOptionSection.RecentTokens,
    tokenOptions: recentlySearchedTokenOptions,
    endElement: <ClearAll onPress={onPressClearSearchHistory} />,
  })

  const popularSection = useTokenOptionsSection({
    sectionKey: TokenOptionSection.PopularTokens,
    tokenOptions: currencyInfosToTokenOptions(popularTokens?.map(gqlTokenToCurrencyInfo)),
  })
  const sections = useMemo(() => [...(recentSection ?? []), ...(popularSection ?? [])], [popularSection, recentSection])

  return useMemo(
    () => ({
      data: sections,
      loading,
    }),
    [loading, sections],
  )
}
