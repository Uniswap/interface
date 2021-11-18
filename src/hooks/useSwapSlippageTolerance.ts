import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { L2_CHAIN_IDS } from 'constants/chains'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { useUserSlippageToleranceWithDefault } from '../state/user/hooks'
import { useCurrency } from './Tokens'
import useGasPrice from './useGasPrice'
import useUSDCPrice, { useUSDCValue } from './useUSDCPrice'
import { useActiveWeb3React } from './web3'

const V2_SWAP_DEFAULT_SLIPPAGE = new Percent(50, 10_000) // .50%
const V3_SWAP_DEFAULT_SLIPPAGE = new Percent(50, 10_000) // .50%
const ONE_TENTHS_PERCENT = new Percent(10, 10_000) // .10%

/**
 * Return a guess of the gas cost used in computing slippage tolerance for a given trade
 * @param trade the trade for which to _guess_ the amount of gas it would cost to execute
 */
function guestimateGas(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
): number | undefined {
  if (!trade) return undefined
  if (trade instanceof V2Trade) return 90_000 + trade.route.pairs.length * 20_000
  // does not consider the number of ticks crossed
  return 100_000 + trade.swaps.reduce((memo, swap) => swap.route.pools.length + memo, 0) * 30_000
}

const MIN_AUTO_SLIPPAGE_TOLERANCE = new Percent(50, 1000) // 0.5%
const MAX_AUTO_SLIPPAGE_TOLERANCE = new Percent(25, 100) // 25%

export default function useSwapSlippageTolerance(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
): Percent {
  const { chainId } = useActiveWeb3React()
  const onL2 = chainId && L2_CHAIN_IDS.includes(chainId)
  const outputDollarValue = useUSDCValue(trade?.outputAmount)
  const ethGasPrice = useGasPrice()

  const gasEstimate = guestimateGas(trade)
  const ether = useCurrency('ETH')
  const etherPrice = useUSDCPrice(ether ?? undefined)

  const defaultSlippageTolerance = useMemo(() => {
    if (!trade || onL2) return ONE_TENTHS_PERCENT

    const ethGasCost =
      ethGasPrice && typeof gasEstimate === 'number' ? JSBI.multiply(ethGasPrice, JSBI.BigInt(gasEstimate)) : undefined
    const dollarGasCost =
      ether && ethGasCost && etherPrice ? etherPrice.quote(CurrencyAmount.fromRawAmount(ether, ethGasCost)) : undefined

    if (outputDollarValue && dollarGasCost) {
      const fraction = dollarGasCost.asFraction.divide(outputDollarValue.asFraction)
      const result = new Percent(fraction.numerator, fraction.denominator)
      if (result.greaterThan(MAX_AUTO_SLIPPAGE_TOLERANCE)) return MAX_AUTO_SLIPPAGE_TOLERANCE
      if (result.lessThan(MIN_AUTO_SLIPPAGE_TOLERANCE)) return MIN_AUTO_SLIPPAGE_TOLERANCE
      return result
    }

    if (trade instanceof V2Trade) return V2_SWAP_DEFAULT_SLIPPAGE
    return V3_SWAP_DEFAULT_SLIPPAGE
  }, [ethGasPrice, ether, etherPrice, gasEstimate, onL2, outputDollarValue, trade])

  return useUserSlippageToleranceWithDefault(defaultSlippageTolerance)
}
