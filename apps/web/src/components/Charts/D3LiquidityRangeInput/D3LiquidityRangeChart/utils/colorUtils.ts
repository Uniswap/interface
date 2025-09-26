// Utility function to determine color for price elements
export const getColorForPrice = ({
  value,
  minPrice,
  maxPrice,
  getActiveColor,
  getInactiveColor,
}: {
  value: number
  minPrice?: number
  maxPrice?: number
  getActiveColor: () => string
  getInactiveColor: () => string
}): string => {
  if (minPrice !== undefined && maxPrice !== undefined) {
    const isInRange = value >= minPrice && value <= maxPrice
    return isInRange ? getActiveColor() : getInactiveColor()
  }
  return getInactiveColor()
}
// Utility function to determine opacity for price elements
export const getOpacityForPrice = ({
  value,
  minPrice,
  maxPrice,
}: {
  value: number
  minPrice?: number
  maxPrice?: number
}): number => {
  if (minPrice !== undefined && maxPrice !== undefined) {
    const isInRange = value >= minPrice && value <= maxPrice
    return isInRange ? 0.5 : 0.2
  }
  return 0.2
}
