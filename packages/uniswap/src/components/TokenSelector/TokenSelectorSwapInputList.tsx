import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  TokenSection,
  TokenSectionsForSwapInput,
  TokenSelectorListSections,
  TokenWarningDismissedHook,
} from 'uniswap/src/components/TokenSelector/types'
import { getTokenOptionsSection, tokenOptionDifference } from 'uniswap/src/components/TokenSelector/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { UniverseChainId } from 'uniswap/src/types/chains'

function useTokenSectionsForSwapInput({
  activeAccountAddress,
  chainFilter,
  usePortfolioTokenOptionsHook,
  usePopularTokensOptionsHook,
}: TokenSectionsForSwapInput): GqlResult<TokenSelectorListSections> {
  const { t } = useTranslation()

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptionsHook(activeAccountAddress, chainFilter)

  const {
    data: popularTokenOptions,
    error: popularTokenOptionsError,
    refetch: refetchPopularTokenOptions,
    loading: popularTokenOptionsLoading,
    // if there is no chain filter then we show mainnet tokens
  } = usePopularTokensOptionsHook(activeAccountAddress, chainFilter ?? UniverseChainId.Mainnet)

  const error =
    (!portfolioTokenOptions && portfolioTokenOptionsError) || (!popularTokenOptions && popularTokenOptionsError)

  const loading = portfolioTokenOptionsLoading || popularTokenOptionsLoading

  const refetchAll = useCallback(() => {
    refetchPortfolioTokenOptions?.()
    refetchPopularTokenOptions?.()
  }, [refetchPopularTokenOptions, refetchPortfolioTokenOptions])

  const sections = useMemo(() => {
    if (loading) {
      return
    }

    const popularMinusPortfolioTokens = tokenOptionDifference(popularTokenOptions, portfolioTokenOptions)

    return [
      ...(getTokenOptionsSection(t('tokens.selector.section.yours'), portfolioTokenOptions) ?? []),
      ...(getTokenOptionsSection(t('tokens.selector.section.popular'), popularMinusPortfolioTokens) ?? []),
    ] satisfies TokenSection[]
  }, [loading, popularTokenOptions, portfolioTokenOptions, t])

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
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
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
    usePortfolioTokenOptionsHook,
    usePopularTokensOptionsHook,
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

export const TokenSelectorSwapInputList = memo(_TokenSelectorSwapInputList)
