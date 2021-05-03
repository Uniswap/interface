import { Trade } from '@ubeswap/sdk'
import React from 'react'

import { describeTrade, RoutingMethod } from '../describeTrade'
import { MoolaRouterTrade } from '../hooks/useTrade'
import { MoolaDirectTrade } from '../moola/MoolaDirectTrade'
import { MoolaDirectTradeDetails } from './MoolaDirectTradeDetails'
import { MoolaRouterTradeDetails } from './MoolaRouterTradeDetails'
import { UbeswapTradeDetails } from './UbeswapTradeDetails'

interface Props {
  trade: Trade
  allowedSlippage: number
}

export const TradeDetails: React.FC<Props> = ({ trade, allowedSlippage }: Props) => {
  const { routingMethod } = describeTrade(trade)

  if (routingMethod === RoutingMethod.MOOLA) {
    return <MoolaDirectTradeDetails trade={trade as MoolaDirectTrade} />
  }
  if (routingMethod === RoutingMethod.MOOLA_ROUTER) {
    return <MoolaRouterTradeDetails trade={trade as MoolaRouterTrade} allowedSlippage={allowedSlippage} />
  }
  return <UbeswapTradeDetails trade={trade} allowedSlippage={allowedSlippage} />
}
