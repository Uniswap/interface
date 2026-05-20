import { FeeAmount } from '@uniswap/v3-sdk'
import { AreaData, UTCTimestamp } from 'lightweight-charts'

export type DepthPoint = AreaData<UTCTimestamp> & {
  tick: number
  // Always price0 (token1 per token0). Display layer inverts for reversed view.
  price: number
  activeLiquidity: number
  swapToMove: number
  // true = swap-to-move is in token0 (walking to lower ticks);
  // false = swap-to-move is in token1 (walking to higher ticks).
  inputIsToken0: boolean
  // 'sell' = trader must sell the base token to push price into this zone (left of active).
  // 'buy'  = trader must buy the base token to push price into this zone (right of active).
  side: 'sell' | 'buy'
}

type RawBar = { tick: number; liquidity: number; price0: string; amount0Locked: number; amount1Locked: number }

export const STEP_WIDTH = 1000

// Find the closest depth point on the mirror side at the same % deviation from mid price.
export function getMirrorPoint({
  point,
  midPrice,
  isReversed,
  otherSideData,
}: {
  point: DepthPoint
  midPrice: number
  isReversed: boolean
  otherSideData: DepthPoint[]
}): DepthPoint | undefined {
  if (!midPrice || otherSideData.length === 0) {
    return undefined
  }
  const displayPrice = toDisplayPrice(point.price, isReversed)
  const displayMid = toDisplayPrice(midPrice, isReversed)
  if (!displayMid) {
    return undefined
  }
  const pctDev = Math.abs((displayPrice - displayMid) / displayMid)

  let closest: DepthPoint | undefined
  let closestDiff = Infinity
  for (const p of otherSideData) {
    const pDisplay = toDisplayPrice(p.price, isReversed)
    const pPct = Math.abs((pDisplay - displayMid) / displayMid)
    const diff = Math.abs(pPct - pctDev)
    if (diff < closestDiff) {
      closestDiff = diff
      closest = p
    }
  }
  return closest
}

// `DepthPoint.price` is always price0 (token1 per token0). Reversed view shows price1, so invert.
export function toDisplayPrice(price0: number, isReversed: boolean): number {
  if (!isReversed) {
    return price0
  }
  return price0 > 0 ? 1 / price0 : 0
}

// Midpoint between the last sell point and the first buy point in fake-time space — used by both
// the chart model (to inject a hover-friendly gap datum) and the outer component (to special-case
// the tooltip on hover over the spread).
export function getGapTime(sellData: DepthPoint[], buyData: DepthPoint[]): number | null {
  if (sellData.length === 0 || buyData.length === 0) {
    return null
  }
  const lastSellTime = sellData[sellData.length - 1]!.time as number
  const firstBuyTime = buyData[0]!.time as number
  return (lastSellTime + firstBuyTime) / 2
}

// In reversed view, token1 becomes the base and token0 becomes the quote.
export function getDisplayPair<T>({ tokenA, tokenB, isReversed }: { tokenA: T; tokenB: T; isReversed: boolean }): {
  base: T
  quote: T
} {
  return isReversed ? { base: tokenB, quote: tokenA } : { base: tokenA, quote: tokenB }
}

// price0 at tick T, in token1 units per token0 unit, accounting for decimals.
export function priceFromTick({
  tick,
  token0Decimals,
  token1Decimals,
}: {
  tick: number
  token0Decimals: number
  token1Decimals: number
}): number {
  return Math.pow(1.0001, tick) * Math.pow(10, token0Decimals - token1Decimals)
}

