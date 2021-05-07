import { Percent } from '@uniswap/sdk-core'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { useMemo } from 'react'
import { ZERO_PERCENT } from '../constants'
import { useUserSlippageTolerance } from '../state/user/hooks'
import { computePriceImpactWithMaximumSlippage } from '../utils/computePriceImpactWithMaximumSlippage'

const ONE_TENTH_PERCENT = new Percent(10, 10_000)

export default function useSwapSlippageTolerance(trade: V2Trade | V3Trade | undefined): Percent {
  const allowedSlippage = useUserSlippageTolerance()
  return useMemo(() => {
    if (!trade) return ONE_TENTH_PERCENT
    if (allowedSlippage !== 'auto') return allowedSlippage
    // todo: remove the pool fee from the number we use
    const executionPriceImpact = computePriceImpactWithMaximumSlippage(trade, ZERO_PERCENT)
    return executionPriceImpact.lessThan(ONE_TENTH_PERCENT) ? executionPriceImpact : ONE_TENTH_PERCENT
  }, [allowedSlippage, trade])
}
