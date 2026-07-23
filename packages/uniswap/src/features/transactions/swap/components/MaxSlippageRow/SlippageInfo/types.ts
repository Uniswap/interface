import { PropsWithChildren } from 'react'
import type { IndicativeTrade, TradeWithSlippage } from 'uniswap/src/features/transactions/swap/types/trade'

export type SlippageInfoProps = PropsWithChildren<{
  trade: TradeWithSlippage | IndicativeTrade
  isCustomSlippage: boolean
  autoSlippageTolerance?: number
}>
