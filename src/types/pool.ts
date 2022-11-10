export type ElasticPoolDetail = {
  address: string
  feeTier: number

  token0: {
    address: string
    name: string
    symbol: string
    decimals: number
  }

  token1: {
    address: string
    name: string
    symbol: string
    decimals: number
  }

  // for tick math
  liquidity: string
  reinvestL: string
  sqrtPrice: string
  tick: number

  tvlUSD: number

  volumeUSDLast24h: number
  tvlUSDLast24h: number

  // prices
  token0Price: number
  token1Price: number

  // token amounts
  tvlToken0: number
  tvlToken1: number

  apr: number
  farmAPR?: number
}
