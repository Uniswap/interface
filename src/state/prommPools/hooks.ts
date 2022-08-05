import { gql, useQuery } from '@apollo/client'
import { ChainId, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import dayjs from 'dayjs'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { PROMM_POOLS_BULK, ProMMPoolFields } from 'apollo/queries/promm'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { getBlocksFromTimestamps } from 'utils'
import { get2DayChange } from 'utils/data'

import { AppState } from '../index'
import { setSharedPoolId } from './actions'

export interface ProMMPoolData {
  // basic token info
  address: string
  feeTier: number

  tokenA: Token
  tokenB: Token

  token0: {
    name: string
    symbol: string
    address: string
    decimals: number
    derivedETH: number
  }

  token1: {
    name: string
    symbol: string
    address: string
    decimals: number
    derivedETH: number
  }

  // for tick math
  liquidity: string
  reinvestL: string
  sqrtPrice: string
  tick: number

  // volume
  volumeUSD: number
  volumeUSDChange: number
  // volumeUSDWeek: number

  // liquidity
  tvlUSD: number
  tvlUSDChange: number

  // prices
  token0Price: number
  token1Price: number

  // token amounts
  tvlToken0: number
  tvlToken1: number
  apr: number
}

export interface Bundle {
  ethPriceUSD: string
}

export interface UserPosition {
  id: string
  liquidity: string
  amountDepositedUSD: string
  depositedToken0: string
  depositedToken1: string
  tickLower: {
    tickIdx: string
  }
  tickUpper: {
    tickIdx: string
  }
  pool: {
    id: string
    feeTier: string
    liquidity: string
    reinvestL: string
    tick: string
    sqrtPrice: string
    token0: {
      decimals: string
      symbol: string
      derivedETH: string
      id: string
    }
    token1: {
      decimals: string
      symbol: string
      derivedETH: string
      id: string
    }
  }
}

const PROMM_USER_POSITIONS = gql`
  query positions($owner: Bytes!) {
    bundles {
      ethPriceUSD
    }
    positions(where: { owner: $owner }) {
      id
      owner
      liquidity
      amountDepositedUSD
      depositedToken0
      depositedToken1
      tickLower {
        tickIdx
      }
      tickUpper {
        tickIdx
      }
      pool {
        id
        feeTier
        tick
        liquidity
        reinvestL
        sqrtPrice
        token0 {
          id
          derivedETH
          symbol
          decimals
        }
        token1 {
          id
          derivedETH
          symbol
          decimals
        }
      }
    }
  }
`

export interface UserPositionResult {
  loading: boolean
  error: any
  userLiquidityUsdByPool: {
    [poolId: string]: number
  }
  positions: { address: string; valueUSD: number; tokenId: string }[]
}

/**
 * Get my liquidity for all pools
 */
export function useUserProMMPositions(): UserPositionResult {
  const { chainId, account } = useActiveWeb3React()

  const { loading, error, data } = useQuery(PROMM_USER_POSITIONS, {
    client: NETWORKS_INFO[chainId || ChainId.MAINNET].elasticClient,
    variables: {
      owner: account?.toLowerCase(),
    },
    fetchPolicy: 'no-cache',
  })

  const ethPriceUSD = Number(data?.bundles?.[0]?.ethPriceUSD)

  const positions = useMemo(() => {
    return (data?.positions || []).map((p: UserPosition) => {
      const token0 = new Token(
        chainId as ChainId,
        p.pool.token0.id,
        Number(p.pool.token0.decimals),
        p.pool.token0.symbol,
      )
      const token1 = new Token(
        chainId as ChainId,
        p.pool.token1.id,
        Number(p.pool.token1.decimals),
        p.pool.token1.symbol,
      )

      const pool = new Pool(
        token0,
        token1,
        Number(p.pool.feeTier),
        JSBI.BigInt(p.pool.sqrtPrice),
        JSBI.BigInt(p.pool.liquidity),
        JSBI.BigInt(p.pool.reinvestL),
        Number(p.pool.tick),
      )

      const position = new Position({
        pool,
        liquidity: p.liquidity,
        tickLower: Number(p.tickLower.tickIdx),
        tickUpper: Number(p.tickUpper.tickIdx),
      })

      const token0Amount = CurrencyAmount.fromRawAmount(position.pool.token0, position.amount0.quotient)
      const token1Amount = CurrencyAmount.fromRawAmount(position.pool.token1, position.amount1.quotient)

      const token0Usd = parseFloat(token0Amount.toFixed()) * ethPriceUSD * parseFloat(p.pool.token0.derivedETH)
      const token1Usd = parseFloat(token1Amount.toFixed()) * ethPriceUSD * parseFloat(p.pool.token1.derivedETH)

      const userPositionUSD = token0Usd + token1Usd

      return { tokenId: p.id, address: p.pool.id, valueUSD: userPositionUSD }
    })
  }, [data, chainId, ethPriceUSD])

  const userLiquidityUsdByPool = useMemo(
    () =>
      positions.reduce((acc: { [key: string]: number }, cur: { address: string; valueUSD: number }) => {
        return {
          ...acc,
          [cur.address]: cur.valueUSD + (acc[cur.address] || 0),
        }
      }, {}),
    [positions],
  )

  return useMemo(
    () => ({ loading, error, userLiquidityUsdByPool, positions: positions }),
    [positions, error, loading, userLiquidityUsdByPool],
  )
}

interface PoolDataResponse {
  pools: ProMMPoolFields[]
}

export const usePoolBlocks = () => {
  const { chainId } = useActiveWeb3React()

  const utcCurrentTime = dayjs()
  const t1 = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()
  const t2 = utcCurrentTime.subtract(2, 'day').startOf('minute').unix()
  const tWeek = utcCurrentTime.subtract(1, 'week').startOf('minute').unix()

  const [blocks, setBlocks] = useState<{ number: number }[]>([])

  useEffect(() => {
    const getBlocks = async () => {
      const blocks = await getBlocksFromTimestamps([t1, t2, tWeek], chainId)
      setBlocks(blocks)
    }

    getBlocks()
  }, [t1, t2, tWeek, chainId])

  // get blocks from historic timestamps
  const [block24, block48, blockWeek] = blocks ?? []

  return { block24: block24?.number, block48: block48?.number, blockWeek: blockWeek?.number }
}

export const parsedPoolData = (
  poolAddresses: Array<string>,
  data: PoolDataResponse | undefined,
  data24: PoolDataResponse | undefined,
  data48: PoolDataResponse | undefined,
  chainId: number,
  // dataWeek: PoolDataResponse | undefined,
) => {
  const parsed = data?.pools
    ? data.pools.reduce((accum: { [address: string]: ProMMPoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsed24 = data24?.pools
    ? data24.pools.reduce((accum: { [address: string]: ProMMPoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsed48 = data48?.pools
    ? data48.pools.reduce((accum: { [address: string]: ProMMPoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  // const parsedWeek = dataWeek?.pools
  //   ? dataWeek.pools.reduce((accum: { [address: string]: ProMMPoolFields }, poolData) => {
  //       accum[poolData.id] = poolData
  //       return accum
  //     }, {})
  //   : {}

  // format data and calculate daily changes
  const formatted = poolAddresses.reduce((accum: { [address: string]: ProMMPoolData }, address) => {
    const current: ProMMPoolFields | undefined = parsed[address]
    const oneDay: ProMMPoolFields | undefined = parsed24[address]
    const twoDay: ProMMPoolFields | undefined = parsed48[address]
    // const week: ProMMPoolFields | undefined = parsedWeek[address]

    const [volumeUSD, volumeUSDChange] =
      current && oneDay && twoDay
        ? get2DayChange(current.volumeUSD, oneDay.volumeUSD, twoDay.volumeUSD)
        : current
        ? [parseFloat(current.volumeUSD), 0]
        : [0, 0]

    // const volumeUSDWeek =
    //   current && week
    //     ? parseFloat(current.volumeUSD) - parseFloat(week.volumeUSD)
    //     : current
    //     ? parseFloat(current.volumeUSD)
    //     : 0

    const tvlUSD = current ? parseFloat(current.totalValueLockedUSD) : 0

    const tvlUSDChange =
      current && oneDay
        ? ((parseFloat(current.totalValueLockedUSD) - parseFloat(oneDay.totalValueLockedUSD)) /
            parseFloat(oneDay.totalValueLockedUSD === '0' ? '1' : oneDay.totalValueLockedUSD)) *
          100
        : 0

    const tvlToken0 = current ? parseFloat(current.totalValueLockedToken0) : 0
    const tvlToken1 = current ? parseFloat(current.totalValueLockedToken1) : 0

    const feeTier = current ? parseInt(current.feeTier) : 0

    if (current) {
      accum[address] = {
        address,
        feeTier,
        liquidity: current.liquidity,
        sqrtPrice: current.sqrtPrice,
        reinvestL: current.reinvestL,
        tick: parseFloat(current.tick),
        tokenA: new Token(chainId, current.token0.id, Number(current.token0.decimals), current.token0.symbol),
        tokenB: new Token(chainId, current.token1.id, Number(current.token1.decimals), current.token1.symbol),

        token0: {
          address: current.token0.id,
          name: current.token0.name,
          symbol: current.token0.symbol,
          decimals: parseInt(current.token0.decimals),
          derivedETH: parseFloat(current.token0.derivedETH),
        },
        token1: {
          address: current.token1.id,
          name: current.token1.name,
          symbol: current.token1.symbol,
          decimals: parseInt(current.token1.decimals),
          derivedETH: parseFloat(current.token1.derivedETH),
        },
        token0Price: parseFloat(current.token0Price),
        token1Price: parseFloat(current.token1Price),
        volumeUSD,
        volumeUSDChange,
        // volumeUSDWeek,
        tvlUSD,
        tvlUSDChange,
        tvlToken0,
        tvlToken1,
        apr: tvlUSD > 0 ? (volumeUSD * (feeTier / ELASTIC_BASE_FEE_UNIT) * 100 * 365) / tvlUSD : 0,
      }
    }

    return accum
  }, {})

  return formatted
}

/**
 * Fetch top addresses by volume
 */
export function usePoolDatas(poolAddresses: string[]): {
  loading: boolean
  error: boolean
  data:
    | {
        [address: string]: ProMMPoolData
      }
    | undefined
} {
  const { chainId } = useActiveWeb3React()
  const dataClient = NETWORKS_INFO[chainId || ChainId.MAINNET].elasticClient

  const { block24, block48 } = usePoolBlocks()

  const { loading, error, data } = useQuery<PoolDataResponse>(PROMM_POOLS_BULK(undefined, poolAddresses), {
    client: dataClient,
    fetchPolicy: 'no-cache',
  })

  const {
    loading: loading24,
    error: error24,
    data: data24,
  } = useQuery<PoolDataResponse>(PROMM_POOLS_BULK(block24, poolAddresses), {
    client: dataClient,
    fetchPolicy: 'no-cache',
  })
  const {
    loading: loading48,
    error: error48,
    data: data48,
  } = useQuery<PoolDataResponse>(PROMM_POOLS_BULK(block48, poolAddresses), {
    client: dataClient,
    fetchPolicy: 'no-cache',
  })
  // const { loading: loadingWeek, error: errorWeek, data: dataWeek } = useQuery<PoolDataResponse>(
  //   PROMM_POOLS_BULK(blockWeek, poolAddresses),
  //   { client: dataClient, fetchPolicy: 'no-cache' },
  // )

  const anyError = Boolean(error || error24 || error48)
  const anyLoading = Boolean(loading || loading24 || loading48)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: undefined,
    }
  }

  const formatted = parsedPoolData(poolAddresses, data, data24, data48, chainId as ChainId)
  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}

export function useSelectedPool() {
  return useSelector((state: AppState) => state.pools.selectedPool)
}

export function useSharedPoolIdManager(): [string | undefined, (newSharedPoolId: string | undefined) => void] {
  const dispatch = useDispatch()
  const sharedPoolId = useSelector((state: AppState) => state.pools.sharedPoolId)

  const onSetSharedPoolId = useCallback(
    (newSharedPoolId: string | undefined) => {
      dispatch(setSharedPoolId({ poolId: newSharedPoolId }))
    },
    [dispatch],
  )

  return useMemo(() => [sharedPoolId, onSetSharedPoolId], [onSetSharedPoolId, sharedPoolId])
}

export const TOP_POOLS = gql`
  query topPools {
    pools(first: 500, orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
      id
    }
  }
`

interface TopPoolsResponse {
  pools: {
    id: string
  }[]
}

/**
 * Fetch top addresses by volume
 */
export function useTopPoolAddresses(): {
  loading: boolean
  error: boolean
  addresses: string[] | undefined
} {
  const { chainId } = useActiveWeb3React()
  const dataClient = NETWORKS_INFO[chainId || ChainId.MAINNET].elasticClient

  const { loading, error, data } = useQuery<TopPoolsResponse>(TOP_POOLS, {
    client: dataClient,
    fetchPolicy: 'no-cache',
  })

  const formattedData = useMemo(() => {
    if (data) {
      return data.pools.map(p => p.id)
    } else {
      return undefined
    }
  }, [data])

  return {
    loading: loading,
    error: Boolean(error),
    addresses: formattedData,
  }
}
