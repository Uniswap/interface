import { MixedRoute, partitionMixedRouteByProtocol, Protocol, Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import { L2_CHAIN_IDS } from 'constants/chains'
import JSBI from 'jsbi'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import useGasPrice from './useGasPrice'
import useStablecoinPrice, { useStablecoinValue } from './useStablecoinPrice'

const V3_SWAP_DEFAULT_SLIPPAGE = new Percent(50, 10_000) // .50%
const ONE_TENTHS_PERCENT = new Percent(10, 10_000) // .10%
const DEFAULT_AUTO_SLIPPAGE = ONE_TENTHS_PERCENT
const GAS_ESTIMATE_BUFFER = new Percent(10, 100) // 10%

// Base costs regardless of how many hops in the route
const V3_SWAP_BASE_GAS_ESTIMATE = 100_000
const V2_SWAP_BASE_GAS_ESTIMATE = 135_000

// Extra cost per hop in the route
const V3_SWAP_HOP_GAS_ESTIMATE = 70_000
const V2_SWAP_HOP_GAS_ESTIMATE = 50_000

/**
 * Return a guess of the gas cost used in computing slippage tolerance for a given trade
 * @param trade the trade for which to _guess_ the amount of gas it would cost to execute
 *
 * V3 logic is inspired by:
 * https://github.com/Uniswap/smart-order-router/blob/main/src/routers/alpha-router/gas-models/v3/v3-heuristic-gas-model.ts
 * V2 logic is inspired by:
 * https://github.com/Uniswap/smart-order-router/blob/main/src/routers/alpha-router/gas-models/v2/v2-heuristic-gas-model.ts
 */
function guesstimateGas(trade: Trade<Currency, Currency, TradeType> | undefined): number | undefined {
  if (trade) {
    let gas = 0
    for (const { route } of trade.swaps) {
      if (route.protocol === Protocol.V2) {
        gas += V2_SWAP_BASE_GAS_ESTIMATE + route.pools.length * V2_SWAP_HOP_GAS_ESTIMATE
      } else if (route.protocol === Protocol.V3) {
        // V3 gas costs scale on initialized ticks being crossed, but we don't have that data here.
        // We bake in some tick crossings into the base 100k cost.
        gas += V3_SWAP_BASE_GAS_ESTIMATE + route.pools.length * V3_SWAP_HOP_GAS_ESTIMATE
      } else if (route.protocol === Protocol.MIXED) {
        const sections = partitionMixedRouteByProtocol(route as MixedRoute<Currency, Currency>)
        gas += sections.reduce((gas, section) => {
          if (section.every((pool) => pool instanceof Pool)) {
            return gas + V3_SWAP_BASE_GAS_ESTIMATE + section.length * V3_SWAP_HOP_GAS_ESTIMATE
          } else if (section.every((pool) => pool instanceof Pair)) {
            return gas + V2_SWAP_BASE_GAS_ESTIMATE + (section.length - 1) * V2_SWAP_HOP_GAS_ESTIMATE
          } else {
            console.warn('Invalid section')
            return gas
          }
        }, 0)
      } else {
        // fallback general gas estimation
        gas += V3_SWAP_BASE_GAS_ESTIMATE + route.pools.length * V3_SWAP_HOP_GAS_ESTIMATE
      }
    }
    return gas
  }
  return undefined
}

const MIN_AUTO_SLIPPAGE_TOLERANCE = new Percent(5, 1000) // 0.5%
const MAX_AUTO_SLIPPAGE_TOLERANCE = new Percent(25, 100) // 25%

/**
 * Returns slippage tolerance based on values from current trade, gas estimates from api, and active network.
 */
export default function useAutoSlippageTolerance(
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
): Percent {
  const { chainId } = useWeb3React()
  const onL2 = chainId && L2_CHAIN_IDS.includes(chainId)
  const outputDollarValue = useStablecoinValue(trade?.outputAmount)
  const nativeGasPrice = useGasPrice()

  const gasEstimate = guesstimateGas(trade)
  const nativeCurrency = useNativeCurrency()
  const nativeCurrencyPrice = useStablecoinPrice((trade && nativeCurrency) ?? undefined)

  return useMemo(() => {
    if (!trade || onL2) return DEFAULT_AUTO_SLIPPAGE

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
        ? trade.gasUseEstimateUSD.multiply(GAS_ESTIMATE_BUFFER)
        : dollarGasCost?.multiply(GAS_ESTIMATE_BUFFER)

    if (outputDollarValue && dollarCostToUse) {
      // the rationale is that a user will not want their trade to fail for a loss due to slippage that is less than
      // the cost of the gas of the failed transaction
      const fraction = dollarCostToUse.asFraction.divide(outputDollarValue.asFraction)
      const result = new Percent(fraction.numerator, fraction.denominator)
      if (result.greaterThan(MAX_AUTO_SLIPPAGE_TOLERANCE)) {
        return MAX_AUTO_SLIPPAGE_TOLERANCE
      }

      if (result.lessThan(MIN_AUTO_SLIPPAGE_TOLERANCE)) {
        return MIN_AUTO_SLIPPAGE_TOLERANCE
      }

      return result
    }

    return V3_SWAP_DEFAULT_SLIPPAGE
  }, [trade, onL2, nativeGasPrice, gasEstimate, nativeCurrency, nativeCurrencyPrice, chainId, outputDollarValue])
}
