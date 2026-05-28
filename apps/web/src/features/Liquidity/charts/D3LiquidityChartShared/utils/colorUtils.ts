// Utility function to determine color for price elements based on token position
export const getColorForTick = ({
  tick,
  currentTick,
  token0Color,
  token1Color,
}: {
  tick?: number
  currentTick: number
  token0Color: string
  token1Color: string
}): string | undefined => {
  if (tick === undefined) {
    return undefined
  }
  return tick >= currentTick ? token0Color : token1Color
}

// Utility function to determine opacity for price elements.
// The position covers the inclusive band [min, max + tickSpacing) so the bucket
// at maxTick (whose range is [maxTick, maxTick + tickSpacing)) is considered in-range.
export const getOpacityForTick = ({
  tick,
  minTick,
  maxTick,
  tickSpacing,
}: {
  tick?: number
  minTick?: number
  maxTick?: number
  tickSpacing?: number
}): number => {
  if (tick !== undefined && minTick !== undefined && maxTick !== undefined && tickSpacing !== undefined) {
    const lower = Math.min(minTick, maxTick)
    const upper = Math.max(minTick, maxTick)
    const isInRange = tick >= lower && tick < upper + tickSpacing
    return isInRange ? 0.8 : 0.2
  }
  return 0.2
}
