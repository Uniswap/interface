import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'

export const yToPrice = ({
  y,
  liquidityData,
  tickScale,
}: {
  y: number
  liquidityData: ChartEntry[]
  tickScale: ((tick: string) => number) & {
    domain: () => string[]
    bandwidth: () => number
    range: () => [number, number]
  }
}): number => {
  const tickValues = tickScale.domain()
  let closestTick = tickValues[0]
  const firstTickY = tickScale(closestTick)
  const firstTickCenterY = firstTickY + tickScale.bandwidth() / 2
  let minDistance = Math.abs(y - firstTickCenterY)

  for (const tick of tickValues) {
    const tickY = tickScale(tick) || 0
    const centerY = tickY + tickScale.bandwidth() / 2
    const distance = Math.abs(y - centerY)
    if (distance < minDistance) {
      minDistance = distance
      closestTick = tick
    }
  }

  const tickData = liquidityData.find((d) => d.tick?.toString() === closestTick)
  return tickData ? tickData.price0 : 0
}
