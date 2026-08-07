import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { OnSelectCurrency, OnSelectRwaToken, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { getSuggestedTilesMaxCount } from 'uniswap/src/components/TokenSelectorV2/constants'
import { useTokenSectionsForSwapV2 } from 'uniswap/src/components/TokenSelectorV2/hooks/useTokenSectionsForSwapV2'
import { TokenSelectorV2List } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2List'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function SwapListV2({
  variation,
  chainFilter,
  chainIds,
  oppositeSelectedToken,
  includeYourTokens,
  portfolioData,
  renderedInModal,
  onSelectCurrency,
  onSelectRwaToken,
}: {
  variation: TokenSelectorVariation
  chainFilter: UniverseChainId | null
  chainIds: UniverseChainId[]
  oppositeSelectedToken: TradeableAsset | undefined
  includeYourTokens: boolean
  portfolioData: PortfolioBalancesResult
  renderedInModal: boolean
  onSelectCurrency: OnSelectCurrency
  onSelectRwaToken?: OnSelectRwaToken
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwapV2({
    chainFilter,
    chainIds,
    oppositeSelectedToken,
    variation,
    includeYourTokens,
    portfolioData,
  })

  return (
    <TokenSelectorV2List
      showTokenAddress
      chainFilter={chainFilter}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      renderedInModal={renderedInModal}
      suggestedTilesMaxCount={getSuggestedTilesMaxCount(variation)}
      onSelectCurrency={onSelectCurrency}
      onSelectRwaToken={onSelectRwaToken}
    />
  )
}
