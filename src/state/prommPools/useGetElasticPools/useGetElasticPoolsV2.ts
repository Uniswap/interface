import useSWRImmutable from 'swr/immutable'

import { CHAINS_SUPPORT_NEW_POOL_FARM_API, NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { ElasticPoolDetail } from 'types/pool'

import { CommonReturn } from '.'

export type RawToken = {
  id: string
  symbol: string
  name: string
  decimals: string
}

export type ElasticPool = {
  id: string

  token0: RawToken
  token1: RawToken

  feeTier: string
  liquidity: string
  reinvestL: string
  sqrtPrice: string
  tick: string

  volumeUsd: string
  feesUsd: string

  totalValueLockedUsd: string
  feesUsdOneDayAgo: string
  volumeUsdOneDayAgo: string

  totalValueLockedUsdInRange: string
  apr: string
  farmApr: string
}

type Response = {
  code: number
  message: string
  data?: {
    pools: Array<ElasticPool>
  }
}

type PoolAccumulator = { [address: string]: ElasticPoolDetail }

const useGetElasticPoolsV2 = (): CommonReturn => {
  const { chainId } = useActiveWeb3React()

  const shouldSkip = !chainId || !CHAINS_SUPPORT_NEW_POOL_FARM_API.includes(chainId)
  const chainRoute = chainId ? NETWORKS_INFO[chainId].internalRoute : ''

  const { isValidating, error, data } = useSWRImmutable<Response>(
    `${process.env.REACT_APP_POOL_FARM_BASE_URL}/${chainRoute}/api/v1/elastic/pools?includeLowTvl=true&page=1&perPage=10000`,
    (url: string) => {
      if (shouldSkip) {
        return Promise.resolve({})
      }
      return fetch(url).then(resp => resp.json())
    },
    {
      refreshInterval: shouldSkip ? 0 : 60_000,
    },
  )

  const poolData: PoolAccumulator =
    data?.data?.pools.reduce((acc, pool) => {
      acc[pool.id] = {
        address: pool.id,

        token0: {
          address: pool.token0.id,
          name: pool.token0.name,
          symbol: pool.token0.symbol,
          decimals: parseInt(pool.token0.decimals),
        },
        token1: {
          address: pool.token1.id,
          name: pool.token1.name,
          symbol: pool.token1.symbol,
          decimals: parseInt(pool.token1.decimals),
        },

        feeTier: Number(pool.feeTier),

        volumeUSDLast24h: Number(pool.volumeUsd) - Number(pool.volumeUsdOneDayAgo),

        tvlUSD: Number(pool.totalValueLockedUsd),
        tvlUSDLast24h: Number(pool.totalValueLockedUsd),
        apr: Number(pool.apr),
        farmAPR: Number(pool.farmApr),

        liquidity: pool.liquidity,
        sqrtPrice: pool.sqrtPrice,
        reinvestL: pool.reinvestL,
        tick: Number(pool.tick),

        // TODO: do we need this?
        token0Price: 0,
        token1Price: 0,
        tvlToken0: 0,
        tvlToken1: 0,
      }

      return acc
    }, {} as PoolAccumulator) || {}

  return {
    isLoading: isValidating,
    isError: !!error,
    data: poolData,
  }
}

export default useGetElasticPoolsV2
