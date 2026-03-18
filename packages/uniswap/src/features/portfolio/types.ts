import { CurrencyId } from 'uniswap/src/types/currency'

export const HIDDEN_TOKEN_BALANCES_ROW = 'HIDDEN_TOKEN_BALANCES_ROW' as const

export function isHiddenTokenBalancesRow(row: string): row is typeof HIDDEN_TOKEN_BALANCES_ROW {
  return row === HIDDEN_TOKEN_BALANCES_ROW
}

export type TokenBalanceListRow = CurrencyId | typeof HIDDEN_TOKEN_BALANCES_ROW
