import { CustomData, CustomSeriesOptions, UTCTimestamp } from 'lightweight-charts'

export interface LiquidityBarData extends CustomData {
  time: UTCTimestamp
  tick: number
  price0: string
  price1: string
  liquidity: number
  amount0Locked: number
  amount1Locked: number
}

export interface LiquidityBarProps {
  tokenAColor: string
  tokenBColor: string
  highlightColor: string
  activeTick?: number
  activeTickProgress?: number
}

export interface LiquidityBarSeriesOptions extends CustomSeriesOptions, LiquidityBarProps {
  hoveredTick?: number
}
