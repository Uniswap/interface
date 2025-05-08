import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Text, TouchableArea, isWeb } from 'ui/src'
import { MAX_DEFAULT_POPULAR_TOKEN_RESULTS_AMOUNT } from 'uniswap/src/components/TokenSelector/constants'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import { TokenOptionSection, TokenSection, TokenSectionsHookProps } from 'uniswap/src/components/TokenSelector/types'
import { useTokenOptionsSection } from 'uniswap/src/components/TokenSelector/utils'
import { PoolOption, SearchModalItemTypes } from 'uniswap/src/components/lists/types'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
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

  const MOCK_POOLS_SECTION: TokenSection<PoolOption>[] = useMemo(
    () => [
      {
        sectionKey: TokenOptionSection.PopularTokens, // temp
        data: [
          {
            poolId: '0x1234567890123456789012345678901234567890',
            chainId: UniverseChainId.Unichain,
            token0CurrencyInfo: {
              currency: {
                chainId: UniverseChainId.Unichain,
                address: '0x1234567890123456789012345678901234567890',
                decimals: 18,
                name: 'Unichain',
                symbol: 'UNI',
              },
            },
            token1CurrencyInfo: {
              currency: {
                chainId: UniverseChainId.Unichain,
                address: '0x1234567890123456789012345678901234567890',
                decimals: 18,
                name: 'Unichain',
                symbol: 'UNI',
              },
            },
            hookAddress: '0x1234567890123456789012345678901234567890',
            protocolVersion: ProtocolVersion.V3,
            feeTier: 3000,
          } as PoolOption,
        ],
      },
    ],
    [],
  )

  const sections = useMemo(
    () => [...(recentSection ?? []), ...(popularSection ?? []), ...(isWeb ? MOCK_POOLS_SECTION : [])],
    [popularSection, recentSection, MOCK_POOLS_SECTION],
  )

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
  onSelect,
}: {
  chainFilter: UniverseChainId | null
  onSelect: (item: SearchModalItemTypes) => void
}): JSX.Element {
  const { t } = useTranslation()

  const { data: sections, loading, error, refetch } = useSectionsForNoQuerySearch({ chainFilter })

  return (
    <SearchModalList
      errorText={t('token.selector.search.error')}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      onSelect={onSelect}
    />
  )
})
