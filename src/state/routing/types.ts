import { Currency, TradeType } from '@kyberswap/ks-sdk-core'
import { Trade } from '@kyberswap/ks-sdk-elastic'

export enum TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  SYNCING,
}

export interface InterfaceTrade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
  state: TradeState
  trade: Trade<TInput, TOutput, TTradeType> | undefined
}
