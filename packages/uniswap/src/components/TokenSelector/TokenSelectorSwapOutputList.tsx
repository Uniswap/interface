import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isWeb } from 'ui/src'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  TokenSectionsForSwapOutput,
  TokenSelectorListSections,
} from 'uniswap/src/components/TokenSelector/types'
import { getTokenOptionsSection } from 'uniswap/src/components/TokenSelector/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { UniverseChainId } from 'uniswap/src/types/chains'

function useTokenSectionsForSwapOutput({
  activeAccountAddress,
  chainFilter,
  usePopularTokensOptionsHook,
  useFavoriteTokensOptionsHook,
  useCommonTokensOptionsHook,
}: TokenSectionsForSwapOutput): GqlResult<TokenSelectorListSections> {
  const { t } = useTranslation()

  const {
    data: popularTokenOptions,
    error: popularTokenOptionsError,
    refetch: refetchPopularTokenOptions,
    loading: popularTokenOptionsLoading,
    // if there is no chain filter then we show mainnet tokens
  } = usePopularTokensOptionsHook(activeAccountAddress, chainFilter ?? UniverseChainId.Mainnet)

  const {
    data: favoriteTokenOptions,
    error: favoriteTokenOptionsError,
    refetch: refetchFavoriteTokenOptions,
    loading: favoriteTokenOptionsLoading,
  } = useFavoriteTokensOptionsHook(activeAccountAddress, chainFilter)

  const {
    data: commonTokenOptions,
    error: commonTokenOptionsError,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
    // if there is no chain filter then we show mainnet tokens
  } = useCommonTokensOptionsHook(activeAccountAddress, chainFilter ?? UniverseChainId.Mainnet)

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
  onDismiss,
  onSelectCurrency,
  activeAccountAddress,
  chainFilter,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
  useTokenWarningDismissedHook,
  usePopularTokensOptionsHook,
  useFavoriteTokensOptionsHook,
  useCommonTokensOptionsHook,
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
