import { MixedRoute, partitionMixedRouteByProtocol, Protocol, Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { L2_CHAIN_IDS, SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import JSBI from 'jsbi'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'
import { ClassicTrade } from 'state/routing/types'

import useGasPrice from './useGasPrice'
import { useStablecoinAmountFromFiatValue } from './useStablecoinPrice'
import { useUSDPrice } from './useUSDPrice'

const DEFAULT_AUTO_SLIPPAGE = new Percent(5, 1000) // 0.5%

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

const MIN_AUTO_SLIPPAGE_TOLERANCE = DEFAULT_AUTO_SLIPPAGE
// assuming normal gas speeds, most swaps complete within 3 blocks and
// there's rarely price movement >5% in that time period
const MAX_AUTO_SLIPPAGE_TOLERANCE = new Percent(5, 100) // 5%

/**
 * Returns slippage tolerance based on values from current trade, gas estimates from api, and active network.
 * Auto slippage is only relevant for Classic swaps because UniswapX slippage is determined by the backend service
 */
export default function useClassicAutoSlippageTolerance(trade?: ClassicTrade): Percent {
  const { chainId } = useWeb3React()
  const onL2 = chainId && L2_CHAIN_IDS.includes(chainId)
  const outputUSD = useUSDPrice(trade?.outputAmount)
  const outputDollarValue = useStablecoinAmountFromFiatValue(outputUSD.data)

  // Prefer the USD estimate, if it is supported.
  const supportsGasEstimate = useMemo(() => chainId && SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId), [chainId])
  const gasEstimateUSD =
    useStablecoinAmountFromFiatValue(supportsGasEstimate ? trade?.gasUseEstimateUSD : undefined) ?? null

  // Skip the gas estimate if we already have a USD estimate, or if there is no trade.
  const skipNativeEstimate = Boolean(gasEstimateUSD || !trade)
  const nativeGasPrice = useGasPrice(/* skip= */ skipNativeEstimate)
  const nativeCurrency = useNativeCurrency(chainId)
  const gasEstimate = guesstimateGas(trade)
  const nativeGasCost =
    nativeGasPrice && typeof gasEstimate === 'number'
      ? JSBI.multiply(nativeGasPrice, JSBI.BigInt(gasEstimate))
      : undefined
  const gasCostUSD = useUSDPrice(
    nativeCurrency && nativeGasCost ? CurrencyAmount.fromRawAmount(nativeCurrency, nativeGasCost) : undefined
  )
  const gasCostStablecoinAmount = useStablecoinAmountFromFiatValue(gasCostUSD.data)

  return useMemo(() => {
    if (!trade || onL2) return DEFAULT_AUTO_SLIPPAGE

    // if valid estimate from api and using api trade, use gas estimate from api
    // NOTE - dont use gas estimate for L2s yet - need to verify accuracy
    // if not, use local heuristic
    const dollarCostToUse =
      chainId && SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) && gasEstimateUSD
        ? gasEstimateUSD
        : gasCostStablecoinAmount

    if (outputDollarValue && dollarCostToUse) {
      // optimize for highest possible slippage without getting MEV'd
      // so set slippage % such that the difference between expected amount out and minimum amount out < gas fee to sandwich the trade
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

    return DEFAULT_AUTO_SLIPPAGE
  }, [trade, onL2, chainId, gasEstimateUSD, gasCostStablecoinAmount, outputDollarValue])
}
