import { memo, useCallback, useMemo } from 'react'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { filterRecentlySearchedTokenOptions } from 'uniswap/src/components/TokenSelector/hooks'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  TokenOptionSection,
  TokenSection,
  TokenSectionsForSwapInput,
  TokenSelectorListSections,
  TokenWarningDismissedHook,
} from 'uniswap/src/components/TokenSelector/types'
import { tokenOptionDifference, useTokenOptionsSection } from 'uniswap/src/components/TokenSelector/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { isExtension } from 'utilities/src/platform'

function useTokenSectionsForSwapInput({
  activeAccountAddress,
  chainFilter,
  searchHistory,
  valueModifiers,
  useFavoriteTokensOptionsHook,
  usePopularTokensOptionsHook,
  usePortfolioTokenOptionsHook,
}: TokenSectionsForSwapInput): GqlResult<TokenSelectorListSections> {
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

  const recentlySearchedTokenOptions = filterRecentlySearchedTokenOptions(chainFilter, searchHistory)

  const error =
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!popularTokenOptions && popularTokenOptionsError) ||
    (!favoriteTokenOptions && favoriteTokenOptionsError)

  const loading = portfolioTokenOptionsLoading || popularTokenOptionsLoading || favoriteTokenOptionsLoading

  const refetchAll = useCallback(() => {
    refetchPortfolioTokenOptions?.()
    refetchPopularTokenOptions?.()
    refetchFavoriteTokenOptions?.()
  }, [refetchPopularTokenOptions, refetchPortfolioTokenOptions, refetchFavoriteTokenOptions])

  const portfolioSection = useTokenOptionsSection(TokenOptionSection.YourTokens, portfolioTokenOptions)
  const recentSection = useTokenOptionsSection(TokenOptionSection.RecentTokens, recentlySearchedTokenOptions)
  const favoriteSection = useTokenOptionsSection(TokenOptionSection.FavoriteTokens, favoriteTokenOptions)
  const popularMinusPortfolioTokens = tokenOptionDifference(popularTokenOptions, portfolioTokenOptions)
  const popularSection = useTokenOptionsSection(TokenOptionSection.PopularTokens, popularMinusPortfolioTokens)

  const sections = useMemo(() => {
    if (loading && (!portfolioSection || !popularSection)) {
      return
    }

    return [
      ...(portfolioSection ?? []),
      ...(recentSection ?? []),
      // TODO(WEB-3061): Favorited wallets/tokens
      // Extension does not support favoriting but has a default list, so we can't rely on empty array check
      ...(isExtension ? [] : favoriteSection ?? []),
      ...(popularSection ?? []),
    ] satisfies TokenSection[]
  }, [favoriteSection, loading, popularSection, portfolioSection, recentSection])

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

function _TokenSelectorSwapInputList({
  onDismiss,
  onSelectCurrency,
  activeAccountAddress,
  chainFilter,
  searchHistory,
  valueModifiers,
  isKeyboardOpen,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
  useFavoriteTokensOptionsHook,
  usePortfolioTokenOptionsHook,
  usePopularTokensOptionsHook,
  useTokenWarningDismissedHook,
}: TokenSectionsForSwapInput & {
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  onDismiss: () => void
  onSelectCurrency: OnSelectCurrency
  useTokenWarningDismissedHook: TokenWarningDismissedHook
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwapInput({
    activeAccountAddress,
    chainFilter,
    valueModifiers,
    searchHistory,
    useFavoriteTokensOptionsHook,
    usePortfolioTokenOptionsHook,
    usePopularTokensOptionsHook,
  })

  return (
    <TokenSelectorList
      chainFilter={chainFilter}
      convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
      formatNumberOrStringCallback={formatNumberOrStringCallback}
      hasError={Boolean(error)}
      isKeyboardOpen={isKeyboardOpen}
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

export const TokenSelectorSwapInputList = memo(_TokenSelectorSwapInputList)
