import { CustomData, UTCTimestamp } from 'lightweight-charts'

export interface LiquidityBarData extends CustomData {
  time: UTCTimestamp
  tick: number
  price0: string
  price1: string
  liquidity: number
  amount0Locked: number
  amount1Locked: number
}
