import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
export function priceToY({
  price,
  liquidityData,
  tickScale,
}: {
  price: number
  liquidityData: ChartEntry[]
  tickScale: ((tick: string) => number) & {
    domain: () => string[]
    bandwidth: () => number
    range: () => [number, number]
  }
}) {
  if (liquidityData.length === 0) {
    return 0
  }

  const closest = liquidityData.reduce((prev, curr) =>
    Math.abs(curr.price0 - price) < Math.abs(prev.price0 - price) ? curr : prev,
  )
  const bandY = tickScale(closest.tick?.toString() ?? '') || 0
  return bandY + tickScale.bandwidth() / 2
}
