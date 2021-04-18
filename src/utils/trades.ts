import { Percent, Trade } from '@ubeswap/sdk'
import { isDualTradeBetter } from 'components/swap/routing/hooks/calculateBestTrades'
import { UbeswapTrade } from 'components/swap/routing/trade'
import { ZERO_PERCENT } from './../constants/index'

// returns whether tradeB is better than tradeA by at least a threshold percentage amount
export function isTradeBetter(
  tradeA: Trade | undefined | null,
  tradeB: Trade | undefined | null,
  minimumDelta: Percent = ZERO_PERCENT
): boolean | undefined {
  return isDualTradeBetter(
    tradeA instanceof UbeswapTrade ? tradeA : tradeA ? UbeswapTrade.fromNormalTrade(tradeA) : tradeA,
    tradeB instanceof UbeswapTrade ? tradeB : tradeB ? UbeswapTrade.fromNormalTrade(tradeB) : tradeB,
    minimumDelta
  )
}
