import { gql, useQuery } from '@apollo/client'
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import dayjs from 'dayjs'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useActiveWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'
import { AppState } from 'state/index'
import { getBlocksFromTimestamps } from 'utils'

import { setSharedPoolId } from './actions'

type GenericToken = {
  address: string
  name: string
  symbol: string
  decimals: number
}
export interface ProMMPoolData {
  // basic token info
  address: string
  feeTier: number

  token0: GenericToken
  token1: GenericToken

  // for tick math
  liquidity: string
  reinvestL: string
  sqrtPrice: string
  tick: number

  // volume
  volumeUSDLast24h: number

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
    depositedPositions(where: { user: $owner }) {
      id
      position {
        id
        owner
        liquidity
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
    bundles {
      ethPriceUSD
    }
    positions(where: { owner: $owner, liquidity_gt: 0 }) {
      id
      owner
      liquidity
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
  const { chainId, account, isEVM } = useActiveWeb3React()
  const { elasticClient } = useKyberSwapConfig()

  const { loading, error, data } = useQuery(PROMM_USER_POSITIONS, {
    client: elasticClient,
    variables: {
      owner: account?.toLowerCase(),
    },
    fetchPolicy: 'no-cache',
    skip: !isEVM,
  })

  const ethPriceUSD = Number(data?.bundles?.[0]?.ethPriceUSD)

  const positions = useMemo(() => {
    const farmPositions = data?.depositedPositions?.map((p: any) => p.position) || []
    return farmPositions.concat(data?.positions || []).map((p: UserPosition) => {
      const token0 = new Token(chainId, p.pool.token0.id, Number(p.pool.token0.decimals), p.pool.token0.symbol)
      const token1 = new Token(chainId, p.pool.token1.id, Number(p.pool.token1.decimals), p.pool.token1.symbol)

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

export const usePoolBlocks = () => {
  const { chainId } = useActiveWeb3React()
  const { blockClient } = useKyberSwapConfig()

  const utcCurrentTime = dayjs()
  const last24h = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()

  const [blocks, setBlocks] = useState<{ number: number }[]>([])

  useEffect(() => {
    const getBlocks = async () => {
      const blocks = await getBlocksFromTimestamps(blockClient, [last24h], chainId)
      setBlocks(blocks)
    }

    getBlocks()
  }, [chainId, last24h, blockClient])

  const [blockLast24h] = blocks ?? []

  return { blockLast24h: blockLast24h?.number }
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
  const { isEVM } = useActiveWeb3React()
  const { elasticClient } = useKyberSwapConfig()

  const { loading, error, data } = useQuery<TopPoolsResponse>(TOP_POOLS, {
    client: elasticClient,
    fetchPolicy: 'no-cache',
    skip: !isEVM,
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
