import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { isStablecoinAddress } from 'uniswap/src/features/chains/utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyAddress, currencyId } from 'uniswap/src/utils/currencyId'
import type { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'

export type TokenTableRow =
  | { type: 'parent'; tokenData: TokenData; subRows?: TokenTableRow[]; testId: string }
  | { type: 'child'; tokenData: TokenData; chainToken: TokenData['tokens'][number] }

/**
 * Counts chain-level rows vs parent rows when multichain assets are collapsed into one expandable row.
 * {@link totalTokenRowCount} is sum of `tokens.length` (one row per chain if flattened).
 * {@link multichainRowReductionCount} is the number of rows “saved” vs that flat layout: for each asset with
 * `tokens.length > 1`, adds `tokens.length - 1`.
 */
export function getPortfolioMultichainExpandRowMetrics(tokenData: TokenData[]): {
  totalTokenRowCount: number
  multichainRowReductionCount: number
  multichainAssetCount: number
} {
  let totalTokenRowCount = 0
  let multichainRowReductionCount = 0
  let multichainAssetCount = 0
  for (const row of tokenData) {
    const chainCount = row.tokens.length
    totalTokenRowCount += chainCount
    if (chainCount > 1) {
      multichainAssetCount += 1
      multichainRowReductionCount += chainCount - 1
    }
  }
  return { totalTokenRowCount, multichainRowReductionCount, multichainAssetCount }
}

/**
 * Stable fingerprint for {@link getPortfolioMultichainExpandRowMetrics} inputs: parent row ids and
 * per-row chain counts only. Ignores balance/price refreshes so analytics can dedupe on this key.
 */
export function getPortfolioMultichainExpandRowMetricsIdentityKey(tokenData: TokenData[]): string {
  return [...tokenData]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((row) => `${row.id}:${row.tokens.length}`)
    .join('|')
}

export function buildTokenTableRows(tokenData: TokenData[], multichainExpandable: boolean): TokenTableRow[] {
  // oxlint-disable-next-line no-shadow
  return tokenData.map((tokenData): TokenTableRow => {
    const hasMultipleChains = multichainExpandable && tokenData.tokens.length > 1
    const subRows: TokenTableRow[] | undefined = hasMultipleChains
      ? tokenData.tokens.map((chainToken) => ({ type: 'child', tokenData, chainToken }))
      : undefined
    return { type: 'parent', tokenData, subRows, testId: tokenData.testId }
  })
}

export function getTokenTableRowId(row: TokenTableRow): string {
  if (row.type === 'parent') {
    return row.tokenData.id
  }
  // Multiple balances can share the same chainId under one multichain parent (e.g. bridged
  // USDC.e + native USDC on OP), so key child rows by the full per-chain currency suffix to
  // keep React ids unique when the parent is expanded.
  return `${row.tokenData.id}-${tokenDataChainRowSuffix(row.chainToken)}`
}

export function getSubRows(row: TokenTableRow): TokenTableRow[] | undefined {
  if (row.type !== 'parent') {
    return undefined
  }
  return row.subRows
}

/**
 * TokenData-like view for a child row so context menu and navigation use the chain-specific data.
 * Child rows set `tokens` to the active chain only (aggregate parent rows keep the full list).
 */
export function getTokenDataForRow(row: TokenTableRow): TokenData {
  if (row.type === 'parent') {
    return row.tokenData
  }
  const { tokenData, chainToken } = row
  return {
    ...tokenData,
    chainId: chainToken.chainId,
    currencyInfo: chainToken.currencyInfo,
    quantity: chainToken.quantity,
    name: chainToken.currencyInfo.currency.name ?? tokenData.name,
    symbol: chainToken.symbol,
    totalValue: chainToken.valueUsd,
    avgCost: chainToken.avgCost,
    unrealizedPnl: chainToken.unrealizedPnl,
    unrealizedPnlPercent: chainToken.unrealizedPnlPercent,
    isStablecoin: isStablecoinForChainToken(chainToken),
    tokens: [chainToken],
  }
}

/** Stable per-chain row suffix (multiple balances can share the same chainId). */
function tokenDataChainRowSuffix(chainToken: TokenData['tokens'][number]): string {
  return (
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    currencyId(chainToken.currencyInfo.currency) ??
    `${chainToken.chainId}-${currencyAddress(chainToken.currencyInfo.currency)}`
  )
}

export function isStablecoinForChainToken(chainToken: TokenData['tokens'][number]): boolean {
  const rawAddr = currencyAddress(chainToken.currencyInfo.currency).toLowerCase()
  const addr = chainToken.currencyInfo.currency.isNative ? DEFAULT_NATIVE_ADDRESS : rawAddr
  return isStablecoinAddress(chainToken.chainId, addr)
}

/**
 * Splits each multichain {@link TokenData} into one row per chain balance, each with `tokens.length === 1`,
 * matching the shape of a multichain row that only has a single chain.
 * Row `id` / `testId` use the same per-chain asset key as `currencyId(currency)` so hidden-table rows stay unique
 * even when several entries share the same multichain `balance.id` before flattening.
 */
export function flattenTokenDataToSingleChainRows(tokenDataList: TokenData[]): TokenData[] {
  const result: TokenData[] = []
  for (const tokenData of tokenDataList) {
    const chainTokens = tokenData.tokens
    const only = chainTokens[0]
    if (chainTokens.length === 0) {
      continue
    }
    if (chainTokens.length === 1) {
      const rowId = tokenDataChainRowSuffix(only)
      result.push({
        ...tokenData,
        id: rowId,
        testId: `${TestID.TokenTableRowPrefix}${rowId}`,
        tokens: [only],
        isStablecoin: isStablecoinForChainToken(only),
      })
      continue
    }
    for (const chainToken of chainTokens) {
      const isStablecoin = isStablecoinForChainToken(chainToken)
      const price =
        chainToken.valueUsd > 0 && chainToken.quantity > 0 ? chainToken.valueUsd / chainToken.quantity : tokenData.price
      const rowId = tokenDataChainRowSuffix(chainToken)
      result.push({
        ...tokenData,
        id: rowId,
        testId: `${TestID.TokenTableRowPrefix}${rowId}`,
        chainId: chainToken.chainId,
        currencyInfo: chainToken.currencyInfo,
        quantity: chainToken.quantity,
        name: chainToken.currencyInfo.currency.name ?? tokenData.name,
        symbol: chainToken.symbol,
        price,
        tokens: [chainToken],
        totalValue: chainToken.valueUsd,
        avgCost: chainToken.avgCost,
        unrealizedPnl: chainToken.unrealizedPnl,
        unrealizedPnlPercent: chainToken.unrealizedPnlPercent,
        isStablecoin,
      })
    }
  }
  return result
}
