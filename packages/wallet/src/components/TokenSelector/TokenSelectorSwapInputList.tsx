import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { OnSelectCurrency, TokenSection, TokenSelectorListSections } from 'uniswap/src/components/TokenSelector/types'
import { getTokenOptionsSection, tokenOptionDifference } from 'uniswap/src/components/TokenSelector/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { TokenSelectorList } from 'wallet/src/components/TokenSelector/TokenSelectorList'
import { usePopularTokensOptions, usePortfolioTokenOptions } from 'wallet/src/components/TokenSelector/hooks'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

function useTokenSectionsForSwapInput(chainFilter: UniverseChainId | null): GqlResult<TokenSelectorListSections> {
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

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
  onSelectCurrency,
  chainFilter,
}: {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
}): JSX.Element {
  const { data: sections, loading, error, refetch } = useTokenSectionsForSwapInput(chainFilter)
  return (
    <TokenSelectorList
      chainFilter={chainFilter}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSwapInputList = memo(_TokenSelectorSwapInputList)
