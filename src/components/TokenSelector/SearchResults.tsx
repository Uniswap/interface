import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList, StyleSheet } from 'react-native'
import { Separator } from 'src/components/layout/Separator'
import { filter } from 'src/components/TokenSelector/filter'
import { useCommonBases, useFavoriteCurrencies } from 'src/components/TokenSelector/hooks'
import { NetworkFilter } from 'src/components/TokenSelector/NetworkFilter'
import { TokenOptionItem } from 'src/components/TokenSelector/TokenOptionItem'
import { TokenOption } from 'src/components/TokenSelector/types'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { usePortfolioBalances } from 'src/features/dataApi/balances'
import { usePopularTokens } from 'src/features/dataApi/topTokens'
import { ElementName } from 'src/features/telemetry/constants'
import { useCombinedTokenWarningLevelMap } from 'src/features/tokens/useTokenWarningLevel'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { differenceWith } from 'src/utils/array'
import { currencyId } from 'src/utils/currencyId'
import { useDebounce } from 'src/utils/timing'
import { TextButton } from '../buttons/TextButton'
import { Box, Flex, Inset } from '../layout'
import { Text } from '../Text'

export enum TokenSelectorVariation {
  // used for Send flow, only show currencies with a balance
  BalancesOnly = 'balances-only',

  // used for Swap input. tokens with balances + popular
  BalancesAndPopular = 'balances-and-popular',

  // used for Swap output. tokens with balances, favorites, common + popular
  SuggestedAndPopular = 'suggested-and-popular',
}

interface TokenSearchResultListProps {
  onChangeChainFilter: (newChainFilter: ChainId | null) => void
  onClearSearchFilter: () => void
  onSelectCurrency: (currency: Currency) => void
  searchFilter: string | null
  chainFilter: ChainId | null
  variation: TokenSelectorVariation
}

const tokenOptionComparator = (currency: TokenOption, otherCurrency: TokenOption) => {
  return currencyId(currency.currency) === currencyId(otherCurrency.currency)
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

const createEmptyBalanceOption = (currency: Currency): TokenOption => ({
  currency,
  balanceUSD: null,
  quantity: null,
})

// TODO: alphabetically sort each of these token sections
export function useTokenSectionsByVariation(
  variation: TokenSelectorVariation,
  chainFilter: ChainId | null
): TokenSection[] {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()
  const popularTokens = usePopularTokens()
  const portfolioBalancesById = usePortfolioBalances(activeAccount.address, false)
  const portfolioBalances = useMemo(
    () =>
      !portfolioBalancesById
        ? EMPTY_ARRAY
        : Object.values(portfolioBalancesById).sort((a, b) => b.balanceUSD - a.balanceUSD),
    [portfolioBalancesById]
  )
  const favoriteCurrencies = useFavoriteCurrencies()
  const commonBaseCurrencies = useCommonBases(chainFilter)

  const popularWithoutBalances = useMemo(() => {
    return popularTokens
      .sort((a, b) => {
        if (a.name && b.name) {
          return a.name.localeCompare(b.name)
        }
        return 0
      })
      .map(createEmptyBalanceOption)
  }, [popularTokens])

  const favoritesWithoutBalances = useMemo(() => {
    return favoriteCurrencies.map(createEmptyBalanceOption)
  }, [favoriteCurrencies])

  const commonBases = useMemo(() => {
    return commonBaseCurrencies.map((currency) => {
      const id = currencyId(currency)
      return portfolioBalancesById?.[id] ?? createEmptyBalanceOption(currency)
    })
  }, [commonBaseCurrencies, portfolioBalancesById])

  return useMemo(() => {
    if (variation === TokenSelectorVariation.BalancesOnly) {
      return [{ title: t('Your tokens'), data: portfolioBalances }]
    }

    if (variation === TokenSelectorVariation.BalancesAndPopular) {
      const popularMinusBalances = difference(popularWithoutBalances, portfolioBalances)
      return [
        {
          title: t('Your tokens'),
          data: portfolioBalances,
        },
        {
          title: t('Popular tokens'),
          data: popularMinusBalances,
        },
      ]
    }

    const balancesAndFavorites = [
      ...commonBases,
      ...difference(portfolioBalances, commonBases),
      ...difference(favoritesWithoutBalances, portfolioBalances),
    ]
    return [
      {
        title: t('Suggested'),
        data: balancesAndFavorites,
      },
      {
        title: t('Popular tokens'),
        data: difference(popularWithoutBalances, balancesAndFavorites),
      },
    ]
  }, [
    commonBases,
    popularWithoutBalances,
    portfolioBalances,
    favoritesWithoutBalances,
    t,
    variation,
  ])
}

export function TokenSearchResultList({
  onChangeChainFilter,
  onClearSearchFilter,
  onSelectCurrency,
  chainFilter,
  searchFilter,
  variation,
}: TokenSearchResultListProps) {
  const { t } = useTranslation()
  const sectionListRef = useRef<SectionList<Fuse.FuseResult<TokenOption>>>(null)

  const sections = useTokenSectionsByVariation(variation, chainFilter)
  const debouncedSearchFilter = useDebounce(searchFilter)

  const filteredSections = useMemo(() => {
    return sections.map(({ title, data }) => ({
      title,
      data: filter(data, chainFilter, debouncedSearchFilter),
    }))
  }, [chainFilter, debouncedSearchFilter, sections])

  const tokenWarningLevelMap = useCombinedTokenWarningLevelMap()

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Fuse.FuseResult<TokenOption>>) => {
      const tokenOption = item.item
      return (
        <TokenOptionItem
          matches={item.matches}
          option={tokenOption}
          tokenWarningLevelMap={tokenWarningLevelMap}
          onPress={() => onSelectCurrency?.(tokenOption.currency)}
        />
      )
    },
    [onSelectCurrency, tokenWarningLevelMap]
  )

  useEffect(() => {
    // when changing lists to show, resume at the top of the list
    sectionListRef.current?.scrollToLocation({
      itemIndex: 0,
      sectionIndex: 0,
      animated: false,
    })
  }, [variation])

  return (
    <Box>
      <SectionList
        ref={sectionListRef}
        ItemSeparatorComponent={() => <Separator mx="xs" />}
        ListEmptyComponent={
          <Flex centered gap="sm" px="lg">
            <Text variant="mediumLabel">😔</Text>
            <Text color="textTertiary" textAlign="center" variant="mediumLabel">
              {searchFilter
                ? t('No tokens found for ”{{searchFilter}}”', { searchFilter })
                : t('No tokens found')}
            </Text>
            <TextButton
              name={ElementName.ClearSearch}
              textColor="accentActive"
              onPress={onClearSearchFilter}>
              {t('Clear search')}
            </TextButton>
          </Flex>
        }
        ListFooterComponent={Footer}
        keyExtractor={key}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => <SectionHeader title={title} />}
        sections={filteredSections}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        windowSize={1}
      />
      <Box position="absolute" right={0}>
        <NetworkFilter selectedChain={chainFilter} onPressChain={onChangeChainFilter} />
      </Box>
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

function key(item: Fuse.FuseResult<TokenOption>) {
  return currencyId(item.item.currency)
}

const styles = StyleSheet.create({
  list: {
    height: '100%',
    width: '100%',
  },
})
