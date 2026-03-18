export function findNearestTickForPrice(params: {
  price: number
  ticks: { tick: number }[]
  tolerance?: number
}): number | null {
  const { price, ticks, tolerance = 1e-7 } = params

  if (!Number.isFinite(price) || ticks.length === 0) {
    return null
  }

  let nearestTick: number | null = null
  let minDistance = Infinity
  for (const t of ticks) {
    const distance = Math.abs(t.tick - price)
    if (distance < minDistance) {
      minDistance = distance
      nearestTick = t.tick
    }
  }

  if (minDistance > tolerance) {
    return null
  }

  return nearestTick
}
