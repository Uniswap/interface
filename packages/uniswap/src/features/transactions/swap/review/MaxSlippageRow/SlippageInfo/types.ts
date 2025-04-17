import { PropsWithChildren } from 'react'
import { IndicativeTrade, TradeWithSlippage } from 'uniswap/src/features/transactions/swap/types/trade'

export type SlippageInfoProps = PropsWithChildren<{
  trade: TradeWithSlippage | IndicativeTrade
  isCustomSlippage: boolean
  autoSlippageTolerance?: number
}>
