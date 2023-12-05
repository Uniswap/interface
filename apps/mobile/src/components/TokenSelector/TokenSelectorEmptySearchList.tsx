import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { TokenSelectorList } from 'src/components/TokenSelector/TokenSelectorList'
import { OnSelectCurrency, TokenOption, TokenSection } from 'src/components/TokenSelector/types'
import { getTokenOptionsSection } from 'src/components/TokenSelector/utils'
import { clearSearchHistory } from 'src/features/explore/searchHistorySlice'
import { SearchResultType, TokenSearchResult } from 'src/features/explore/SearchResult'
import { selectSearchHistory } from 'src/features/explore/selectSearchHistory'
import { usePopularTokens } from 'src/features/tokens/hooks'
import { Text, TouchableArea } from 'ui/src'
import { SafetyLevel } from 'wallet/src/data/__generated__/types-and-hooks'
import { CurrencyInfo, GqlResult } from 'wallet/src/features/dataApi/types'
import { buildCurrency, gqlTokenToCurrencyInfo } from 'wallet/src/features/dataApi/utils'
import { currencyId } from 'wallet/src/utils/currencyId'

function searchResultToCurrencyInfo({
  chainId,
  address,
  symbol,
  name,
  logoUrl,
  safetyLevel,
}: TokenSearchResult): CurrencyInfo | null {
  const currency = buildCurrency({
    chainId,
    address,
    decimals: 0, // this does not matter in a context of CurrencyInfo here, as we do not provide any balance
    symbol,
    name,
  })

  if (!currency) return null

  const currencyInfo: CurrencyInfo = {
    currency,
    currencyId: currencyId(currency),
    logoUrl,
    safetyLevel: safetyLevel ?? SafetyLevel.StrongWarning,
    // defaulting to not spam, as user has searched and chosen this token before
    isSpam: false,
  }
  return currencyInfo
}

function currencyInfosToTokenOptions(
  currencyInfos: Array<CurrencyInfo | null> | undefined
): TokenOption[] | undefined {
  return currencyInfos
    ?.filter((cI): cI is CurrencyInfo => Boolean(cI))
    .map((currencyInfo) => ({
      currencyInfo,
      quantity: null,
      balanceUSD: undefined,
    }))
}

function ClearAll({ onPress }: { onPress: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <TouchableArea onPress={onPress}>
      <Text color="$accent1" variant="buttonLabel3">
        {t('Clear all')}
      </Text>
    </TouchableArea>
  )
}

function useTokenSectionsForEmptySearch(): GqlResult<TokenSection[]> {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const { popularTokens, loading } = usePopularTokens()

  const searchHistory = useAppSelector(selectSearchHistory)

  // it's a depenedency of useMemo => useCallback
  const onPressClearSearchHistory = useCallback((): void => {
    dispatch(clearSearchHistory())
  }, [dispatch])

  const sections = useMemo(
    () => [
      ...(getTokenOptionsSection(
        t('Recent searches'),
        currencyInfosToTokenOptions(
          searchHistory
            .filter(
              (searchResult): searchResult is TokenSearchResult =>
                searchResult.type === SearchResultType.Token
            )
            .map(searchResultToCurrencyInfo)
        ),
        <ClearAll onPress={onPressClearSearchHistory} />
      ) ?? []),
      ...(getTokenOptionsSection(
        t('Popular tokens'),
        currencyInfosToTokenOptions(popularTokens?.map(gqlTokenToCurrencyInfo))
      ) ?? []),
    ],
    [onPressClearSearchHistory, popularTokens, searchHistory, t]
  )

  return useMemo(
    () => ({
      data: sections,
      loading,
    }),
    [loading, sections]
  )
}

function _TokenSelectorEmptySearchList({
  onSelectCurrency,
}: {
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  const { t } = useTranslation()

  const { data: sections, loading, error, refetch } = useTokenSectionsForEmptySearch()

  return (
    <TokenSelectorList
      showTokenAddress
      errorText={t('Couldn’t load search results')}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorEmptySearchList = memo(_TokenSelectorEmptySearchList)
