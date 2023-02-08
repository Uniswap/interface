import { useQuery } from '@apollo/client'
import { ChainId } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

import { PROMM_POOLS_BULK, ProMMPoolFields } from 'apollo/queries/promm'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { ElasticPoolDetail } from 'types/pool'
import { getBlocksFromTimestamps } from 'utils'

import { CommonReturn } from '.'

interface PoolDataResponse {
  pools: ProMMPoolFields[]
}

type PoolAccumulator = Record<string, ProMMPoolFields>

const usePoolBlocks = () => {
  const { chainId } = useActiveWeb3React()

  const utcCurrentTime = dayjs()
  const last24h = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()

  const [blocks, setBlocks] = useState<{ number: number }[]>([])

  useEffect(() => {
    const getBlocks = async () => {
      const blocks = await getBlocksFromTimestamps([last24h], chainId)
      setBlocks(blocks)
    }

    getBlocks()
  }, [chainId, last24h])

  const [blockLast24h] = blocks ?? []

  return { blockLast24h: blockLast24h?.number }
}

const parsedPoolData = (
  poolAddresses: Array<string>,
  data: PoolDataResponse | undefined,
  data24: PoolDataResponse | undefined,
) => {
  const parsed: PoolAccumulator = data?.pools
    ? data.pools.reduce((acc, poolData) => {
        acc[poolData.id] = poolData
        return acc
      }, {} as PoolAccumulator)
    : {}

  const parsed24: PoolAccumulator = data24?.pools
    ? data24.pools.reduce((acc, poolData) => {
        acc[poolData.id] = poolData
        return acc
      }, {} as PoolAccumulator)
    : {}

  // format data and calculate daily changes
  const formatted = poolAddresses.reduce((acc: { [address: string]: ElasticPoolDetail }, upperCaseAddress) => {
    const address = upperCaseAddress.toLowerCase()
    const current: ProMMPoolFields | undefined = parsed[address]
    const oneDay: ProMMPoolFields | undefined = parsed24[address]

    const volumeUSDLast24h =
      current && oneDay
        ? parseFloat(current.volumeUSD) - parseFloat(oneDay.volumeUSD)
        : current
        ? parseFloat(current.volumeUSD)
        : 0

    const tvlUSD = current ? parseFloat(current.totalValueLockedUSD) : 0

    const tvlUSDLast24h =
      current && oneDay
        ? ((parseFloat(current.totalValueLockedUSD) - parseFloat(oneDay.totalValueLockedUSD)) /
            parseFloat(oneDay.totalValueLockedUSD === '0' ? '1' : oneDay.totalValueLockedUSD)) *
          100
        : 0

    const tvlToken0 = current ? parseFloat(current.totalValueLockedToken0) : 0
    const tvlToken1 = current ? parseFloat(current.totalValueLockedToken1) : 0

    const feeTier = current ? parseInt(current.feeTier) : 0

    if (current) {
      acc[address] = {
        address,
        feeTier,
        liquidity: current.liquidity,
        sqrtPrice: current.sqrtPrice,
        reinvestL: current.reinvestL,
        tick: parseFloat(current.tick),

        token0: {
          address: current.token0.id,
          name: current.token0.name,
          symbol: current.token0.symbol,
          decimals: parseInt(current.token0.decimals),
        },
        token1: {
          address: current.token1.id,
          name: current.token1.name,
          symbol: current.token1.symbol,
          decimals: parseInt(current.token1.decimals),
        },
        token0Price: parseFloat(current.token0Price),
        token1Price: parseFloat(current.token1Price),
        tvlUSD: parseFloat(current.totalValueLockedUSD),
        volumeUSDLast24h,
        tvlUSDLast24h,
        tvlToken0,
        tvlToken1,
        apr: tvlUSD > 0 ? (volumeUSDLast24h * (feeTier / ELASTIC_BASE_FEE_UNIT) * 100 * 365) / tvlUSD : 0,
      }
    }

    return acc
  }, {})

  return formatted
}

const useGetElasticPoolsV1 = (poolAddresses: string[], skip?: boolean): CommonReturn => {
  const { chainId } = useActiveWeb3React()
  const dataClient = isEVM(chainId)
    ? NETWORKS_INFO[chainId].elastic.client
    : NETWORKS_INFO[ChainId.MAINNET].elastic.client

  const { blockLast24h } = usePoolBlocks()

  const { loading, error, data } = useQuery<PoolDataResponse>(PROMM_POOLS_BULK(undefined, poolAddresses), {
    client: dataClient,
    fetchPolicy: 'no-cache',
    skip,
  })

  const {
    loading: loading24,
    error: error24,
    data: data24,
  } = useQuery<PoolDataResponse>(PROMM_POOLS_BULK(blockLast24h, poolAddresses), {
    client: dataClient,
    fetchPolicy: 'no-cache',
    skip,
  })

  const anyError = Boolean(error || error24)
  const anyLoading = Boolean(loading || loading24)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      isLoading: anyLoading,
      isError: anyError,
      data: undefined,
    }
  }

  const formatted = parsedPoolData(poolAddresses, data, data24)
  return {
    isLoading: anyLoading,
    isError: anyError,
    data: formatted,
  }
}

export default useGetElasticPoolsV1
