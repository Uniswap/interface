// Stub file - GraphQL schema generation failed because The Graph endpoint was deprecated
// This provides minimal type-safe stubs for the required hooks and types

export interface AllV3TicksQuery {
  ticks: Array<{
    tickIdx: string
    liquidityNet: string
    price0: string
    price1: string
  }>
}

export interface FeeTierDistributionQuery {
  pools: Array<{
    feeTier: string
    totalValueLockedToken0: string
    totalValueLockedToken1: string
  }>
}

export interface PoolDataQuery {
  data: Array<{
    id: string
    feeTier: string
    liquidity: string
    sqrtPrice: string
    tick: string
    token0: {
      id: string
      symbol: string
      name: string
      decimals: string
      derivedETH: string
    }
    token1: {
      id: string
      symbol: string
      name: string
      decimals: string
      derivedETH: string
    }
    token0Price: string
    token1Price: string
    volumeUSD: string
    volumeToken0: string
    volumeToken1: string
    txCount: string
    totalValueLockedToken0: string
    totalValueLockedToken1: string
    totalValueLockedUSD: string
  }>
  bundles: Array<{
    ethPriceUSD: string
  }>
}

// Stub hooks that return empty data
export function usePoolDataQuery(options: any): { data: PoolDataQuery | undefined; loading: boolean; error?: any } {
  return {
    data: undefined,
    loading: false,
    error: new Error('The Graph integration is disabled - endpoint has been deprecated'),
  }
}

export function useAllV3TicksQuery(options: any): { data: AllV3TicksQuery | undefined; loading: boolean; error?: any } {
  return {
    data: undefined,
    loading: false,
    error: new Error('The Graph integration is disabled - endpoint has been deprecated'),
  }
}

export function useFeeTierDistributionQuery(options: any): { data: FeeTierDistributionQuery | undefined; loading: boolean; error?: any } {
  return {
    data: undefined,
    loading: false,
    error: new Error('The Graph integration is disabled - endpoint has been deprecated'),
  }
}
