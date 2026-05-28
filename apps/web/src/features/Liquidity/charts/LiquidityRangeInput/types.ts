export interface ChartEntry {
  price0: number
  tick: number
  amount0Locked?: number
  amount1Locked?: number
  liquidityActive: number
  liquidityNet?: number // Net liquidity change at this tick
  bucket?: {
    startTick: number
    endTick: number
  }
  segment?: {
    startTick: number
    endTick: number
  }
}
