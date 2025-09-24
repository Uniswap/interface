import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'

export function getClosestTick(liquidityData: ChartEntry[], price: number): { tick: ChartEntry; index: number } {
  // Find current price tick index in the liquidity data
  const currentTickIndex = liquidityData.findIndex(
    (d) => Math.abs(d.price0 - price) === Math.min(...liquidityData.map((item) => Math.abs(item.price0 - price))),
  )

  return { tick: liquidityData[currentTickIndex], index: currentTickIndex }
}
