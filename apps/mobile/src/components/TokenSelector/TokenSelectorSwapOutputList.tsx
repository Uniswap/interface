import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useCommonTokensOptions,
  useFavoriteTokensOptions,
  usePopularTokensOptions,
} from 'src/components/TokenSelector/hooks'
import { TokenSelectorList } from 'src/components/TokenSelector/TokenSelectorList'
import { OnSelectCurrency, TokenSelectorListSections } from 'src/components/TokenSelector/types'
import { getTokenOptionsSection } from 'src/components/TokenSelector/utils'
import { ChainId } from 'wallet/src/constants/chains'
import { GqlResult } from 'wallet/src/features/dataApi/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

function useTokenSectionsForSwapOutput(
  chainFilter: ChainId | null
): GqlResult<TokenSelectorListSections> {
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const {
    data: popularTokenOptions,
    error: popularTokenOptionsError,
    refetch: refetchPopularTokenOptions,
    loading: popularTokenOptionsLoading,
    // if there is no chain filter then we show mainnet tokens
  } = usePopularTokensOptions(activeAccountAddress, chainFilter ?? ChainId.Mainnet)

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
  } = useCommonTokensOptions(activeAccountAddress, chainFilter ?? ChainId.Mainnet)

  const error =
    (!popularTokenOptions && popularTokenOptionsError) ||
    (!favoriteTokenOptions && favoriteTokenOptionsError) ||
    (!commonTokenOptions && commonTokenOptionsError)

  const loading =
    popularTokenOptionsLoading || favoriteTokenOptionsLoading || commonTokenOptionsLoading

  const refetchAll = useCallback(() => {
    refetchPopularTokenOptions?.()
    refetchFavoriteTokenOptions?.()
    refetchCommonTokenOptions?.()
  }, [refetchCommonTokenOptions, refetchFavoriteTokenOptions, refetchPopularTokenOptions])

  const sections = useMemo<TokenSelectorListSections>(() => {
    if (loading) return []

    return [
      // we draw the pills as a single item of a section list, so `data` is an array of Token[]
      { title: t('Suggested'), data: [commonTokenOptions ?? []] },
      ...(getTokenOptionsSection(t('Favorites'), favoriteTokenOptions) ?? []),
      ...(getTokenOptionsSection(t('Popular tokens'), popularTokenOptions) ?? []),
    ]
  }, [commonTokenOptions, favoriteTokenOptions, loading, popularTokenOptions, t])

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch: refetchAll,
    }),
    [error, loading, refetchAll, sections]
  )
}

function _TokenSelectorSwapOutputList({
  onSelectCurrency,
  chainFilter,
}: {
  onSelectCurrency: OnSelectCurrency
  chainFilter: ChainId | null
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
