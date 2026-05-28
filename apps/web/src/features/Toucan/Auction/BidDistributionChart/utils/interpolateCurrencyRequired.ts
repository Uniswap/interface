import type { TickDetail } from '@uniswap/client-data-api/dist/data/v1/auction_pb'

/**
 * Returns the `currencyRequiredQ96` for a given `tickQ96`, linearly interpolated in price space
 * between the two nearest initialized ticks. Returns null when the target falls outside the
 * range of initialized ticks or when no interpolation is possible.
 *
 * `ticks` MUST be sorted ascending by `priceQ96` (the loader normalizes this).
 *
 * Per LP-847, interpolation is only defined *between* two initialized ticks — we intentionally
 * do not extrapolate below min or above max; the tooltip row is hidden in those cases.
 */
export function interpolateCurrencyRequiredQ96({
  ticks,
  tickQ96,
}: {
  ticks: TickDetail[] | null | undefined
  tickQ96: string
}): string | null {
  if (!ticks || ticks.length === 0) {
    return null
  }

  let target: bigint
  try {
    target = BigInt(tickQ96)
  } catch {
    return null
  }

  let lowerIndex = -1
  for (let i = 0; i < ticks.length; i++) {
    let price: bigint
    try {
      price = BigInt(ticks[i].priceQ96)
    } catch {
      return null
    }

    if (price === target) {
      return ticks[i].currencyRequiredQ96
    }
    if (price < target) {
      lowerIndex = i
    } else {
      break
    }
  }

  // Below the first initialized tick or above the last: no interpolation range available.
  if (lowerIndex === -1 || lowerIndex === ticks.length - 1) {
    return null
  }

  const lower = ticks[lowerIndex]
  const upper = ticks[lowerIndex + 1]

  let lowerPrice: bigint
  let upperPrice: bigint
  let lowerValue: bigint
  let upperValue: bigint
  try {
    lowerPrice = BigInt(lower.priceQ96)
    upperPrice = BigInt(upper.priceQ96)
    lowerValue = BigInt(lower.currencyRequiredQ96)
    upperValue = BigInt(upper.currencyRequiredQ96)
  } catch {
    return null
  }

  const denominator = upperPrice - lowerPrice
  if (denominator <= 0n) {
    return null
  }

  const numerator = (target - lowerPrice) * (upperValue - lowerValue)
  const interpolated = lowerValue + numerator / denominator
  return interpolated.toString()
}

/**
 * Returns the fill ratio (`currencyDemandQ96 / requiredCurrencyDemandQ96`) for a given `tickQ96`,
 * linearly interpolating both demand and required quantities between the two nearest initialized
 * ticks. A value of 1.0 means exactly filled; >1 means oversubscribed; <1 means partially filled.
 *
 * Returns null when the target falls outside the range of initialized ticks, when required
 * demand is zero, or when no interpolation is possible.
 *
 * `ticks` MUST be sorted ascending by `priceQ96`.
 */
export function interpolateFillRatio({
  ticks,
  tickQ96,
}: {
  ticks: TickDetail[] | null | undefined
  tickQ96: string
}): number | null {
  if (!ticks || ticks.length === 0) {
    return null
  }

  let target: bigint
  try {
    target = BigInt(tickQ96)
  } catch {
    return null
  }

  let lowerIndex = -1
  for (let i = 0; i < ticks.length; i++) {
    let price: bigint
    try {
      price = BigInt(ticks[i].priceQ96)
    } catch {
      return null
    }

    if (price === target) {
      let demand: bigint
      let required: bigint
      try {
        demand = BigInt(ticks[i].currencyDemandQ96)
        required = BigInt(ticks[i].requiredCurrencyDemandQ96)
      } catch {
        return null
      }
      if (required === 0n) {
        return null
      }
      return Number((demand * 10000n) / required) / 10000
    }
    if (price < target) {
      lowerIndex = i
    } else {
      break
    }
  }

  if (lowerIndex === -1 || lowerIndex === ticks.length - 1) {
    return null
  }

  const lower = ticks[lowerIndex]
  const upper = ticks[lowerIndex + 1]

  let lowerPrice: bigint
  let upperPrice: bigint
  let lowerDemand: bigint
  let upperDemand: bigint
  let lowerRequired: bigint
  let upperRequired: bigint
  try {
    lowerPrice = BigInt(lower.priceQ96)
    upperPrice = BigInt(upper.priceQ96)
    lowerDemand = BigInt(lower.currencyDemandQ96)
    upperDemand = BigInt(upper.currencyDemandQ96)
    lowerRequired = BigInt(lower.requiredCurrencyDemandQ96)
    upperRequired = BigInt(upper.requiredCurrencyDemandQ96)
  } catch {
    return null
  }

  const denominator = upperPrice - lowerPrice
  if (denominator <= 0n) {
    return null
  }

  const offset = target - lowerPrice
  const interpDemand = lowerDemand + (offset * (upperDemand - lowerDemand)) / denominator
  const interpRequired = lowerRequired + (offset * (upperRequired - lowerRequired)) / denominator

  if (interpRequired <= 0n) {
    return null
  }
  return Number((interpDemand * 10000n) / interpRequired) / 10000
}
