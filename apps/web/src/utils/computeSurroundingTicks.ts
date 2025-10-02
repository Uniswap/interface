import { Ticks } from 'appGraphql/data/AllV3TicksQuery'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { tickToPrice as tickToPriceV3 } from '@uniswap/v3-sdk'
import { tickToPrice as tickToPriceV4 } from '@uniswap/v4-sdk'
import JSBI from 'jsbi'

const PRICE_FIXED_DIGITS = 8

// Tick with fields parsed to JSBIs, and active liquidity computed.
export interface TickProcessed {
  tick: number
  liquidityActive: JSBI
  liquidityNet: JSBI
  price0: string
  sdkPrice: Price<Currency, Currency>
}

// Computes the numSurroundingTicks above or below the active tick.
export default function computeSurroundingTicks({
  token0,
  token1,
  activeTickProcessed,
  sortedTickData,
  pivot,
  ascending,
  version,
}: {
  token0: Currency
  token1: Currency
  activeTickProcessed: TickProcessed
  sortedTickData: Ticks
  pivot: number
  ascending: boolean
  version: ProtocolVersion
}): TickProcessed[] {
  let previousTickProcessed: TickProcessed = {
    ...activeTickProcessed,
  }

  if (version === ProtocolVersion.V3 && (token0.isNative || token1.isNative)) {
    return []
  }

  // Iterate outwards (either up or down depending on direction) from the active tick,
  // building active liquidity for every tick.
  let processedTicks: TickProcessed[] = []
  for (let i = pivot + (ascending ? 1 : -1); ascending ? i < sortedTickData.length : i >= 0; ascending ? i++ : i--) {
    const tick = Number(sortedTickData[i]?.tick)
    const sdkPrice =
      version === ProtocolVersion.V3
        ? tickToPriceV3(token0 as Token, token1 as Token, tick)
        : tickToPriceV4(token0, token1, tick)
    const currentTickProcessed: TickProcessed = {
      liquidityActive: previousTickProcessed.liquidityActive,
      tick,
      liquidityNet: JSBI.BigInt(sortedTickData[i]?.liquidityNet ?? ''),
      price0: sdkPrice.toFixed(PRICE_FIXED_DIGITS),
      sdkPrice,
    }

    // Update the active liquidity.
    // If we are iterating ascending and we found an initialized tick we immediately apply
    // it to the current processed tick we are building.
    // If we are iterating descending, we don't want to apply the net liquidity until the following tick.
    if (ascending) {
      currentTickProcessed.liquidityActive = JSBI.add(
        previousTickProcessed.liquidityActive,
        JSBI.BigInt(sortedTickData[i]?.liquidityNet ?? 0),
      )
    } else if (JSBI.notEqual(previousTickProcessed.liquidityNet, JSBI.BigInt(0))) {
      // We are iterating descending, so look at the previous tick and apply any net liquidity.
      currentTickProcessed.liquidityActive = JSBI.subtract(
        previousTickProcessed.liquidityActive,
        previousTickProcessed.liquidityNet,
      )
    }

    processedTicks.push(currentTickProcessed)
    previousTickProcessed = currentTickProcessed
  }

  if (!ascending) {
    processedTicks = processedTicks.reverse()
  }

  return processedTicks
}
