import { ChainId } from '@uniswap/sdk-core'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { Pool, Token, usePoolDataQuery } from './__generated__/types-and-hooks'
import { chainToApolloClient } from './apollo'
import { useBlocksFromTimestamps } from './useBlocksFromTimestamps'
import { get2DayChange, useDeltaTimestamps } from './utils'

gql`
  query PoolData($poolId: [ID!], $block: Block_height = null) {
    pools(
      where: { id_in: $poolId }
      block: $block
      orderBy: totalValueLockedUSD
      orderDirection: desc
      subgraphError: allow
    ) {
      id
      feeTier
      liquidity
      sqrtPrice
      tick
      token0 {
        id
        symbol
        name
        decimals
        derivedETH
      }
      token1 {
        id
        symbol
        name
        decimals
        derivedETH
      }
      token0Price
      token1Price
      volumeUSD
      volumeToken0
      volumeToken1
      txCount
      totalValueLockedToken0
      totalValueLockedToken1
      totalValueLockedUSD
    }
    bundles(where: { id: "1" }) {
      ethPriceUSD
    }
  }
`

export interface PoolData {
  // basic token info
  address: string
  feeTier: number

  token0: Token

  token1: Token

  // for tick math
  liquidity: number
  sqrtPrice: number
  tick: number

  // volume
  volumeUSD: number
  volumeUSDChange: number
  volumeUSDWeek: number

  // liquidity
  tvlUSD: number
  tvlUSDChange: number

  // prices
  token0Price: number
  token1Price: number

  // token amounts
  tvlToken0: number
  tvlToken1: number
}

export function usePoolData(
  poolAddress: string,
  chainId?: ChainId
): {
  loading: boolean
  error: boolean
  data?: PoolData
} {
  const poolId = [poolAddress]
  const apolloClient = chainToApolloClient[chainId || ChainId.MAINNET]

  // get blocks from historic timestamps
  const [t24, t48, tWeek] = useDeltaTimestamps()
  const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48, tWeek], chainId || ChainId.MAINNET)
  const [block24, block48, blockWeek] = blocks ?? []

  const { loading, error, data } = usePoolDataQuery({
    variables: { poolId },
    client: apolloClient,
    fetchPolicy: 'no-cache',
  })

  const {
    loading: loading24,
    error: error24,
    data: data24,
  } = usePoolDataQuery({
    variables: { poolId, block: { number: parseFloat(block24?.number) } },
    client: apolloClient,
    fetchPolicy: 'no-cache',
  })
  const {
    loading: loading48,
    error: error48,
    data: data48,
  } = usePoolDataQuery({
    variables: { poolId, block: { number: parseFloat(block48?.number) } },
    client: apolloClient,
    fetchPolicy: 'no-cache',
  })
  const {
    loading: loadingWeek,
    error: errorWeek,
    data: dataWeek,
  } = usePoolDataQuery({
    variables: { poolId, block: { number: parseFloat(blockWeek?.number) } },
    client: apolloClient,
    fetchPolicy: 'no-cache',
  })

  return useMemo(() => {
    const anyError = Boolean(error || error24 || error48 || blockError || errorWeek)
    const anyLoading = Boolean(loading || loading24 || loading48 || loadingWeek)

    // return early if not all data yet
    if (anyError || anyLoading) {
      return {
        loading: anyLoading,
        error: anyError,
        data: undefined,
      }
    }

    // format data and calculate daily changes
    const current: Pool | undefined = data?.pools[0] as Pool
    const oneDay: Pool | undefined = data24?.pools[0] as Pool
    const twoDay: Pool | undefined = data48?.pools[0] as Pool
    const week: Pool | undefined = dataWeek?.pools[0] as Pool

    const ethPriceUSD = data?.bundles?.[0]?.ethPriceUSD ? parseFloat(data?.bundles?.[0]?.ethPriceUSD) : 0

    const [volumeUSD, volumeUSDChange] =
      current && oneDay && twoDay
        ? get2DayChange(current.volumeUSD, oneDay.volumeUSD, twoDay.volumeUSD)
        : current
        ? [parseFloat(current.volumeUSD), 0]
        : [0, 0]

    const volumeUSDWeek =
      current && week
        ? parseFloat(current.volumeUSD) - parseFloat(week.volumeUSD)
        : current
        ? parseFloat(current.volumeUSD)
        : 0

    // Hotifx: Subtract fees from TVL to correct data while subgraph is fixed.
    /**
     * Note: see issue desribed here https://github.com/Uniswap/v3-subgraph/issues/74
     * During subgraph deploy switch this month we lost logic to fix this accounting.
     * Grafted sync pending fix now.
     * Verified that this hotfix is still required as of 2023-09-13
     * TODO(DAT-139): Diagnose and address subgraph issue that requires this hotfix
     */
    const feePercent = current ? parseFloat(current.feeTier) / 10000 / 100 : 0
    const tvlAdjust0 = current?.volumeToken0 ? (parseFloat(current.volumeToken0) * feePercent) / 2 : 0
    const tvlAdjust1 = current?.volumeToken1 ? (parseFloat(current.volumeToken1) * feePercent) / 2 : 0
    const tvlToken0 = current ? parseFloat(current.totalValueLockedToken0) - tvlAdjust0 : 0
    const tvlToken1 = current ? parseFloat(current.totalValueLockedToken1) - tvlAdjust1 : 0
    let tvlUSD = current ? parseFloat(current.totalValueLockedUSD) : 0

    const tvlUSDChange =
      current && oneDay
        ? ((parseFloat(current.totalValueLockedUSD) - parseFloat(oneDay.totalValueLockedUSD)) /
            parseFloat(oneDay.totalValueLockedUSD === '0' ? '1' : oneDay.totalValueLockedUSD)) *
          100
        : 0

    // Part of TVL fix
    const tvlUpdated = current
      ? tvlToken0 * parseFloat(current.token0.derivedETH) * ethPriceUSD +
        tvlToken1 * parseFloat(current.token1.derivedETH) * ethPriceUSD
      : undefined
    if (tvlUpdated) {
      tvlUSD = tvlUpdated
    }

    return {
      data: current
        ? {
            ...current,
            address: poolAddress,
            volumeUSD,
            volumeUSDChange,
            volumeUSDWeek,
            tvlUSD,
            tvlUSDChange,
            tvlToken0,
            tvlToken1,
            tick: parseFloat(current.tick),
          }
        : undefined,
      error: anyError,
      loading: anyLoading,
    }
  }, [
    blockError,
    data?.bundles,
    data?.pools,
    data24?.pools,
    data48?.pools,
    dataWeek?.pools,
    error,
    error24,
    error48,
    errorWeek,
    loading,
    loading24,
    loading48,
    loadingWeek,
    poolAddress,
  ])
}
