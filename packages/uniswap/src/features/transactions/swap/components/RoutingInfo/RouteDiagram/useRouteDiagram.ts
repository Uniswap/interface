import type { UniverseChainId } from '@universe/chains'
import { isWebApp } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { TokenColorOverrides } from '@universe/mycelium'
import { useMemo } from 'react'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { buildRouteDiagram, type RouteDiagram } from 'uniswap/src/utils/routingDiagram/routeGraph/buildRouteDiagram'

export interface RouteDiagramData {
  diagram: RouteDiagram
  /** Keyed by token key (shared by every visit of a token); a token without a logo falls back to a text label. */
  logoUrlByTokenKey: ReadonlyMap<string, string>
  /** Keyed like `logoUrlByTokenKey`; only tokens with backend-curated colors have an entry. */
  colorOverridesByTokenKey: ReadonlyMap<string, TokenColorOverrides>
}

/**
 * The Sankey route diagram for a classic quote that carries a `routeGraph`, or undefined when the Route row
 * keeps its classic diagram (flag off, not the web app, or the API omitted the graph).
 */
export function useRouteDiagram(trade: Trade): RouteDiagramData | undefined {
  const isEnabled = useFeatureFlag(FeatureFlags.ComplexRouteDiagram)
  // The extension shares this code; the diagram is scoped to the web app for now.
  const routeGraph = isWebApp && isEnabled && isClassic(trade) ? trade.quote.quote.routeGraph : undefined
  const chainId = trade.inputAmount.currency.chainId as UniverseChainId
  const diagram = useMemo(() => buildRouteDiagram({ routeGraph, chainId }), [routeGraph, chainId])
  const currencyIds = useMemo(() => diagram?.nodes.map((node) => node.currencyId) ?? [], [diagram])
  const currencyInfos = useCurrencyInfos(currencyIds, { skip: !diagram })

  return useMemo(() => {
    if (!diagram) {
      return undefined
    }
    const logoUrlByTokenKey = new Map<string, string>()
    const colorOverridesByTokenKey = new Map<string, TokenColorOverrides>()
    for (const info of currencyInfos) {
      const tokenKey = info ? normalizeCurrencyIdForMapLookup(info.currencyId) : undefined
      if (tokenKey && info?.logoUrl) {
        logoUrlByTokenKey.set(tokenKey, info.logoUrl)
      }
      if (tokenKey && info?.colorOverrides) {
        colorOverridesByTokenKey.set(tokenKey, info.colorOverrides)
      }
    }
    return { diagram, logoUrlByTokenKey, colorOverridesByTokenKey }
  }, [diagram, currencyInfos])
}
