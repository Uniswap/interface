import { Currency } from '@uniswap/sdk-core'
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { AnimatedBox, Box, Flex, Inset } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { filter } from 'src/components/TokenSelector/filter'
import {
  useAllCommonBaseCurrencies,
  useFavoriteCurrencies,
} from 'src/components/TokenSelector/hooks'
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
import { useCombinedTokenWarningLevelMap } from 'src/features/tokens/useTokenWarningLevel'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { selectHideSmallBalances } from 'src/features/wallet/selectors'
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
): TokenSection[] {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()
  const hideSmallBalances = useAppSelector(selectHideSmallBalances)

  const popularTokens = usePopularTokens()
  const portfolioBalancesById = usePortfolioBalances(activeAccount.address)

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

  const favoriteCurrencies = useFavoriteCurrencies()
  const commonBaseCurrencies = useAllCommonBaseCurrencies()

  const popularWithoutBalances = useMemo(() => {
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

  const favoritesWithoutBalances = useMemo(() => {
    return favoriteCurrencies.map((currencyInfo) => {
      return (
        portfolioBalancesById?.[currencyInfo.currencyId] ?? createEmptyBalanceOption(currencyInfo)
      )
    })
  }, [favoriteCurrencies, portfolioBalancesById])

  const commonBases = useMemo(() => {
    return commonBaseCurrencies.map((currencyInfo) => {
      return (
        portfolioBalancesById?.[currencyInfo.currencyId] ?? createEmptyBalanceOption(currencyInfo)
      )
    })
  }, [commonBaseCurrencies, portfolioBalancesById])

  // Only call search endpoint if searchFilter is non-null and TokenSelectorVariation includes tokens without balance
  const skipSearch = !searchFilter || variation === TokenSelectorVariation.BalancesOnly
  const searchResultCurrencies = useSearchTokens(searchFilter, chainFilter, skipSearch)
  const searchResults = useMemo(() => {
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
      const popularMinusBalances = difference(popularWithoutBalances, portfolioBalances)
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

    const balancesAndFavorites = [
      ...commonBases,
      ...difference(portfolioBalances, commonBases),
      ...difference(favoritesWithoutBalances, [...portfolioBalances, ...commonBases]),
    ]
    return [
      {
        title: t('Suggested'),
        data: filter(balancesAndFavorites, chainFilter),
      },
      {
        title: t('Popular tokens'),
        data: filter(difference(popularWithoutBalances, balancesAndFavorites), chainFilter),
      },
    ]
  }, [
    commonBases,
    popularWithoutBalances,
    portfolioBalances,
    favoritesWithoutBalances,
    searchResults,
    t,
    variation,
    chainFilter,
    searchFilter,
  ])

  return sections
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
  const sections = useTokenSectionsByVariation(variation, chainFilter, debouncedSearchFilter)

  const tokenWarningLevelMap = useCombinedTokenWarningLevelMap()

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TokenOption>) => {
      return (
        <TokenOptionItem
          option={item}
          showNetworkPill={!chainFilter && item.currencyInfo.currency.chainId !== ChainId.Mainnet}
          tokenWarningLevelMap={tokenWarningLevelMap}
          onPress={() => onSelectCurrency?.(item.currencyInfo.currency)}
        />
      )
    },
    [onSelectCurrency, tokenWarningLevelMap, chainFilter]
  )

  useEffect(() => {
    // when changing lists to show, resume at the top of the list
    if (sections.length > 0) {
      sectionListRef.current?.scrollToLocation({
        itemIndex: 0,
        sectionIndex: 0,
        animated: false,
      })
    }
  }, [variation, sections])

  return (
    <Box>
      <SectionList
        ref={sectionListRef}
        ItemSeparatorComponent={() => <Separator mx="xs" />}
        ListEmptyComponent={
          <Flex my="xs">
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
      {sections.length > 0 && (
        <AnimatedBox position="absolute" right={0}>
          <NetworkFilter selectedChain={chainFilter} onPressChain={onChangeChainFilter} />
        </AnimatedBox>
      )}
    </Box>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Flex backgroundColor="backgroundSurface" py="sm">
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
