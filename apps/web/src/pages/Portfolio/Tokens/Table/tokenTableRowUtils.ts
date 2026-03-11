import type { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'

export type TokenTableRow =
  | { type: 'parent'; tokenData: TokenData; subRows?: TokenTableRow[] }
  | { type: 'child'; tokenData: TokenData; chainToken: TokenData['tokens'][number] }

/**
 * Builds table rows with optional subRows for multichain expandable UX.
 * When multichainExpandable is true and a token has tokens.length > 1,
 * the row has subRows (one per additional chain). Otherwise subRows is undefined.
 */
export function buildTokenTableRows(tokenData: TokenData[], multichainExpandable: boolean): TokenTableRow[] {
  return tokenData.map((tokenData): TokenTableRow => {
    const hasMultipleChains = multichainExpandable && tokenData.tokens.length > 1
    const subRows: TokenTableRow[] | undefined = hasMultipleChains
      ? tokenData.tokens.map((chainToken) => ({ type: 'child', tokenData, chainToken }))
      : undefined
    return { type: 'parent', tokenData, subRows }
  })
}

export function getTokenTableRowId(row: TokenTableRow): string {
  if (row.type === 'parent') {
    return row.tokenData.id
  }
  return `${row.tokenData.id}-chain-${row.chainToken.chainId}`
}

export function getSubRows(row: TokenTableRow): TokenTableRow[] | undefined {
  if (row.type !== 'parent') {
    return undefined
  }
  return row.subRows
}

/** TokenData-like view for a child row so context menu and navigation use the chain-specific data. */
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
    symbol: chainToken.symbol,
    totalValue: chainToken.valueUsd,
  }
}
