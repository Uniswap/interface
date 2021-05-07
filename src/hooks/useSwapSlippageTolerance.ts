import { Percent } from '@uniswap/sdk-core'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { useMemo } from 'react'
import { ZERO_PERCENT } from '../constants'
import { useUserSlippageToleranceWithDefault } from '../state/user/hooks'
import { computePriceImpactWithMaximumSlippage } from '../utils/computePriceImpactWithMaximumSlippage'

const ONE_TENTHS_PERCENT = new Percent(10, 10_000)
const ONE_PERCENT = new Percent(1, 100)

export default function useSwapSlippageTolerance(trade: V2Trade | V3Trade | undefined): Percent {
  const defaultSlippageTolerance = useMemo(() => {
    if (!trade) return ONE_TENTHS_PERCENT
    let executionPriceImpact = computePriceImpactWithMaximumSlippage(trade, ZERO_PERCENT)
    if (trade instanceof V3Trade && trade.route.pools.length === 1) {
      executionPriceImpact = executionPriceImpact.subtract(new Percent(trade.route.pools[0].fee, 1_000_000))
    }
    return executionPriceImpact.lessThan(ONE_PERCENT) ? executionPriceImpact : ONE_PERCENT
  }, [trade])
  return useUserSlippageToleranceWithDefault(defaultSlippageTolerance)
}
