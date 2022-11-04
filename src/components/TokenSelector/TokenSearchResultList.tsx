import { Currency } from '@uniswap/sdk-core'
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { Box, Flex, Inset } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { filter } from 'src/components/TokenSelector/filter'
import { useAllCommonBaseCurrencies } from 'src/components/TokenSelector/hooks'
import { NetworkFilter } from 'src/components/TokenSelector/NetworkFilter'
import { TokenOptionItem } from 'src/components/TokenSelector/TokenOptionItem'
import { TokenSelectorVariation } from 'src/components/TokenSelector/TokenSelector'
import { TokenOption } from 'src/components/TokenSelector/types'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { usePortfolioBalances } from 'src/features/dataApi/balances'
import { useSearchTokens } from 'src/features/dataApi/searchTokens'
import { usePopularTokens } from 'src/features/dataApi/topTokens'
import { CurrencyInfo, PortfolioBalance } from 'src/features/dataApi/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { makeSelectAccountHideSmallBalances } from 'src/features/wallet/selectors'
import { HIDE_SMALL_USD_BALANCES_THRESHOLD } from 'src/features/wallet/walletSlice'
import { differenceWith } from 'src/utils/array'
import { useDebounce } from 'src/utils/timing'

interface TokenSearchResultListProps {
  onChangeChainFilter: (newChainFilter: ChainId | null) => void
  onSelectCurrency: (currency: Currency) => void
  searchFilter: string | null
  chainFilter: ChainId | null
  variation: TokenSelectorVariation
}

const tokenOptionComparator = (tokenOption: TokenOption, otherTokenOption: TokenOption) => {
  return tokenOption.currencyInfo.currencyId === otherTokenOption.currencyInfo.currencyId
}
// get items in `currencies` that are not in `without`
// e.g. difference([B, C, D], [A, B, C]) would return ([D])
const difference = (currencies: TokenOption[], without: TokenOption[]) => {
  return differenceWith(currencies, without, tokenOptionComparator)
}

type TokenSection = {
  title: string
  data: TokenOption[]
}

const createEmptyBalanceOption = (currencyInfo: CurrencyInfo): TokenOption => ({
  currencyInfo,
  balanceUSD: null,
  quantity: null,
})

export function useTokenSectionsByVariation(
  variation: TokenSelectorVariation,
  chainFilter: ChainId | null,
  searchFilter: string | null
): { sections: TokenSection[]; loading: boolean } {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()
  const hideSmallBalances = useAppSelector(
    makeSelectAccountHideSmallBalances(activeAccount.address)
  )

  const { data: popularTokens, loading: popularTokensLoading } = usePopularTokens()
  const { data: portfolioBalancesById, loading: portfolioBalancesLoading } = usePortfolioBalances(
    activeAccount.address
  )
  const { data: commonBaseCurrencies, loading: commonBaseCurrenciesLoading } =
    useAllCommonBaseCurrencies()

  const portfolioBalances: PortfolioBalance[] = useMemo(() => {
    if (!portfolioBalancesById) return EMPTY_ARRAY

    const allPortfolioBalances: PortfolioBalance[] = Object.values(portfolioBalancesById).sort(
      (a, b) => b.balanceUSD - a.balanceUSD
    )

    return hideSmallBalances
      ? allPortfolioBalances.filter(
          (portfolioBalance) => portfolioBalance.balanceUSD > HIDE_SMALL_USD_BALANCES_THRESHOLD
        )
      : allPortfolioBalances
  }, [portfolioBalancesById, hideSmallBalances])

  const popularTokenOptions = useMemo(() => {
    if (!popularTokens) return EMPTY_ARRAY

    return popularTokens
      .sort((a, b) => {
        if (a.currency.name && b.currency.name) {
          return a.currency.name.localeCompare(b.currency.name)
        }
        return 0
      })
      .map((currencyInfo) => {
        return (
          portfolioBalancesById?.[currencyInfo.currencyId] ?? createEmptyBalanceOption(currencyInfo)
        )
      })
  }, [popularTokens, portfolioBalancesById])

  const commonBaseTokenOptions = useMemo(() => {
    if (!commonBaseCurrencies) return EMPTY_ARRAY

    return commonBaseCurrencies.map((currencyInfo) => {
      return (
        portfolioBalancesById?.[currencyInfo.currencyId] ?? createEmptyBalanceOption(currencyInfo)
      )
    })
  }, [commonBaseCurrencies, portfolioBalancesById])

  // Only call search endpoint if searchFilter is non-null and TokenSelectorVariation includes tokens without balance
  const skipSearch = !searchFilter || variation === TokenSelectorVariation.BalancesOnly
  const { data: searchResultCurrencies, loading: searchTokensLoading } = useSearchTokens(
    searchFilter,
    chainFilter,
    skipSearch
  )
  const searchResults = useMemo(() => {
    if (!searchResultCurrencies) return EMPTY_ARRAY

    return searchResultCurrencies.map((currencyInfo) => {
      return (
        portfolioBalancesById?.[currencyInfo.currencyId] ?? createEmptyBalanceOption(currencyInfo)
      )
    })
  }, [searchResultCurrencies, portfolioBalancesById])

  const sections = useMemo(() => {
    // Return single "search results" section when user has searchFilter
    if (searchFilter && searchFilter.length > 0) {
      if (variation === TokenSelectorVariation.BalancesOnly) {
        // Use local search when only searching balances
        const results = filter(portfolioBalances, chainFilter, searchFilter)
        return results.length > 0
          ? [
              {
                title: t('Search results'),
                data: results,
              },
            ]
          : []
      } else {
        return searchResults.length > 0
          ? [
              {
                title: t('Search results'),
                data: searchResults,
              },
            ]
          : []
      }
    }

    if (variation === TokenSelectorVariation.BalancesOnly) {
      return [
        {
          title: t('Your tokens'),
          data: filter(portfolioBalances, chainFilter),
        },
      ]
    }

    if (variation === TokenSelectorVariation.BalancesAndPopular) {
      const popularMinusBalances = difference(popularTokenOptions, portfolioBalances)
      return [
        {
          title: t('Your tokens'),
          data: filter(portfolioBalances, chainFilter),
        },
        {
          title: t('Popular tokens'),
          data: filter(popularMinusBalances, chainFilter),
        },
      ]
    }

    // SuggestedAndPopular variation
    const balancesAndCommonBases = [
      ...commonBaseTokenOptions,
      ...difference(portfolioBalances, commonBaseTokenOptions),
    ]
    const popularMinusBalancesAndCommonBases = difference(
      popularTokenOptions,
      balancesAndCommonBases
    )

    return [
      {
        title: t('Suggested'),
        data: filter(balancesAndCommonBases, chainFilter),
      },
      {
        title: t('Popular tokens'),
        data: filter(popularMinusBalancesAndCommonBases, chainFilter),
      },
    ]
  }, [
    portfolioBalances,
    popularTokenOptions,
    commonBaseTokenOptions,
    searchResults,
    t,
    variation,
    chainFilter,
    searchFilter,
  ])

  const loading =
    commonBaseCurrenciesLoading ||
    popularTokensLoading ||
    portfolioBalancesLoading ||
    searchTokensLoading

  return useMemo(() => ({ sections, loading }), [sections, loading])
}

