import { normalizeTokenAddressForCache, type UniverseChainId } from '@universe/chains'
import type { MarginDirection, MarginVenue } from 'uniswap/src/features/transactions/margin/types'
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

// A pair's debt leg: the stable on a long, the traded token on a short. Every venue of a pair borrows
// the same token, so the first one speaks for the group.
function groupDebtToken(group: MarginPairGroup): MarginTokenInfo | undefined {
  return group.pairs.at(0)?.debt
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
  categoryId,
  categoryIdsByToken,
  asset,
  debt,
  tokenName,
}: {
  rows: MarginPairRowData[]
  query?: string
  direction?: MarginDirection
  // Network filter; undefined is All networks.
  chainId?: UniverseChainId
  // Backend token category the traded (base) token must carry — the stable leg never decides one.
  categoryId?: string
  // Category ids per marginTokenKey(), from the data API's token payloads.
  categoryIdsByToken?: ReadonlyMap<string, readonly string[]>
  // Long/short-asset filter: the token the pair goes long or short on.
  asset?: string
  // Debt-asset filter: the token the pair borrows.
  debt?: string
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
    const baseKey = marginTokenKey(group.base)
    if (categoryId !== undefined && !categoryIdsByToken?.get(baseKey)?.includes(categoryId)) {
      return false
    }
    if (asset !== undefined && baseKey !== asset) {
      return false
    }
    const debtToken = groupDebtToken(group)
    if (debt !== undefined && (!debtToken || marginTokenKey(debtToken) !== debt)) {
      return false
    }
    return !normalizedQuery || rowMatchesQuery({ row, query: normalizedQuery, tokenName })
  })
}

// The category ids carried by the listed pairs' traded tokens, so a chip is offered only when it would
// match something.
export function marginPairCategoryIds({
  rows,
  categoryIdsByToken,
}: {
  rows: MarginPairRowData[]
  categoryIdsByToken: ReadonlyMap<string, readonly string[]>
}): Set<string> {
  return new Set(rows.flatMap((row) => categoryIdsByToken.get(marginTokenKey(row.group.base)) ?? []))
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

export function marginAssetFilterOptions(rows: MarginPairRowData[]): MarginTokenFilterOption[] {
  return distinctTokens(rows.map((row) => row.group.base))
}

export function marginDebtFilterOptions(rows: MarginPairRowData[]): MarginTokenFilterOption[] {
  return distinctTokens(
    rows.map((row) => groupDebtToken(row.group)).filter((token): token is MarginTokenInfo => token !== undefined),
  )
}
