import { memo, useCallback, useMemo, useRef } from 'react'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
import { OnSelectCurrency, TokenSectionsHookProps } from 'uniswap/src/components/TokenSelector/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

function useTokenSectionsForSwap({
  activeAccountAddress,
  chainFilter,
  oppositeSelectedToken,
}: TokenSectionsHookProps): GqlResult<OnchainItemSection<TokenSelectorOption>[]> {
  const { defaultChainId } = useEnabledChains()

  const {
    data: commonTokenOptions,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
    // if there is no chain filter, first check if the input token has a chainId, fallback to defaultChainId
  } = useCommonTokensOptionsWithFallback(
    activeAccountAddress as `0x${string}` | undefined,
    chainFilter ?? oppositeSelectedToken?.chainId ?? defaultChainId,
  )

  const loading = !commonTokenOptions && commonTokenOptionsLoading

  const refetchAllRef = useRef<() => void>(() => {})

  refetchAllRef.current = (): void => {
    refetchCommonTokenOptions?.()
  }

  const refetch = useCallback(() => {
    refetchAllRef.current()
  }, [])

  // we draw the Suggested pills as a single item of a section list, so `data` is TokenOption[][]

  const suggestedSectionOptions = useMemo(() => [commonTokenOptions ?? []], [commonTokenOptions])
  const suggestedSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.SuggestedTokens,
    options: suggestedSectionOptions,
  })

  const sections = useMemo(() => {
    if (commonTokenOptionsLoading) {
      return undefined
    }

    return [...(suggestedSection ?? [])]
  }, [commonTokenOptionsLoading, suggestedSection])

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: undefined,
      refetch,
    }),
    [loading, refetch, sections],
  )
}

function _TokenSelectorSwapList({
  onSelectCurrency,
  activeAccountAddress,
  chainFilter,
  oppositeSelectedToken,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwap({
    activeAccountAddress,
    chainFilter,
    oppositeSelectedToken,
  })

  return (
    <TokenSelectorList
      showTokenAddress
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

export const TokenSelectorSwapList = memo(_TokenSelectorSwapList)
