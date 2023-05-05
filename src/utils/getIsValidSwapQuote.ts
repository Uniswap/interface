import { Currency, TradeType } from '@uniswap/sdk-core'
import { ReactNode } from 'react'
import { InterfaceTrade, TradeState } from 'state/routing/types'

export function getIsValidSwapQuote(
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode
): boolean {
  return !!swapInputError && !!trade && (tradeState === TradeState.VALID || tradeState === TradeState.SYNCING)
}
