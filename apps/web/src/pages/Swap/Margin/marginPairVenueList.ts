import { normalizeTokenAddressForCache, type UniverseChainId } from '@universe/chains'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { MARGIN_CHAIN_ID, type MarginPair, type MarginPairGroup, type MarginTokenInfo } from '~/constants/margin'
import { marginPairGroupLabel, marginUnwrapSymbol } from '~/features/margin/utils/marginTokenDisplay'

// One selector row: a pair and the venues the user has not opted out of. The venue itself is routed,
// so the venues only feed the pair's leverage ceiling.
export interface MarginPairRowData {
  group: MarginPairGroup
  // The chain the markets were listed for; /margin/markets is queried for one chain.
  chainId: UniverseChainId
  venues: MarginPair[]
}

export interface MarginTokenFilterOption {
  token: MarginTokenInfo
  // marginTokenKey(token) — the filter's identity for this token.
  address: string
}

// Casing-insensitive identity for a token; every filter here compares addresses in this form.
export function marginTokenKey(token: { address: string }): string {
  return normalizeTokenAddressForCache(token.address)
}

// One row per pair with at least one venue the user has not opted out of. The opt-outs are what the
// slider ceiling and the quote use, so a pair whose every venue is excluded has nothing to trade.
export function buildMarginPairRows({
  groups,
  excludedVenues,
}: {
  groups: MarginPairGroup[]
  excludedVenues: readonly MarginVenue[]
}): MarginPairRowData[] {
  return groups.flatMap((group) => {
    const eligible = group.pairs.filter((pair) => !excludedVenues.includes(pair.venue))
    if (eligible.length === 0) {
      return []
    }
    return [{ group, chainId: MARGIN_CHAIN_ID, venues: eligible }]
  })
}

// The pair's leverage ceiling: the highest max leverage among its eligible venues. Undefined while no
// venue carries one yet.
export function marginPairMaxLeverage(row: MarginPairRowData): number | undefined {
  const leverages = row.venues.flatMap((pair) => (pair.maxLeverage === undefined ? [] : [pair.maxLeverage]))
  return leverages.length > 0 ? Math.max(...leverages) : undefined
}

// The cheapest borrow rate among the pair's eligible venues. Undefined while no venue carries one yet.
export function marginPairLowestBorrowRateBps(row: MarginPairRowData): number | undefined {
  const rates = row.venues.flatMap((pair) => (pair.borrowRateBps === undefined ? [] : [pair.borrowRateBps]))
  return rates.length > 0 ? Math.min(...rates) : undefined
}

// The eligible venue with the most borrowable liquidity. One side of one pair borrows a single debt
// token, so raw amounts compare directly.
export function marginPairDeepestVenue(row: MarginPairRowData): MarginPair | undefined {
  return row.venues.reduce<MarginPair | undefined>(
    (deepest, pair) =>
      pair.availableBorrowLiquidity !== undefined &&
      (deepest?.availableBorrowLiquidity === undefined ||
        Number(pair.availableBorrowLiquidity) > Number(deepest.availableBorrowLiquidity))
        ? pair
        : deepest,
    undefined,
  )
}

// A pair's long and short folded into one list entry, Long first, pairs in first-seen order.
export function mergeMarginPairSides(rows: MarginPairRowData[]): MarginPairRowData[][] {
  const byPair = new Map<string, MarginPairRowData[]>()
  for (const row of rows) {
    const key = `${row.chainId}-${marginTokenKey(row.group.base)}-${marginTokenKey(row.group.quote)}`
    byPair.set(key, [...(byPair.get(key) ?? []), row])
  }
  const isShort = (row: MarginPairRowData): number => Number(row.group.direction === MarginDirection.SHORT)
  return [...byPair.values()].map((sides) => sides.sort((a, b) => isShort(a) - isShort(b)))
}

// Whitespace- and slash-insensitive form, so "eth/usdc", "eth / usdc" and "ethusdc" all match.
function compactPairText(value: string): string {
  return value.replace(/[\s/]/g, '').toLowerCase()
}

function rowMatchesQuery({
  row,
  query,
  tokenName,
}: {
  row: MarginPairRowData
  query: string
  tokenName: (token: MarginTokenInfo) => string
}): boolean {
  const { group } = row
  const compactQuery = compactPairText(query)
  // Raw symbols alongside unwrapped ones, so "weth" still finds the ETH pair.
  return (
    [group.base, group.quote].some(
      (token) =>
        token.symbol.toLowerCase().includes(query) ||
        marginUnwrapSymbol(token).toLowerCase().includes(query) ||
        tokenName(token).toLowerCase().includes(query),
    ) || compactPairText(marginPairGroupLabel({ group })).includes(compactQuery)
  )
}

// Every filter is optional and they all AND together. Addresses are marginTokenKey()s.
export function filterMarginPairRows({
  rows,
  query = '',
  direction,
  chainId,
  quote,
  tokenName,
}: {
  rows: MarginPairRowData[]
  query?: string
  direction?: MarginDirection
  // Network filter; undefined is All networks.
  chainId?: UniverseChainId
  // Quote filter: the pair's quote token, the same on both of its sides.
  quote?: string
  tokenName: (token: MarginTokenInfo) => string
}): MarginPairRowData[] {
  const normalizedQuery = query.trim().toLowerCase()
  return rows.filter((row) => {
    const { group } = row
    if (direction !== undefined && group.direction !== direction) {
      return false
    }
    if (chainId !== undefined && row.chainId !== chainId) {
      return false
    }
    if (quote !== undefined && marginTokenKey(group.quote) !== quote) {
      return false
    }
    return !normalizedQuery || rowMatchesQuery({ row, query: normalizedQuery, tokenName })
  })
}

// Distinct tokens in first-seen order, which is the registry's own pair order.
function distinctTokens(tokens: MarginTokenInfo[]): MarginTokenFilterOption[] {
  const byAddress = new Map<string, MarginTokenFilterOption>()
  for (const token of tokens) {
    const address = marginTokenKey(token)
    if (!byAddress.has(address)) {
      byAddress.set(address, { token, address })
    }
  }
  return [...byAddress.values()]
}

export function marginQuoteFilterOptions(rows: MarginPairRowData[]): MarginTokenFilterOption[] {
  return distinctTokens(rows.map((row) => row.group.quote))
}
