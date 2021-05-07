import { Percent } from '@uniswap/sdk-core'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { useMemo } from 'react'
import { ZERO_PERCENT } from '../constants'
import { useUserSlippageToleranceWithDefault } from '../state/user/hooks'
import { computePriceImpactWithMaximumSlippage } from '../utils/computePriceImpactWithMaximumSlippage'
import { computeRealizedLPFeePercent } from 'utils/prices'

const ONE_BIP = new Percent(1, 10_000) // .01%
const ONE_TENTHS_PERCENT = new Percent(10, 10_000) // .1%
const V2_SWAP_DEFAULT_SLIPPAGE = new Percent(45, 10_000) // .45%
const ONE_PERCENT = new Percent(1, 100) // 1%

export default function useSwapSlippageTolerance(trade: V2Trade | V3Trade | undefined): Percent {
  const defaultSlippageTolerance = useMemo(() => {
    if (!trade) return ONE_TENTHS_PERCENT
    if (trade instanceof V2Trade) return V2_SWAP_DEFAULT_SLIPPAGE

    // compute price impact with 0 slippage (inclusive of LP fee)
    let executionPriceImpact = computePriceImpactWithMaximumSlippage(trade, ZERO_PERCENT)

    // compute lp fee
    const realizedLPFeePercent = computeRealizedLPFeePercent(trade)

    // subtract the lp fee from the price impact, with a ceiling of 1 bip
    executionPriceImpact = executionPriceImpact.subtract(realizedLPFeePercent)
    // workaround for the display bug where subtract returns a fraction but we need a percent
    executionPriceImpact = new Percent(executionPriceImpact.numerator, executionPriceImpact.denominator)
    if (executionPriceImpact.lessThan(ONE_BIP)) executionPriceImpact = ONE_BIP

    // floor of 1%
    return executionPriceImpact.lessThan(ONE_PERCENT) ? executionPriceImpact : ONE_PERCENT
  }, [trade])
  return useUserSlippageToleranceWithDefault(defaultSlippageTolerance)
}
