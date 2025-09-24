import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'

export type TickAlignment = 'center' | 'top' | 'bottom'

export function priceToY({
  price,
  liquidityData,
  tickScale,
  tickAlignment,
}: {
  price: number
  liquidityData: ChartEntry[]
  tickScale: ((tick: string) => number) & {
    domain: () => string[]
    bandwidth: () => number
    range: () => [number, number]
  }
  tickAlignment?: TickAlignment
}) {
  if (liquidityData.length === 0) {
    return 0
  }

  const closest = liquidityData.reduce((prev, curr) =>
    Math.abs(curr.price0 - price) < Math.abs(prev.price0 - price) ? curr : prev,
  )
  const bandY = tickScale(closest.tick?.toString() ?? '') || 0

  switch (tickAlignment) {
    case 'top':
      return bandY
    case 'bottom':
      return bandY + tickScale.bandwidth()
    default:
      return bandY + tickScale.bandwidth() / 2
  }
}
