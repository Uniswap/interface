import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Text, TouchableArea } from 'ui/src'
import { MAX_DEFAULT_POPULAR_TOKEN_RESULTS_AMOUNT } from 'uniswap/src/components/TokenSelector/constants'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import {
  OnSelectCurrency,
  TokenOptionSection,
  TokenSection,
  TokenSectionsHookProps,
} from 'uniswap/src/components/TokenSelector/types'
import { useTokenOptionsSection } from 'uniswap/src/components/TokenSelector/utils'
import { SearchModalItemTypes } from 'uniswap/src/components/lists/types'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SearchModalList } from 'uniswap/src/features/search/SearchModal/SearchModalList'
import { clearSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'

function ClearAll({ onPress }: { onPress: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <TouchableArea onPress={onPress}>
      <Text color="$neutral1" variant="buttonLabel3">
        {t('tokens.selector.button.clear')}
      </Text>
    </TouchableArea>
  )
}

function useSectionsForNoQuerySearch({
  chainFilter,
}: Omit<TokenSectionsHookProps, 'input' | 'isKeyboardOpen'>): GqlResult<TokenSection<SearchModalItemTypes>[]> {
  const dispatch = useDispatch()

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

  const {
    data: tokens,
    error: tokensError,
    refetch: refetchTokens,
    loading: loadingTokens,
  } = useTrendingTokensCurrencyInfos(chainFilter)
  const popularTokenOptions = useCurrencyInfosToTokenOptions({ currencyInfos: tokens })
  const popularSection = useTokenOptionsSection({
    // TODO(WEB-5917): Rename to trendingTokens once feature flag is fully on
    sectionKey: TokenOptionSection.PopularTokens,
    tokenOptions: popularTokenOptions?.slice(0, MAX_DEFAULT_POPULAR_TOKEN_RESULTS_AMOUNT),
  })

  // add NFTs section on mobile only

  const sections = useMemo(() => [...(recentSection ?? []), ...(popularSection ?? [])], [popularSection, recentSection])

  return useMemo(
    () => ({
      data: sections,
      loading: loadingTokens,
      error: tokensError,
      refetch: refetchTokens,
    }),
    [loadingTokens, refetchTokens, sections, tokensError],
  )
}

export const SearchModalNoQueryList = memo(function _SearchModalNoQueryList({
  chainFilter,
  onSelectCurrency,
}: {
  chainFilter: UniverseChainId | null
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  const { t } = useTranslation()

  const { data: sections, loading, error, refetch } = useSectionsForNoQuerySearch({ chainFilter })

  return (
    <SearchModalList
      showTokenAddress
      errorText={t('token.selector.search.error')}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      onSelectCurrency={onSelectCurrency}
    />
  )
})
