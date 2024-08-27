import { memo, useCallback, useMemo } from 'react'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { filterRecentlySearchedTokenOptions } from 'uniswap/src/components/TokenSelector/hooks'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  TokenOptionSection,
  TokenSectionsForSwapOutput,
  TokenSelectorListSections,
} from 'uniswap/src/components/TokenSelector/types'
import { useTokenOptionsSection } from 'uniswap/src/components/TokenSelector/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { isExtension } from 'utilities/src/platform'

function useTokenSectionsForSwapOutput({
  activeAccountAddress,
  chainFilter,
  searchHistory,
  valueModifiers,
  usePortfolioTokenOptionsHook,
  usePopularTokensOptionsHook,
  useFavoriteTokensOptionsHook,
  useCommonTokensOptionsHook,
}: TokenSectionsForSwapOutput): GqlResult<TokenSelectorListSections> {
  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptionsHook(activeAccountAddress, chainFilter, valueModifiers)

  const {
    data: popularTokenOptions,
    error: popularTokenOptionsError,
    refetch: refetchPopularTokenOptions,
    loading: popularTokenOptionsLoading,
    // if there is no chain filter then we show mainnet tokens
  } = usePopularTokensOptionsHook(activeAccountAddress, chainFilter ?? UniverseChainId.Mainnet, valueModifiers)

  const {
    data: favoriteTokenOptions,
    error: favoriteTokenOptionsError,
    refetch: refetchFavoriteTokenOptions,
    loading: favoriteTokenOptionsLoading,
  } = useFavoriteTokensOptionsHook(activeAccountAddress, chainFilter, valueModifiers)

  const {
    data: commonTokenOptions,
    error: commonTokenOptionsError,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
    // if there is no chain filter then we show mainnet tokens
  } = useCommonTokensOptionsHook(activeAccountAddress, chainFilter ?? UniverseChainId.Mainnet, valueModifiers)

  const recentlySearchedTokenOptions = filterRecentlySearchedTokenOptions(chainFilter, searchHistory)

  const error =
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!popularTokenOptions && popularTokenOptionsError) ||
    (!favoriteTokenOptions && favoriteTokenOptionsError) ||
    (!commonTokenOptions && commonTokenOptionsError)

  const loading =
    portfolioTokenOptionsLoading ||
    popularTokenOptionsLoading ||
    favoriteTokenOptionsLoading ||
    commonTokenOptionsLoading

  const refetchAll = useCallback(() => {
    refetchPortfolioTokenOptions?.()
    refetchPopularTokenOptions?.()
    refetchFavoriteTokenOptions?.()
    refetchCommonTokenOptions?.()
  }, [refetchCommonTokenOptions, refetchFavoriteTokenOptions, refetchPopularTokenOptions, refetchPortfolioTokenOptions])

  // we draw the Suggested pills as a single item of a section list, so `data` is TokenOption[][]
  const suggestedSection = useTokenOptionsSection(TokenOptionSection.SuggestedTokens, [commonTokenOptions ?? []])
  const portfolioSection = useTokenOptionsSection(TokenOptionSection.YourTokens, portfolioTokenOptions)
  const recentSection = useTokenOptionsSection(TokenOptionSection.RecentTokens, recentlySearchedTokenOptions)
  const favoriteSection = useTokenOptionsSection(TokenOptionSection.FavoriteTokens, favoriteTokenOptions)
  const popularSection = useTokenOptionsSection(TokenOptionSection.PopularTokens, popularTokenOptions)

  const sections = useMemo<TokenSelectorListSections>(() => {
    if (loading) {
      return []
    }

    return [
      ...(suggestedSection ?? []),
      ...(portfolioSection ?? []),
      ...(recentSection ?? []),
      // TODO(WEB-3061): Favorited wallets/tokens
      // Extension does not support favoriting but has a default list, so we can't rely on empty array check
      ...(isExtension ? [] : favoriteSection ?? []),
      ...(popularSection ?? []),
    ]
  }, [favoriteSection, loading, popularSection, portfolioSection, recentSection, suggestedSection])

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch: refetchAll,
    }),
    [error, loading, refetchAll, sections],
  )
}

function _TokenSelectorSwapOutputList({
  onDismiss,
  onSelectCurrency,
  activeAccountAddress,
  chainFilter,
  searchHistory,
  valueModifiers,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
  useCommonTokensOptionsHook,
  useFavoriteTokensOptionsHook,
  usePopularTokensOptionsHook,
  usePortfolioTokenOptionsHook,
  useTokenWarningDismissedHook,
}: TokenSectionsForSwapOutput & {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  useTokenWarningDismissedHook: (currencyId: Maybe<string>) => {
    tokenWarningDismissed: boolean
    dismissWarningCallback: () => void
  }
  onDismiss: () => void
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwapOutput({
    activeAccountAddress,
    chainFilter,
    searchHistory,
    valueModifiers,
    usePortfolioTokenOptionsHook,
    usePopularTokensOptionsHook,
    useFavoriteTokensOptionsHook,
    useCommonTokensOptionsHook,
  })

  return (
    <TokenSelectorList
      chainFilter={chainFilter}
      convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
      formatNumberOrStringCallback={formatNumberOrStringCallback}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      useTokenWarningDismissedHook={useTokenWarningDismissedHook}
      onDismiss={onDismiss}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSwapOutputList = memo(_TokenSelectorSwapOutputList)
