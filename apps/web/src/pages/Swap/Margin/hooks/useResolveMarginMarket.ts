import { normalizeTokenAddressForCache } from '@universe/chains'
import { useMemo } from 'react'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { MarginDirection, MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { buildCurrencyId, normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { getAddress } from '~/chains'
import { MARGIN_CHAIN_ID, marginMarketKey, type MarginMarket } from '~/constants/margin'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { marginPositionTokens, marginPositionVenue } from '~/pages/Swap/Margin/marginPositionRow'
import { isMarginWrappedNative, marginUnwrapName, marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'

export type MarginMarketTokens = {
  collateralToken: string
  debtToken: string
  venue?: MarginVenue
  direction?: MarginDirection
}
export type MarginMarketResolver = (tokens: MarginMarketTokens) => MarginMarket | undefined

// Synthetic market for a position whose (collateral, debt, venue) isn't in the live registry:
// symbol/name/decimals come from currency-info (the wire carries no decimals). Returns undefined
// until both tokens resolve, so callers keep their raw-string fallback meanwhile — and equally when
// the row names no venue, since off-registry there is nothing to resolve one from.
export function buildFallbackMarginMarket({
  tokens,
  currencyInfoById,
}: {
  tokens: MarginMarketTokens
  currencyInfoById: Map<string, CurrencyInfo>
}): MarginMarket | undefined {
  const collateralInfo = currencyInfoById.get(
    normalizeCurrencyIdForMapLookup(buildCurrencyId(MARGIN_CHAIN_ID, tokens.collateralToken)),
  )
  const debtInfo = currencyInfoById.get(
    normalizeCurrencyIdForMapLookup(buildCurrencyId(MARGIN_CHAIN_ID, tokens.debtToken)),
  )
  if (!collateralInfo || !debtInfo || !tokens.venue) {
    return undefined
  }
  // Resolved currency-info can still carry no symbol; a shortened address keeps the raw 42-char hex
  // out of pair labels and amount cells.
  const collateralSymbol = collateralInfo.currency.symbol ?? shortenAddress({ address: tokens.collateralToken })
  const debtSymbol = debtInfo.currency.symbol ?? shortenAddress({ address: tokens.debtToken })
  const collateralAddress = getAddress(tokens.collateralToken)
  const debtAddress = getAddress(tokens.debtToken)
  return {
    key: marginMarketKey({ collateralToken: collateralAddress, debtToken: debtAddress, venue: tokens.venue }),
    asset: collateralSymbol,
    name: marginUnwrapName({ address: collateralAddress, name: collateralInfo.currency.name ?? collateralSymbol }),
    displaySymbol: marginUnwrapSymbol({ address: collateralAddress, symbol: collateralSymbol }),
    collateral: { address: collateralAddress, symbol: collateralSymbol, decimals: collateralInfo.currency.decimals },
    debt: { address: debtAddress, symbol: debtSymbol, decimals: debtInfo.currency.decimals },
    venue: tokens.venue,
    direction: tokens.direction,
    // Unknown from tokens alone; the position's own LTV fields drive the risk cells.
    lltvWad: '0',
    shouldUseNativeEquity: isMarginWrappedNative({ address: collateralAddress }),
  }
}

// Resolves a row's market: the live registry first, then a currency-info-backed synthetic market for
// pairs the registry doesn't (yet) carry. One batched currency-info query covers every row token.
// Terminal history is folded into `positions[]` on the wire now, and no plan can strand an incomplete
// open anymore — both used to be separate buckets here.
export function useResolveMarginMarket(rows: { positions?: MarginPosition[] }): MarginMarketResolver {
  const { getMarketByTokens } = useMarginMarkets()
  const currencyIds = useMemo(() => {
    const ids = new Set<string>()
    const add = (token: string): void => {
      if (normalizeTokenAddressForCache(token) !== MARGIN_NATIVE_TOKEN_ADDRESS) {
        ids.add(buildCurrencyId(MARGIN_CHAIN_ID, token))
      }
    }
    for (const row of rows.positions ?? []) {
      const { collateralToken, debtToken } = marginPositionTokens(row)
      add(collateralToken)
      add(debtToken)
    }
    return [...ids]
  }, [rows.positions])
  const infos = useCurrencyInfos(currencyIds)
  const currencyInfoById = useMemo(() => {
    const map = new Map<string, CurrencyInfo>()
    for (const info of infos) {
      if (info) {
        map.set(normalizeCurrencyIdForMapLookup(info.currencyId), info)
      }
    }
    return map
  }, [infos])
  return useMemo<MarginMarketResolver>(
    () => (tokens) => getMarketByTokens(tokens) ?? buildFallbackMarginMarket({ tokens, currencyInfoById }),
    [getMarketByTokens, currencyInfoById],
  )
}

// Single-position convenience for the drawer: the live registry first, else the currency-info fallback,
// so a server/indexer-sourced position outside the registry still resolves.
export function useResolveMarginMarketForPosition(position: MarginPosition): MarginMarket | undefined {
  const rows = useMemo(() => ({ positions: [position] }), [position])
  const resolveMarket = useResolveMarginMarket(rows)
  return resolveMarket({
    ...marginPositionTokens(position),
    venue: marginPositionVenue(position),
    direction: position.direction,
  })
}
