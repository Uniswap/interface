import { Currency } from '@uniswap/sdk-core'
import React, { memo, ReactElement, useCallback, useEffect, useMemo, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { Box, Flex, Inset } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { filter } from 'src/components/TokenSelector/filter'
import { useAllCommonBaseCurrencies } from 'src/components/TokenSelector/hooks'
import { NetworkFilter } from 'src/components/TokenSelector/NetworkFilter'
import { TokenOptionItem } from 'src/components/TokenSelector/TokenOptionItem'
import { TokenSelectorVariation } from 'src/components/TokenSelector/TokenSelector'
import { TokenOption } from 'src/components/TokenSelector/types'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { sortPortfolioBalances, usePortfolioBalances } from 'src/features/dataApi/balances'
import { useSearchTokens } from 'src/features/dataApi/searchTokens'
import { usePopularTokens } from 'src/features/dataApi/topTokens'
import { CurrencyInfo, GqlResult, PortfolioBalance } from 'src/features/dataApi/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import {
  makeSelectAccountHideSmallBalances,
  makeSelectAccountHideSpamTokens,
} from 'src/features/wallet/selectors'
import { differenceWith } from 'src/utils/array'
import { CurrencyId } from 'src/utils/currencyId'
import { useDebounce } from 'src/utils/timing'

interface TokenSearchResultListProps {
  onChangeChainFilter: (newChainFilter: ChainId | null) => void
  onSelectCurrency: (currency: Currency) => void
  searchFilter: string | null
  chainFilter: ChainId | null
  variation: TokenSelectorVariation
}

