// export interface PoolSubgraph {
//   fee: string
//   feesUSD: string
//   id: string
//   liquidity: string
//   sqrtPrice: string
//   tick: string
//   token0: TokenSubgraph
//   token0Price: string
//   token1: TokenSubgraph
//   token1Price: string
//   totalValueLockedToken0: string
//   totalValueLockedToken1: string
//   totalValueLockedUSD: string
//   txCount: string
//   volumeUSD: string
//   untrackedVolumeUSD: string
//   totalValueLockedUSDUntracked: string
// }

export interface PoolChartSubgraph {
  id: string
  fee: string
  token0: TokenSubgraph
  token1: TokenSubgraph
  sqrtPrice: string
  liquidity: string
  tick: string
  feesUSD: string
  untrackedFeesUSD: string
}

export interface TokenSubgraph {
  decimals: string
  derivedMatic: string
  id: string
  name: string
  symbol: string
  address: string
}
