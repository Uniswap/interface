import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isWeb } from 'ui/src'
import { OnSelectCurrency, TokenSelectorListSections } from 'uniswap/src/components/TokenSelector/types'
import { getTokenOptionsSection } from 'uniswap/src/components/TokenSelector/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { TokenSelectorList } from 'wallet/src/components/TokenSelector/TokenSelectorList'
import {
  useCommonTokensOptions,
  useFavoriteTokensOptions,
  usePopularTokensOptions,
} from 'wallet/src/components/TokenSelector/hooks'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

function useTokenSectionsForSwapOutput(chainFilter: UniverseChainId | null): GqlResult<TokenSelectorListSections> {
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

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

  const {
    data: commonTokenOptions,
    error: commonTokenOptionsError,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
    // if there is no chain filter then we show mainnet tokens
  } = useCommonTokensOptions(activeAccountAddress, chainFilter ?? UniverseChainId.Mainnet)

  const error =
    (!popularTokenOptions && popularTokenOptionsError) ||
    (!favoriteTokenOptions && favoriteTokenOptionsError) ||
    (!commonTokenOptions && commonTokenOptionsError)

  const loading = popularTokenOptionsLoading || favoriteTokenOptionsLoading || commonTokenOptionsLoading

  const refetchAll = useCallback(() => {
    refetchPopularTokenOptions?.()
    refetchFavoriteTokenOptions?.()
    refetchCommonTokenOptions?.()
  }, [refetchCommonTokenOptions, refetchFavoriteTokenOptions, refetchPopularTokenOptions])

  const sections = useMemo<TokenSelectorListSections>(() => {
    if (loading) {
      return []
    }

    return [
      // we draw the pills as a single item of a section list, so `data` is an array of Token[]
      { title: t('tokens.selector.section.suggested'), data: [commonTokenOptions ?? []] },
      // TODO temporarily hiding favorites from extension until we add favorites functionality
      ...(isWeb ? [] : getTokenOptionsSection(t('tokens.selector.section.favorite'), favoriteTokenOptions) ?? []),
      ...(getTokenOptionsSection(t('tokens.selector.section.popular'), popularTokenOptions) ?? []),
    ]
  }, [commonTokenOptions, favoriteTokenOptions, loading, popularTokenOptions, t])

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
  onSelectCurrency,
  chainFilter,
}: {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
}): JSX.Element {
  const { data: sections, loading, error, refetch } = useTokenSectionsForSwapOutput(chainFilter)

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

export const TokenSelectorSwapOutputList = memo(_TokenSelectorSwapOutputList)
