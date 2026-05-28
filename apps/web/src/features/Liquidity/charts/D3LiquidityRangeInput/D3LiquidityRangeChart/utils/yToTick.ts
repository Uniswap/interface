import type { LinearTickScale } from '~/features/Liquidity/charts/D3LiquidityChartShared/types'

/**
 * Convert a Y position to a tick using the linear tick scale.
 *
 * With a linear scale, Y positions map directly back to tick values.
 */
export const yToTick = ({ y, tickScale }: { y: number; tickScale: LinearTickScale }): number => {
  return tickScale.axisToTick(y)
}
