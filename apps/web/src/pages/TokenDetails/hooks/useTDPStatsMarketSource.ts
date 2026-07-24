import { useMemo } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import {
  adaptLegacyMarketData,
  adaptLegacyProjectMarketData,
} from 'uniswap/src/features/dataApi/tokenDetails/legacyMarketDataAdapters'
import type { TokenMarketStatsAggregatedInput } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import type { TokenQueryData } from '~/appGraphql/data/Token'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useTDPMultichainAggregate } from '~/pages/TokenDetails/hooks/useTDPMultichainAggregate'

type TokenQuery = NonNullable<TokenQueryData>

type TDPFilteredDeploymentMarket = NonNullable<
  NonNullable<NonNullable<TokenQuery['project']>['tokens']>[number]['market']
>

interface UseTDPStatsMarketSourceResult {
  showAggregatedStats: boolean
  /** True only for a genuinely multichain asset with no specific chain selected (the "all networks" view). */
  isMultichainAggregateView: boolean
  filteredDeploymentMarket: TDPFilteredDeploymentMarket | undefined
  networkFilterName: string
  /**
   * TokenWeb `market` + `project` for `useTokenMarketStats`. Undefined when unavailable (e.g. no token query yet).
   * If the user picks a filtered chain that has no `project.tokens` row, this stays undefined on purpose: stats fall
   * back to `useTokenMarketStats`’s own fetch path, and TVL may show blank until data exists. See unit test
   * “does not set market stats input when selection has no matching project token row”.
   */
  marketStatsInput: TokenMarketStatsAggregatedInput | undefined
}

function getTDPFilteredDeploymentMarket(ctx: {
  isMultiChainAsset: boolean
  selectedMultichainChainId: UniverseChainId | undefined
  tokens: NonNullable<TokenQuery['project']>['tokens'] | undefined
}): TDPFilteredDeploymentMarket | undefined {
  const { isMultiChainAsset, selectedMultichainChainId, tokens } = ctx
  if (!isMultiChainAsset || selectedMultichainChainId === undefined || !tokens) {
    return undefined
  }
  const gqlChain = getChainInfo(selectedMultichainChainId).backendChain.chain
  return tokens.find((row) => row.chain === gqlChain)?.market ?? undefined
}

function getTDPMarketStatsInput(ctx: {
  tokenQueryData: TokenQuery
  showAggregated: boolean
  filteredDeploymentMarket: TDPFilteredDeploymentMarket | undefined
}): TokenMarketStatsAggregatedInput | undefined {
  const { tokenQueryData, showAggregated, filteredDeploymentMarket } = ctx
  const projectMarket = adaptLegacyProjectMarketData(tokenQueryData.project?.markets?.[0])
  if (showAggregated) {
    return { market: adaptLegacyMarketData(tokenQueryData.market), projectMarket }
  }
  if (filteredDeploymentMarket) {
    return { market: adaptLegacyMarketData(filteredDeploymentMarket), projectMarket }
  }
  // Filtered view but no deployment market (e.g. selected chain missing from project.tokens): intentional undefined;
  // consumers fall back; test: "does not set market stats input when selection has no matching project token row".
  return undefined
}

/** Resolves TokenWeb-backed market stats input vs chain filter, plus copy helpers for the stats UI. */
export function useTDPStatsMarketSource(tokenQueryData: TokenQueryData | undefined): UseTDPStatsMarketSourceResult {
  const multiChainMap = useTDPStore((s) => s.multiChainMap)
  const selectedMultichainChainId = useTDPStore((s) => s.selectedMultichainChainId)

  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const isMultiChainAsset = multichainEntries.length > 1
  const { isMultichainAggregateView } = useTDPMultichainAggregate()

  const networkFilterName = selectedMultichainChainId !== undefined ? getChainLabel(selectedMultichainChainId) : ''

  const { showAggregatedStats, filteredDeploymentMarket, marketStatsInput } = useMemo(() => {
    if (!tokenQueryData) {
      return {
        showAggregatedStats: true,
        filteredDeploymentMarket: undefined,
        marketStatsInput: undefined,
      }
    }

    const showAggregated = !isMultiChainAsset || selectedMultichainChainId === undefined

    // oxlint-disable-next-line no-shadow
    const filteredDeploymentMarket = getTDPFilteredDeploymentMarket({
      isMultiChainAsset,
      selectedMultichainChainId,
      tokens: tokenQueryData.project?.tokens,
    })
    // oxlint-disable-next-line no-shadow
    const marketStatsInput = getTDPMarketStatsInput({
      tokenQueryData,
      showAggregated,
      filteredDeploymentMarket,
    })

    return {
      showAggregatedStats: showAggregated,
      filteredDeploymentMarket,
      marketStatsInput,
    }
  }, [isMultiChainAsset, selectedMultichainChainId, tokenQueryData])

  return {
    showAggregatedStats,
    isMultichainAggregateView,
    filteredDeploymentMarket,
    networkFilterName,
    marketStatsInput,
  }
}