const tokenOptionComparator = (
  tokenOption: TokenOption,
  otherTokenOption: TokenOption
): boolean => {
  return tokenOption.currencyInfo.currencyId === otherTokenOption.currencyInfo.currencyId
}
// get items in `currencies` that are not in `without`
// e.g. difference([B, C, D], [A, B, C]) would return ([D])
const difference = (currencies: TokenOption[], without: TokenOption[]): TokenOption[] => {
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
): GqlResult<TokenSection[]> {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()
  const hideSmallBalances = useAppSelector<boolean>(
    makeSelectAccountHideSmallBalances(activeAccount.address)
  )
  const hideSpamTokens = useAppSelector<boolean>(
    makeSelectAccountHideSpamTokens(activeAccount.address)
  )

  const {
    data: popularTokens,
    error: populateTokensError,
    refetch: refetchPopularTokens,
  } = usePopularTokens(chainFilter ?? ChainId.Mainnet)
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: refetchPortfolioBalances,
  } = usePortfolioBalances(
    activeAccount.address,
    /*shouldPoll=*/ false, // Home tab's TokenBalanceList will poll portfolio balances for activeAccount
    hideSmallBalances,
    hideSpamTokens
  )
  const {
    data: commonBaseCurrencies,
    error: commonBaseCurrenciesError,
    refetch: refetchCommonBaseCurrencies,
  } = useAllCommonBaseCurrencies()

  const portfolioBalances = useMemo(() => {
    if (!portfolioBalancesById) return

    const allPortfolioBalances: PortfolioBalance[] = sortPortfolioBalances(
      Object.values(portfolioBalancesById)
    )
    return allPortfolioBalances
  }, [portfolioBalancesById])

  const popularTokenOptions = useMemo(() => {
    if (!popularTokens) return

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
    if (!commonBaseCurrencies) return

    return commonBaseCurrencies.map((currencyInfo) => {
      return (
        portfolioBalancesById?.[currencyInfo.currencyId] ?? createEmptyBalanceOption(currencyInfo)
      )
    })
  }, [commonBaseCurrencies, portfolioBalancesById])

  // Only call search endpoint if searchFilter is non-null and TokenSelectorVariation includes tokens without balance
  const skipSearch = !searchFilter || variation === TokenSelectorVariation.BalancesOnly
  const {
    data: searchResultCurrencies,
    error: searchTokensError,
    refetch: refetchSearchTokens,
  } = useSearchTokens(searchFilter, chainFilter, skipSearch)
  const searchResults = useMemo(() => {
    if (!searchResultCurrencies) return

    return searchResultCurrencies.map((currencyInfo) => {
      return (
        portfolioBalancesById?.[currencyInfo.currencyId] ?? createEmptyBalanceOption(currencyInfo)
      )
    })
  }, [searchResultCurrencies, portfolioBalancesById])

  const sections = useMemo(() => {
    if (!portfolioBalances) return
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
          : EMPTY_ARRAY
      } else {
        if (!searchResults) return
        return searchResults.length > 0
          ? [
              {
                title: t('Search results'),
                data: searchResults,
              },
            ]
          : EMPTY_ARRAY
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

    if (!popularTokenOptions) return
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

    if (!commonBaseTokenOptions) return

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

  const refetchAll = useCallback(() => {
    refetchPopularTokens?.()
    refetchCommonBaseCurrencies?.()
    refetchPortfolioBalances?.()
    refetchSearchTokens?.()
  }, [
    refetchPopularTokens,
    refetchCommonBaseCurrencies,
    refetchPortfolioBalances,
    refetchSearchTokens,
  ])

  const loading =
    !portfolioBalances ||
    !popularTokenOptions ||
    !commonBaseTokenOptions ||
    (!skipSearch && !searchResults)

  const error =
    (!portfolioBalancesById && portfolioBalancesByIdError) ||
    (!popularTokens && populateTokensError) ||
    (!commonBaseCurrencies && commonBaseCurrenciesError) ||
    (!skipSearch && !searchResults && searchTokensError)

  return useMemo(
    () => ({ data: sections, loading, error: error || undefined, refetch: refetchAll }),
    [sections, loading, error, refetchAll]
  )
}

function _TokenSearchResultList({
  onChangeChainFilter,
  onSelectCurrency,
  chainFilter,
  searchFilter,
  variation,
}: TokenSearchResultListProps): ReactElement {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const sectionListRef = useRef<SectionList<TokenOption>>(null)

  const debouncedSearchFilter = useDebounce(searchFilter)
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsByVariation(variation, chainFilter, debouncedSearchFilter)

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
          onPress={(): void => onSelectCurrency?.(item.currencyInfo.currency)}
        />
      )
    },
    [onSelectCurrency, chainFilter]
  )

  useEffect(() => {
    // when changing lists to show, resume at the top of the list
    if (sectionsRef.current && sectionsRef.current.length > 0) {
      sectionListRef.current?.scrollToLocation({
        itemIndex: 0,
        sectionIndex: 0,
        animated: false,
      })
    }
  }, [variation, sectionsRef])

  if (error) {
    return (
      <Box justifyContent="center" pt="xxxl">
        <BaseCard.ErrorState
          icon={
            <AlertTriangle
              color={theme.colors.textTertiary}
              height={48}
              strokeWidth={1}
              width={55}
            />
          }
          retryButtonLabel="Retry"
          title={t("Couldn't load search results")}
          onRetry={(): void => refetch?.()}
        />
      </Box>
    )
  }

  if (loading) {
    return (
      <Box>
        <Box py="md" width={80}>
          <Loader.Box height={theme.textVariants.subheadSmall.lineHeight} />
        </Box>
        <Loader.Token repeat={5} />
      </Box>
    )
  }

  return (
    <Box>
      <SectionList
        ref={sectionListRef}
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
        renderSectionHeader={({ section: { title } }): ReactElement => (
          <SectionHeader title={title} />
        )}
        sections={sections ?? EMPTY_ARRAY}
        showsVerticalScrollIndicator={false}
        windowSize={5}
      />
      <Box position="absolute" right={0}>
        <NetworkFilter selectedChain={chainFilter} onPressChain={onChangeChainFilter} />
      </Box>
    </Box>
  )
}

function SectionHeader({ title }: { title: string }): ReactElement {
  return (
    <Flex backgroundColor="background1" py="md">
      <Text color="textSecondary" variant="subheadSmall">
        {title}
      </Text>
    </Flex>
  )
}

function Footer(): ReactElement {
  return (
    <Inset all="xxl">
      <Inset all="md" />
    </Inset>
  )
}

function key(item: TokenOption): CurrencyId {
  return item.currencyInfo.currencyId
}

export const TokenSearchResultList = memo(_TokenSearchResultList)
