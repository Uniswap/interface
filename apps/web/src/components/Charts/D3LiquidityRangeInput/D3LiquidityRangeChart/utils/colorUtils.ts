// Utility function to determine color for price elements
export const getColorForTick = ({
  tick,
  minTick,
  maxTick,
  getActiveColor,
  getInactiveColor,
}: {
  tick?: number
  minTick?: number
  maxTick?: number
  getActiveColor: () => string
  getInactiveColor: () => string
}): string => {
  if (tick !== undefined && minTick !== undefined && maxTick !== undefined) {
    const isInRange = (tick >= minTick && tick <= maxTick) || (tick <= minTick && tick >= maxTick)
    return isInRange ? getActiveColor() : getInactiveColor()
  }
  return getInactiveColor()
}
// Utility function to determine opacity for price elements
export const getOpacityForTick = ({
  tick,
  minTick,
  maxTick,
}: {
  tick?: number
  minTick?: number
  maxTick?: number
}): number => {
  if (tick !== undefined && minTick !== undefined && maxTick !== undefined) {
    const isInRange = (tick >= minTick && tick <= maxTick) || (tick <= minTick && tick >= maxTick)
    return isInRange ? 0.5 : 0.2
  }
  return 0.2
}
