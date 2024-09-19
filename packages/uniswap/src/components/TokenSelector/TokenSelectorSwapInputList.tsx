import { memo, useCallback, useMemo } from 'react'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import {
  useCommonTokensOptionsWithFallback,
  useFavoriteTokensOptions,
  usePopularTokensOptions,
  usePortfolioTokenOptions,
  useRecentlySearchedTokens,
} from 'uniswap/src/components/TokenSelector/hooks'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  TokenOptionSection,
  TokenSection,
  TokenSectionsHookProps,
} from 'uniswap/src/components/TokenSelector/types'
import {
  isSwapListLoading,
  tokenOptionDifference,
  useTokenOptionsSection,
} from 'uniswap/src/components/TokenSelector/utils'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { GqlResult } from 'uniswap/src/data/types'
// eslint-disable-next-line no-restricted-imports
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { isMobileApp } from 'utilities/src/platform'

function useTokenSectionsForSwapInput({
  activeAccountAddress,
  chainFilter,
}: TokenSectionsHookProps): GqlResult<TokenSection[]> {
  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions(activeAccountAddress, chainFilter)

  const {
    data: popularTokenOptions,
    error: popularTokenOptionsError,
    refetch: refetchPopularTokenOptions,
    loading: popularTokenOptionsLoading,
    // if there is no chain filter then we show mainnet tokens
  } = usePopularTokensOptions(activeAccountAddress, chainFilter ?? UniverseChainId.Mainnet)

  const {
    data: favoriteTokenOptions,
    error: favoriteTokenOptionsError,
    refetch: refetchFavoriteTokenOptions,
    loading: favoriteTokenOptionsLoading,
  } = useFavoriteTokensOptions(activeAccountAddress, chainFilter)

  const { data: commonTokenOptions } = useCommonTokensOptionsWithFallback(
    activeAccountAddress,
    chainFilter ?? UniverseChainId.Mainnet,
  )

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter)

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

  const isTestnet = chainFilter ? UNIVERSE_CHAIN_INFO[chainFilter].testnet : false

  const suggestedSection = useTokenOptionsSection(TokenOptionSection.SuggestedTokens, [
    (isTestnet ? commonTokenOptions : []) ?? [],
  ])
  const portfolioSection = useTokenOptionsSection(TokenOptionSection.YourTokens, portfolioTokenOptions)
  const recentSection = useTokenOptionsSection(TokenOptionSection.RecentTokens, recentlySearchedTokenOptions)
  const favoriteSection = useTokenOptionsSection(TokenOptionSection.FavoriteTokens, favoriteTokenOptions)
  const popularMinusPortfolioTokens = tokenOptionDifference(popularTokenOptions, portfolioTokenOptions)
  const popularSection = useTokenOptionsSection(TokenOptionSection.PopularTokens, popularMinusPortfolioTokens)

  const sections = useMemo(() => {
    if (isSwapListLoading(loading, portfolioSection, popularSection)) {
      return
    }

    return [
      ...(suggestedSection ?? []),
      ...(portfolioSection ?? []),
      ...(recentSection ?? []),
      // TODO(WEB-3061): Favorited wallets/tokens
      // Extension & interface do not support favoriting but has a default list, so we can't rely on empty array check
      ...(isMobileApp ? favoriteSection ?? [] : []),
      ...(popularSection ?? []),
    ] satisfies TokenSection[]
  }, [suggestedSection, favoriteSection, loading, popularSection, portfolioSection, recentSection])

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
  onSelectCurrency,
  activeAccountAddress,
  chainFilter,
  isKeyboardOpen,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
}: TokenSectionsHookProps & {
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwapInput({
    activeAccountAddress,
    chainFilter,
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
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSwapInputList = memo(_TokenSelectorSwapInputList)