function _TokenSearchResultList({
  onChangeChainFilter,
  onSelectCurrency,
  chainFilter,
  searchFilter,
  variation,
}: TokenSearchResultListProps) {
  const { t } = useTranslation()
  const sectionListRef = useRef<SectionList<TokenOption>>(null)

  const debouncedSearchFilter = useDebounce(searchFilter)
  const { sections, loading } = useTokenSectionsByVariation(
    variation,
    chainFilter,
    debouncedSearchFilter
  )

  const sectionsRef = useRef(sections)
  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TokenOption>) => {
      return (
        <TokenOptionItem
          option={item}
          showNetworkPill={!chainFilter && item.currencyInfo.currency.chainId !== ChainId.Mainnet}
          onPress={() => onSelectCurrency?.(item.currencyInfo.currency)}
        />
      )
    },
    [onSelectCurrency, chainFilter]
  )

  useEffect(() => {
    // when changing lists to show, resume at the top of the list
    if (sectionsRef.current.length > 0) {
      sectionListRef.current?.scrollToLocation({
        itemIndex: 0,
        sectionIndex: 0,
        animated: false,
      })
    }
  }, [variation, sectionsRef])

  if (loading) {
    return <Loading repeat={5} type="token" />
  }

  return (
    <Box>
      <SectionList
        ref={sectionListRef}
        ItemSeparatorComponent={() => <Separator mx="xs" />}
        ListEmptyComponent={
          <Flex>
            <SectionHeader title={t('Search results')} />
            <Text color="textTertiary" variant="subheadSmall">
              <Trans t={t}>
                No results found for <Text color="textPrimary">"{searchFilter}"</Text>
              </Trans>
            </Text>
          </Flex>
        }
        ListFooterComponent={Footer}
        keyExtractor={key}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always"
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => <SectionHeader title={title} />}
        sections={sections}
        showsVerticalScrollIndicator={false}
        windowSize={5}
      />
      <Box position="absolute" right={0}>
        <NetworkFilter selectedChain={chainFilter} onPressChain={onChangeChainFilter} />
      </Box>
    </Box>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Flex backgroundColor="background1" py="sm">
      <Text color="textSecondary" variant="subheadSmall">
        {title}
      </Text>
    </Flex>
  )
}

function Footer() {
  return (
    <Inset all="xxl">
      <Inset all="md" />
    </Inset>
  )
}

function key(item: TokenOption) {
  return item.currencyInfo.currencyId
}

export const TokenSearchResultList = memo(_TokenSearchResultList)
