import { Trade } from '@ubeswap/sdk'
import React from 'react'
import { describeTrade, RoutingMethod } from '../describeTrade'
import { MoolaTrade } from '../moola/MoolaTrade'
import { MoolaTradeDetails } from './MoolaTradeDetails'
import { UbeswapTradeDetails } from './UbeswapTradeDetails'

interface Props {
  trade: Trade
  allowedSlippage: number
}

export const TradeDetails: React.FC<Props> = ({ trade, allowedSlippage }: Props) => {
  const { routingMethod } = describeTrade(trade)

  if (routingMethod === RoutingMethod.MOOLA) {
    return <MoolaTradeDetails trade={trade as MoolaTrade} />
  }
  return <UbeswapTradeDetails trade={trade} allowedSlippage={allowedSlippage} />
}
