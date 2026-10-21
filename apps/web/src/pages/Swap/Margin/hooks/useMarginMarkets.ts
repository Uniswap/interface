import { normalizeTokenAddressForCache } from '@universe/chains'
import { useMemo } from 'react'
import { type MarginMarketRow, type MarginMarketVenue } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useMarginMarketsQuery } from 'uniswap/src/data/apiClients/tradingApi/useMarginMarketsQuery'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import type {
  MarginDirection,
  MarginMarketKey,
  MarginPairKey,
  MarginVenue,
} from 'uniswap/src/features/transactions/margin/types'
import { buildCurrencyId, normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { getAddress } from '~/chains'
import {
  MARGIN_CHAIN_ID,
  MARGIN_MARKETS_REFETCH_MS,
  type MarginMarket,
  marginMarketKey,
  type MarginPair,
  type MarginPairGroup,
  type MarginTokenInfo,
} from '~/constants/margin'
import { scaledE18ToNumber } from '~/pages/Swap/Margin/marginFormat'
import { marginMarketRowTokens } from '~/pages/Swap/Margin/marginPositionRow'
import {
  isMarginWrappedNative,
  marginMarketDirection,
  marginPairLegs,
  marginUnwrapName,
} from '~/pages/Swap/Margin/marginTokenDisplay'

const NO_PAIR_MARKETS: MarginMarket[] = []

// Server-authored bps, rounded from the wire's 18-dec fraction — bps are inherently integral, and the
// float division otherwise leaves sub-bps dust (e.g. 350.00000000000006).
const BPS_PER_UNIT = 10_000

// Stable local abstraction predating the wire split into row + per-venue entries — keeps every existing
// consumer (chart stats, retry-cap math) reading a flat WAD/bps shape. Only toLive's mapping changed.
export interface MarginMarketLive {
  // Absent when the venue's borrow-rate read failed on the BE.
  borrowApyBps?: number
  availableBorrowLiquidity: string // raw debt units
  markPriceX18: string
  lltvWad: string
  // LONG for the collateral/debt pair as-is; SHORT for the reversed pair. Absent → derive from the
  // pair's token identity (marginMarketDirection).
  direction?: MarginDirection
}

function toLive({ row, venue }: { row: MarginMarketRow; venue: MarginMarketVenue }): MarginMarketLive {
  return {
    borrowApyBps:
      venue.borrowRate !== undefined ? Math.round(scaledE18ToNumber(venue.borrowRate) * BPS_PER_UNIT) : undefined,
    availableBorrowLiquidity: venue.availableBorrowLiquidity,
    // Pair-level mark, shared by every venue on the row.
    markPriceX18: row.oraclePrice,
    lltvWad: venue.lltv,
    direction: row.direction,
  }
}

// Builds a MarginMarket from a wire row + one of its venues: decimals from the row, symbol/name from
// currency-info, native-equity derived from the collateral address.
function buildDynamicMarket({
  row,
  venue,
  currencyInfoById,
}: {
  row: MarginMarketRow
  venue: MarginMarketVenue
  currencyInfoById: Map<string, CurrencyInfo>
}): MarginMarket {
  const { collateralToken, collateralDecimals, debtToken, debtDecimals } = marginMarketRowTokens(row)
  const collateralInfo = currencyInfoById.get(
    normalizeCurrencyIdForMapLookup(buildCurrencyId(MARGIN_CHAIN_ID, collateralToken)),
  )
  const debtInfo = currencyInfoById.get(normalizeCurrencyIdForMapLookup(buildCurrencyId(MARGIN_CHAIN_ID, debtToken)))
  const shouldUseNativeEquity = isMarginWrappedNative({ address: collateralToken })
  if (__DEV__ && row.direction !== marginMarketDirection({ collateralToken, debtToken })) {
    logger.warn('useMarginMarkets', 'buildDynamicMarket', 'margin direction disagrees with the quote-token set', {
      marketKey: marginMarketKey({ collateralToken, debtToken, venue: venue.venue }),
    })
  }
  // A shortened address while currency-info is unresolved, never the raw 42-char hex: the
  // currency-info query can only be issued once this response names its tokens, so a cold load
  // renders before any symbol resolves, and these two feed pair labels, size/PnL cells and every
  // action modal.
  const collateralSymbol = collateralInfo?.currency.symbol ?? shortenAddress({ address: collateralToken })
  const debtSymbol = debtInfo?.currency.symbol ?? shortenAddress({ address: debtToken })
  return {
    key: marginMarketKey({ collateralToken, debtToken, venue: venue.venue }),
    asset: collateralSymbol,
    name: marginUnwrapName({ address: collateralToken, name: collateralInfo?.currency.name ?? collateralSymbol }),
    // Native-equity markets show 'ETH', matching the static catalog (the raw collateral is WETH).
    displaySymbol: shouldUseNativeEquity ? 'ETH' : collateralSymbol,
    collateral: { address: getAddress(collateralToken), symbol: collateralSymbol, decimals: collateralDecimals },
    debt: { address: getAddress(debtToken), symbol: debtSymbol, decimals: debtDecimals },
    venue: venue.venue,
    direction: row.direction,
    lltvWad: venue.lltv,
    maxLeverage: Number(venue.maxLeverage),
    shouldUseNativeEquity,
  }
}

// Display order for base tokens, read off the markets payload rather than a curated address list:
// each traded leg ranks by where GET /margin/markets first mentions it. A new listing therefore needs
// no client change to sort sensibly, and no client list can go stale against the server's.
function baseTokenOrder(markets: MarginMarket[]): Map<string, number> {
  const order = new Map<string, number>()
  for (const market of markets) {
    const address = normalizeTokenAddressForCache(marginPairLegs(market).base.address)
    if (!order.has(address)) {
      order.set(address, order.size)
    }
  }
  return order
}

// Past the end for an address the payload never mentioned, so ordering stays total even off-registry.
function baseOrderIndex({ order, address }: { order: Map<string, number>; address: string }): number {
  return order.get(normalizeTokenAddressForCache(address)) ?? order.size
}

// The keys `markets.at(0)` and `groups.at(0)` MUST agree on. A pair's long and its short normalise to
// identical legs, as do its venues, so without base-order → base → quote → direction the two lists come
// down to an unguaranteed wire order and the form's adopted default can drift off the selector's first
// row. One comparator rather than two hand-copied ones, so that cannot happen by editing one of them.
function comparePairIdentity({
  a,
  b,
  order,
}: {
  a: { base: MarginTokenInfo; quote: MarginTokenInfo; direction: MarginDirection }
  b: { base: MarginTokenInfo; quote: MarginTokenInfo; direction: MarginDirection }
  order: Map<string, number>
}): number {
  return (
    baseOrderIndex({ order, address: a.base.address }) - baseOrderIndex({ order, address: b.base.address }) ||
    a.base.address.localeCompare(b.base.address) ||
    a.quote.address.localeCompare(b.quote.address) ||
    a.direction.localeCompare(b.direction)
  )
}

// A market projected onto the identity the comparator above orders by.
function marketPairIdentity(market: MarginMarket): {
  base: MarginTokenInfo
  quote: MarginTokenInfo
  direction: MarginDirection
} {
  return { ...marginPairLegs(market), direction: resolveMarketDirection(market) }
}

function resolveMarketDirection(market: MarginMarket): MarginDirection {
  return (
    market.direction ??
    marginMarketDirection({ collateralToken: market.collateral.address, debtToken: market.debt.address })
  )
}

// Scans every live market's collateral/debt tokens for an address match, tolerant of casing. Backs
// the injected token-symbol resolvers threaded into route/step/toast copy.
export function findMarginTokenInfoInMarkets({
  markets,
  address,
}: {
  markets: MarginMarket[]
  address: string
}): MarginTokenInfo | undefined {
  const lower = normalizeTokenAddressForCache(address)
  for (const market of markets) {
    for (const token of [market.collateral, market.debt]) {
      if (normalizeTokenAddressForCache(token.address) === lower) {
        return token
      }
    }
  }
  return undefined
}

// Groups markets by (base, quote, direction), carrying the live borrow rate onto each pair.
export function groupMarketsIntoPairs({
  markets,
  liveByKey,
  order,
}: {
  markets: MarginMarket[]
  liveByKey: Map<MarginMarketKey, MarginMarketLive>
  // The base-token ranking to sort by. The hook passes ITS ranking — derived from the pre-sort list —
  // so `markets.at(0)` and `groups.at(0)` cannot rank base tokens differently. Deriving it here from
  // the already-sorted input agrees only while baseOrderIndex is the market sort's PRIMARY key, which
  // is exactly the silent coupling comparePairIdentity was extracted to remove. Optional only so
  // standalone callers (tests) need not build one.
  order?: Map<string, number>
}): MarginPairGroup[] {
  const byKey = new Map<string, MarginPairGroup>()
  for (const market of markets) {
    const { base, quote } = marginPairLegs(market)
    const direction = resolveMarketDirection(market)
    const key = `${normalizeTokenAddressForCache(base.address)}-${normalizeTokenAddressForCache(quote.address)}-${direction}`
    const live = liveByKey.get(market.key)
    const pair: MarginPair = {
      key: market.key,
      debt: market.debt,
      venue: market.venue,
      direction: market.direction,
      lltvWad: market.lltvWad,
      maxLeverage: market.maxLeverage,
      borrowRateBps: live?.borrowApyBps,
      availableBorrowLiquidity: live?.availableBorrowLiquidity,
    }
    const existing = byKey.get(key)
    if (existing) {
      existing.pairs.push(pair)
    } else {
      byKey.set(key, {
        key,
        pairKey: marginPairKey({ collateralToken: market.collateral.address, debtToken: market.debt.address }),
        base,
        quote,
        direction,
        pairs: [pair],
      })
    }
  }
  const groups = [...byKey.values()]
  for (const group of groups) {
    // Defined rates ascending, rate-less venues last, venue label breaking ties — an all-Aave group
    // has no rates at all, so without the secondary key its order is whatever the wire happened to send.
    group.pairs.sort(
      (a, b) =>
        (a.borrowRateBps ?? Number.MAX_SAFE_INTEGER) - (b.borrowRateBps ?? Number.MAX_SAFE_INTEGER) ||
        a.venue.localeCompare(b.venue),
    )
  }
  // Direction last, so a pair's long always leads its short: `groups.at(0)` is the selector's
  // auto-adopted default, and a pair's two directions are otherwise indistinguishable to every
  // preceding key.
  const ranking = order ?? baseTokenOrder(markets)
  groups.sort((a, b) => comparePairIdentity({ a, b, order: ranking }))
  return groups
}

export function useMarginMarkets(): {
  groups: MarginPairGroup[]
  markets: MarginMarket[]
  getMarket: (key: MarginMarketKey | undefined) => MarginMarket | undefined
  // Every venue backing a pair, in the registry's sorted order. The form holds a venue-free pairKey,
  // so this is how it reaches a market at all — and how the `open` allowlist is sourced.
  getPairMarkets: (key: MarginPairKey | undefined) => MarginMarket[]
  getPairMarket: (key: MarginPairKey | undefined) => MarginMarket | undefined
  // Exact venue when one is named, else the pair's first market — for rows (plans, positions) whose
  // venue the wire may omit. A named venue that is not in the registry resolves to undefined rather
  // than a sibling: the markets payload drops a venue whose read failed, and answering with another
  // venue's lltv/maxLeverage would be worse than answering with nothing.
  getMarketByTokens: (tokens: {
    collateralToken: string
    debtToken: string
    venue?: MarginVenue
  }) => MarginMarket | undefined
  getLive: (key: MarginMarketKey | undefined) => MarginMarketLive | undefined
  isLoading: boolean
  isFetching: boolean
  error: unknown
  // React Query last-successful-fetch time (ms); consumers flag a stale mark from it. 0 before the first fetch.
  dataUpdatedAt: number
  refetch: () => void
} {
  const { data, isLoading, isFetching, error, dataUpdatedAt, refetch } = useMarginMarketsQuery({
    params: { chainId: MARGIN_CHAIN_ID },
    refetchInterval: MARGIN_MARKETS_REFETCH_MS,
    staleTime: MARGIN_MARKETS_REFETCH_MS,
    // The mark line and the staleness cue both key off this fetch; a background tab that stops
    // polling shows neither a moving price nor a stale marker.
    refetchIntervalInBackground: true,
  })

  // Every row needs currency-info resolved (symbol/name aren't on the wire).
  const dynamicCurrencyIds = useMemo(() => {
    const ids = new Set<string>()
    for (const row of data?.markets ?? []) {
      const { collateralToken, debtToken } = marginMarketRowTokens(row)
      ids.add(buildCurrencyId(MARGIN_CHAIN_ID, collateralToken))
      ids.add(buildCurrencyId(MARGIN_CHAIN_ID, debtToken))
    }
    return [...ids]
  }, [data])
  const dynamicInfos = useCurrencyInfos(dynamicCurrencyIds)

  // dataUpdatedAt churns every poll; keeping it outside the memo keeps groups/markets/getMarket/getLive
  // identities stable across deep-equal refetches (React Query structural sharing keeps `data` stable).
  const memoized = useMemo(() => {
    const currencyInfoById = new Map<string, CurrencyInfo>()
    for (const info of dynamicInfos) {
      if (info) {
        currencyInfoById.set(normalizeCurrencyIdForMapLookup(info.currencyId), info)
      }
    }

    const liveByKey = new Map<MarginMarketKey, MarginMarketLive>()
    const marketByKey = new Map<MarginMarketKey, MarginMarket>()
    // One row now covers a whole (exposureToken, counterToken, direction) triple, with every backing
    // venue nested inside it — expand back to one live/market entry per venue, matching how every
    // consumer (retry-cap math, the market selector) still keys off a single-venue MarginMarket.
    for (const row of data?.markets ?? []) {
      for (const venue of row.venues) {
        const { collateralToken, debtToken } = marginMarketRowTokens(row)
        const key = marginMarketKey({ collateralToken, debtToken, venue: venue.venue })
        liveByKey.set(key, toLive({ row, venue }))
        marketByKey.set(key, buildDynamicMarket({ row, venue, currencyInfoById }))
      }
    }

    // Base-token order (payload order), then direction (LONG first) and venue, so `markets.at(0)` —
    // what the header, chart and form fall back to while the stored key is unresolved — is fully
    // determined: a pair's long and its short normalise to identical legs, as do its venues, so
    // without those last two keys the order comes down to an unguaranteed wire order. Sharing its
    // leading keys with the group sort is what keeps that fallback on the same pair the form adopts.
    // The ranking is read off its own copy of the list, still in the order the rows arrived —
    // `.sort()` below mutates in place, so sharing one array would make that guarantee depend on
    // statement order alone.
    const order = baseTokenOrder([...marketByKey.values()])
    const markets = [...marketByKey.values()].sort(
      (a, b) =>
        comparePairIdentity({ a: marketPairIdentity(a), b: marketPairIdentity(b), order }) ||
        a.venue.localeCompare(b.venue),
    )
    const groups = groupMarketsIntoPairs({ markets, liveByKey, order })

    // Built off the sorted list so each pair's venues come out in the same deterministic order the
    // registry itself is in.
    const marketsByPairKey = new Map<MarginPairKey, MarginMarket[]>()
    for (const market of markets) {
      const key = marginPairKey({ collateralToken: market.collateral.address, debtToken: market.debt.address })
      const existing = marketsByPairKey.get(key)
      if (existing) {
        existing.push(market)
      } else {
        marketsByPairKey.set(key, [market])
      }
    }

    // Returns the memo's own array (or the shared empty one) so a caller can memoize on its identity
    // — the derived venue allowlist is a React Query key, and a fresh array per render would re-quote
    // on every render.
    const getPairMarkets = (key: MarginPairKey | undefined): MarginMarket[] =>
      (key ? marketsByPairKey.get(key) : undefined) ?? NO_PAIR_MARKETS

    return {
      groups,
      markets,
      getMarket: (key: MarginMarketKey | undefined): MarginMarket | undefined =>
        key ? marketByKey.get(key) : undefined,
      getPairMarkets,
      getPairMarket: (key: MarginPairKey | undefined): MarginMarket | undefined => getPairMarkets(key).at(0),
      getMarketByTokens: ({
        collateralToken,
        debtToken,
        venue,
      }: {
        collateralToken: string
        debtToken: string
        venue?: MarginVenue
      }): MarginMarket | undefined =>
        venue
          ? marketByKey.get(marginMarketKey({ collateralToken, debtToken, venue }))
          : getPairMarkets(marginPairKey({ collateralToken, debtToken })).at(0),
      getLive: (key: MarginMarketKey | undefined): MarginMarketLive | undefined =>
        key ? liveByKey.get(key) : undefined,
      isLoading,
      error,
    }
  }, [data, dynamicInfos, isLoading, error])

  return { ...memoized, dataUpdatedAt, refetch, isFetching }
}