export function buildDepthData({
  barData,
  activeTick,
  feeTier,
  token0Decimals,
  token1Decimals,
  isReversed,
}: {
  barData: RawBar[]
  activeTick: number
  feeTier: FeeAmount
  token0Decimals: number
  token1Decimals: number
  isReversed: boolean
}): { sellData: DepthPoint[]; buyData: DepthPoint[]; midPrice: number } {
  const sorted = [...barData].sort((a, b) => a.tick - b.tick)
  const activeIdx = sorted.findIndex((d) => d.tick === activeTick)

  if (activeIdx === -1) {
    return { sellData: [], buyData: [], midPrice: 0 }
  }

  const fee = feeTier / 1_000_000
  // Gap in time-units between the sell and buy halves; scales with fee so higher-fee pools show a wider spread.
  const feeGap = Math.max(STEP_WIDTH, Math.round(fee * 100 * STEP_WIDTH))

  const midPrice = priceFromTick({ tick: activeTick, token0Decimals, token1Decimals })

  type Walked = {
    tick: number
    priceBasic: number
    activeLiquidity: number
    cumulativeLiquidity: number
    swapToMove: number
    inputIsToken0: boolean
  }

  // Walk toward lower ticks (price0 decreases). Physical input is token0.
  // Renders on the LEFT (sell side) normally, RIGHT (buy side) when reversed.
  const walkLower: Walked[] = []
  let lowerCumulativeL = 0
  let lowerCumInputToken0 = 0
  for (let i = activeIdx - 1; i >= 0; i--) {
    const priceHere = priceFromTick({ tick: sorted[i].tick, token0Decimals, token1Decimals })
    const priceRight =
      i === activeIdx - 1 ? midPrice : priceFromTick({ tick: sorted[i + 1].tick, token0Decimals, token1Decimals })
    const rangeAvgPrice = Math.sqrt(priceHere * priceRight) || priceHere
    const rangeInputToken0 = rangeAvgPrice > 0 ? sorted[i].amount1Locked / rangeAvgPrice : 0
    lowerCumulativeL += sorted[i].liquidity
    lowerCumInputToken0 += rangeInputToken0
    walkLower.unshift({
      tick: sorted[i].tick,
      priceBasic: priceHere,
      activeLiquidity: sorted[i].liquidity,
      cumulativeLiquidity: lowerCumulativeL,
      swapToMove: lowerCumInputToken0,
      inputIsToken0: true,
    })
  }

  // Walk toward higher ticks (price0 increases). Physical input is token1.
  const walkUpper: Walked[] = []
  let upperCumulativeL = 0
  let upperCumInputToken1 = 0
  for (let i = activeIdx + 1; i < sorted.length; i++) {
    const priceHere = priceFromTick({ tick: sorted[i].tick, token0Decimals, token1Decimals })
    const priceLeft =
      i === activeIdx + 1 ? midPrice : priceFromTick({ tick: sorted[i - 1].tick, token0Decimals, token1Decimals })
    const rangeAvgPrice = Math.sqrt(priceLeft * priceHere) || priceHere
    const rangeOutputToken0 = sorted[i - 1]?.amount0Locked ?? 0
    const rangeInputToken1 = rangeOutputToken0 * rangeAvgPrice
    upperCumulativeL += sorted[i].liquidity
    upperCumInputToken1 += rangeInputToken1
    walkUpper.push({
      tick: sorted[i].tick,
      priceBasic: priceHere,
      activeLiquidity: sorted[i].liquidity,
      cumulativeLiquidity: upperCumulativeL,
      swapToMove: upperCumInputToken1,
      inputIsToken0: false,
    })
  }

  // Anchor each side at mid-price with value=0 so the staircase visibly drops to 0 at the
  // active price, instead of ending at the innermost tick (which leaves a confusing gap
  // between the inner edge of liquidity and where the price actually lives).
  if (walkLower.length > 0) {
    walkLower.push({
      tick: activeTick,
      priceBasic: midPrice,
      activeLiquidity: 0,
      cumulativeLiquidity: 0,
      swapToMove: 0,
      inputIsToken0: true,
    })
  }
  if (walkUpper.length > 0) {
    walkUpper.unshift({
      tick: activeTick,
      priceBasic: midPrice,
      activeLiquidity: 0,
      cumulativeLiquidity: 0,
      swapToMove: 0,
      inputIsToken0: false,
    })
  }

  // Sell side renders on the LEFT (lower displayed price). Buy side renders on the RIGHT.
  // - Normal view: left = lower price0 = walkLower. Right = higher price0 = walkUpper.
  // - Reversed:   left = lower price1 = higher price0 = walkUpper (reversed). Right = walkLower (reversed).
  // For each side, the farthest-from-active point sits at the outer edge.
  const leftWalk = isReversed ? walkUpper.slice().reverse() : walkLower
  const rightWalk = isReversed ? walkLower.slice().reverse() : walkUpper

  // Price stays as raw priceBasic (price0). Fee spread is expressed via the `feeGap` on the
  // x-axis, not by nudging individual price values.
  const sellData: DepthPoint[] = leftWalk.map((d, i) => ({
    time: (i * STEP_WIDTH) as UTCTimestamp,
    value: d.cumulativeLiquidity,
    tick: d.tick,
    price: d.priceBasic,
    activeLiquidity: d.activeLiquidity,
    swapToMove: d.swapToMove,
    inputIsToken0: d.inputIsToken0,
    side: 'sell',
  }))

  const buyData: DepthPoint[] = rightWalk.map((d, i) => ({
    time: ((leftWalk.length + i) * STEP_WIDTH + feeGap) as UTCTimestamp,
    value: d.cumulativeLiquidity,
    tick: d.tick,
    price: d.priceBasic,
    activeLiquidity: d.activeLiquidity,
    swapToMove: d.swapToMove,
    inputIsToken0: d.inputIsToken0,
    side: 'buy',
  }))

  return { sellData, buyData, midPrice }
}
