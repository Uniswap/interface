import { GqlResult } from '@universe/api'
import { memo, useCallback, useMemo, useRef } from 'react'
import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
import { useFavoriteTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useFavoriteTokensOptions'
import { useHSKSubgraphPoolsForSelector } from 'uniswap/src/components/TokenSelector/hooks/useHSKSubgraphPoolsForSelector'
import { usePoolTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/usePoolTokensOptions'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
// import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { OnSelectCurrency, TokenSectionsHookProps } from 'uniswap/src/components/TokenSelector/types'
import { isSwapListLoading } from 'uniswap/src/components/TokenSelector/utils'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
// import { ClearRecentSearchesButton } from 'uniswap/src/features/search/ClearRecentSearchesButton'
import { isMobileApp } from 'utilities/src/platform'

// eslint-disable-next-line complexity
function useTokenSectionsForSwap({
  evmAddress,
  svmAddress,
  chainFilter,
  oppositeSelectedToken,
}: TokenSectionsHookProps): GqlResult<OnchainItemSection<TokenSelectorOption>[]> {
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()

  // Get pools from HSK Subgraph
  const {
    data: hskPools,
    isLoading: hskPoolsLoading,
    error: hskPoolsError,
    refetch: refetchPools,
  } = useHSKSubgraphPoolsForSelector(1000)

  // Extract tokens from pools (only for HashKey chains)
  // Always use HashKeyTestnet as default since Subgraph is for testnet
  // If chainFilter is HashKey or HashKeyTestnet, use it; otherwise default to HashKeyTestnet
  const poolChainId = useMemo(() => {
    if (chainFilter === UniverseChainId.HashKey || chainFilter === UniverseChainId.HashKeyTestnet) {
      return chainFilter
    }
    // Default to HashKeyTestnet since Subgraph is for testnet
    return UniverseChainId.HashKeyTestnet
  }, [chainFilter])
  
  const { tokenOptions: poolTokensOptions, loading: poolTokensLoading } = usePoolTokensOptions(
    hskPools,
    poolChainId,
  )

  // Other token options commented out - 其他代币选项已注释
  // const {
  //   data: portfolioTokenOptions,
  //   error: portfolioTokenOptionsError,
  //   refetch: refetchPortfolioTokenOptions,
  //   loading: portfolioTokenOptionsLoading,
  // } = usePortfolioTokenOptions({ evmAddress, svmAddress, chainFilter })

  // const {
  //   data: favoriteTokenOptions,
  //   error: favoriteTokenOptionsError,
  //   refetch: refetchFavoriteTokenOptions,
  //   loading: favoriteTokenOptionsLoading,
  // } = useFavoriteTokensOptions({ evmAddress, svmAddress, chainFilter })

  // const {
  //   data: commonTokenOptions,
  //   error: commonTokenOptionsError,
  //   refetch: refetchCommonTokenOptions,
  //   loading: commonTokenOptionsLoading,
  // } = useCommonTokensOptionsWithFallback({
  //   evmAddress,
  //   svmAddress,
  //   chainFilter: chainFilter ?? oppositeSelectedToken?.chainId ?? defaultChainId,
  // })

  // const {
  //   data: bridgingTokenOptions,
  //   error: bridgingTokenOptionsError,
  //   refetch: refetchBridgingTokenOptions,
  //   loading: bridgingTokenOptionsLoading,
  //   shouldNest: shouldNestBridgingTokens,
  // } = useBridgingTokensOptions({ oppositeSelectedToken, evmAddress, svmAddress, chainFilter })

  // Recent Searches - 已注释
  // const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter)

  // Pool tokens section - 使用新的 section name，格式和 recent searches 一样
  const poolTokensSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.PoolTokens, // 使用新的 PoolTokens section key
    options: poolTokensOptions,
  })

  // Recent Searches section - 已注释
  // const memoizedEndElement = useMemo(() => <ClearRecentSearchesButton />, [])
  // const recentSection = useOnchainItemListSection({
  //   sectionKey: OnchainItemSectionName.RecentSearches,
  //   options: recentlySearchedTokenOptions,
  //   endElement: memoizedEndElement,
  // })

  // Error and loading handling
  const error = hskPoolsError ? new Error(String(hskPoolsError)) : undefined
  const loading = hskPoolsLoading || poolTokensLoading

  const refetch = useCallback(() => {
    refetchPools()
  }, [refetchPools])

  // Other sections commented out - 其他部分已注释
  // const portfolioSection = useOnchainItemListSection({
  //   sectionKey: OnchainItemSectionName.YourTokens,
  //   options: portfolioTokenOptions,
  // })

  // const favoriteSection = useOnchainItemListSection({
  //   sectionKey: OnchainItemSectionName.FavoriteTokens,
  //   options: favoriteTokenOptions,
  // })

  // const bridgingSectionTokenOptions: TokenSelectorOption[] = useMemo(
  //   () => (shouldNestBridgingTokens ? [bridgingTokenOptions ?? []] : (bridgingTokenOptions ?? [])),
  //   [bridgingTokenOptions, shouldNestBridgingTokens],
  // )

  // const bridgingSection = useOnchainItemListSection({
  //   sectionKey: OnchainItemSectionName.BridgingTokens,
  //   options: bridgingSectionTokenOptions,
  // })

  const sections = useMemo(() => {
    // Only show pool tokens - 只显示 pools 中的 tokens
    // Format matches recent searches - 格式和 recent searches 一致
    if (isSwapListLoading({ loading, portfolioSection: undefined, isTestnetModeEnabled })) {
      return undefined
    }

    const result: OnchainItemSection<TokenSelectorOption>[] = []

    // Add pool tokens section if available
    if (poolTokensSection && poolTokensSection.length > 0) {
      result.push(...poolTokensSection)
    }

    // Recent searches section - 已注释
    // if (recentSection && recentSection.length > 0) {
    //   result.push(...recentSection)
    // }

    return result.length > 0 ? result : []
  }, [loading, poolTokensSection, isTestnetModeEnabled])

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch,
    }),
    [error, loading, refetch, sections],
  )
}

function _TokenSelectorSwapList({
  onSelectCurrency,
  evmAddress,
  svmAddress,
  chainFilter,
  oppositeSelectedToken,
  renderedInModal,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
  renderedInModal: boolean
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwap({
    evmAddress,
    svmAddress,
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
      renderedInModal={renderedInModal}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSwapList = memo(_TokenSelectorSwapList)
