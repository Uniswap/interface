import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { multichainChainTokenRowSuffix } from 'uniswap/src/features/portfolio/balances/flattenMultichainToSingleChainRows'
import { CurrencyId } from 'uniswap/src/types/currency'

export const HIDDEN_TOKEN_BALANCES_ROW = 'HIDDEN_TOKEN_BALANCES_ROW' as const

const CHAIN_ROW_PREFIX = 'chain:'

export function isHiddenTokenBalancesRow(row: string): row is typeof HIDDEN_TOKEN_BALANCES_ROW {
  return row === HIDDEN_TOKEN_BALANCES_ROW
}

export function isChainRowId(row: string): boolean {
  return row.startsWith(CHAIN_ROW_PREFIX)
}

/**
 * Parses `makeChainRowId` strings. Uses the last `:` as delimiter so `currencyId`
 * (e.g. `1-0x…`) may contain hyphens but must not contain `:`. `chainCurrencyId`
 * is the per-chain currency id (`<chainId>-<address>`), used to disambiguate
 * same-chain balances under one multichain parent (e.g. bridged USDC.e + native
 * USDC on OP Mainnet).
 */
export function parseChainRowId(row: string): { currencyId: CurrencyId; chainCurrencyId: string } {
  const rest = row.slice(CHAIN_ROW_PREFIX.length)
  const lastColon = rest.lastIndexOf(':')
  const currencyId = rest.slice(0, lastColon) as CurrencyId
  const chainCurrencyId = rest.slice(lastColon + 1)
  return { currencyId, chainCurrencyId }
}

export function makeChainRowId(
  currencyId: CurrencyId,
  chainToken: { chainId: number; currencyInfo: CurrencyInfo },
): string {
  return `${CHAIN_ROW_PREFIX}${currencyId}:${multichainChainTokenRowSuffix(chainToken)}`
}

export type TokenBalanceListRow = CurrencyId | typeof HIDDEN_TOKEN_BALANCES_ROW
