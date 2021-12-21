import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'components/swap/GasEstimateBadge'
import { L2_CHAIN_IDS } from 'constants/chains'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { useUserSlippageToleranceWithDefault } from '../state/user/hooks'
import { useNativeCurrency } from './Tokens'
import useGasPrice from './useGasPrice'
import useUSDCPrice, { useUSDCValue } from './useUSDCPrice'
import { useActiveWeb3React } from './web3'

const V3_SWAP_DEFAULT_SLIPPAGE = new Percent(50, 10_000) // .50%
const ONE_TENTHS_PERCENT = new Percent(10, 10_000) // .10%

/**
 * Return a guess of the gas cost used in computing slippage tolerance for a given trade
 * @param trade the trade for which to _guess_ the amount of gas it would cost to execute
 */
function guesstimateGas(trade: Trade<Currency, Currency, TradeType> | undefined): number | undefined {
  if (!!trade) {
    return 100_000 + trade.swaps.reduce((memo, swap) => swap.route.pools.length + memo, 0) * 30_000
  }
  return undefined
}

const MIN_AUTO_SLIPPAGE_TOLERANCE = new Percent(5, 1000) // 0.5%
const MAX_AUTO_SLIPPAGE_TOLERANCE = new Percent(25, 100) // 25%

export default function useSwapSlippageTolerance(
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
): Percent {
  const { chainId } = useActiveWeb3React()
  const onL2 = chainId && L2_CHAIN_IDS.includes(chainId)
  const outputDollarValue = useUSDCValue(trade?.outputAmount)
  const nativeGasPrice = useGasPrice()

  const gasEstimate = guesstimateGas(trade)
  const nativeCurrency = useNativeCurrency()
  const nativeCurrencyPrice = useUSDCPrice(nativeCurrency ?? undefined)

  const defaultSlippageTolerance = useMemo(() => {
    if (!trade || onL2) return ONE_TENTHS_PERCENT

    const nativeGasCost =
      nativeGasPrice && typeof gasEstimate === 'number'
        ? JSBI.multiply(nativeGasPrice, JSBI.BigInt(gasEstimate))
        : undefined
    const dollarGasCost =
      nativeCurrency && nativeGasCost && nativeCurrencyPrice
        ? nativeCurrencyPrice.quote(CurrencyAmount.fromRawAmount(nativeCurrency, nativeGasCost))
        : undefined

    // if valid estimate from api and using api trade, use gas estimate from api
    // NOTE - dont use gas estimate for L2s yet - need to verify accuracy
    // if not, use local heuristic
    const dollarCostToUse =
      chainId && SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) && trade?.gasUseEstimateUSD
        ? trade.gasUseEstimateUSD
        : dollarGasCost

    if (outputDollarValue && dollarCostToUse) {
      // the rationale is that a user will not want their trade to fail for a loss due to slippage that is less than
      // the cost of the gas of the failed transaction
      const fraction = dollarCostToUse.asFraction.divide(outputDollarValue.asFraction)
      const result = new Percent(fraction.numerator, fraction.denominator)
      if (result.greaterThan(MAX_AUTO_SLIPPAGE_TOLERANCE)) return MAX_AUTO_SLIPPAGE_TOLERANCE
      if (result.lessThan(MIN_AUTO_SLIPPAGE_TOLERANCE)) return MIN_AUTO_SLIPPAGE_TOLERANCE
      return result
    }

    return V3_SWAP_DEFAULT_SLIPPAGE
  }, [trade, onL2, nativeGasPrice, gasEstimate, nativeCurrency, nativeCurrencyPrice, chainId, outputDollarValue])

  return useUserSlippageToleranceWithDefault(defaultSlippageTolerance)
}
