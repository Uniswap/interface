import { ApolloClient, InMemoryCache, useQuery } from '@apollo/client'
import { PoolData } from 'components/Pools/PoolTable'
import { SupportedChainId } from 'constants/chains'
import gql from 'graphql-tag'
import { useEffect, useState } from 'react'

function formatTokenSymbol(address: string, symbol: string) {
  return symbol
}

function formatTokenName(address: string, name: string) {
  return name
}

const fujiClient = new ApolloClient({
  uri: 'https://subgraph.satsuma-prod.com/09c9cf3574cc/orbital-apes/v3-subgraph/api',
  cache: new InMemoryCache({
    typePolicies: {
      Token: {
        // Singleton types that have no identifying field can use an empty
        // array for their keyFields.
        keyFields: false,
      },
      Pool: {
        // Singleton types that have no identifying field can use an empty
        // array for their keyFields.
        keyFields: false,
      },
    },
  }),
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
})

function useBlocksFromTimestamps(): {
  blocks:
    | {
        timestamp: string
        number: any
      }[]
    | undefined
  error: boolean
} {
  const activeNetwork = { id: SupportedChainId.MAINNET }
  const [blocks, setBlocks] = useState<any>()
  const error = false

  // derive blocks based on active network
  const networkBlocks = blocks?.[activeNetwork.id]

  const blocksPerHour = (60 * 60) / 4

  useEffect(() => {
    async function fetchData() {
      const results = await fetch('https://subgraph.satsuma-prod.com/09c9cf3574cc/orbital-apes/v3-subgraph/status')
      const data = await results.json()
      let latestBlock = data.data.indexingStatusForCurrentVersion.chains[0]?.latestBlock?.number
      console.log(latestBlock)

      if (latestBlock) {
        latestBlock = parseInt(latestBlock)
      }

      const b24 = latestBlock - blocksPerHour * 24
      const b48 = latestBlock - blocksPerHour * 48
      const b7d = latestBlock - blocksPerHour * 24 * 7

      const time24 = new Date()
      const time48 = new Date()
      const time7d = new Date()

      const ret = [
        { timestamp: (time24.setDate(time24.getDate() - 1) / 1000).toString(), number: b24.toString() },
        { timestamp: (time48.setDate(time48.getDate() - 2) / 1000).toString(), number: b48.toString() },
        { timestamp: (time7d.setDate(time7d.getDate() - 7) / 1000).toString(), number: b7d.toString() },
      ]
      setBlocks(ret)
    }
    if (!networkBlocks && !error) {
      fetchData()
    }
  }, [blocksPerHour, error, networkBlocks])

  return {
    blocks,
    error,
  }
}

const get2DayChange = (valueNow: string, value24HoursAgo: string, value48HoursAgo: string): [number, number] => {
  // get volume info for both 24 hour periods
  const currentChange = parseFloat(valueNow) - parseFloat(value24HoursAgo)
  const previousChange = parseFloat(value24HoursAgo) - parseFloat(value48HoursAgo)
  const adjustedPercentChange = ((currentChange - previousChange) / previousChange) * 100
  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return [currentChange, 0]
  }
  return [currentChange, adjustedPercentChange]
}

const POOLS_BULK = (block: number | undefined) => {
  const queryString =
    `
    query pools {
      pools(` +
    (block ? `block: {number: ${block}} ,` : ``) +
    ` orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
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
      bundles (where: {id: "1"}) {
        ethPriceUSD
      }
    }
    `
  return gql(queryString)
}

interface PoolFields {
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
}

interface PoolDataResponse {
  pools: PoolFields[]
  bundles: {
    ethPriceUSD: string
  }[]
}

/**
 * Fetch top addresses by volume
 */
export function usePoolDatas(): {
  loading: boolean
  error: boolean
  data:
    | {
        [address: string]: PoolData
      }
    | undefined
} {
  // get client
  const dataClient = fujiClient
  // get blocks from historic timestamps
  const { blocks, error: blockError } = useBlocksFromTimestamps()
  const [block24, block48, blockWeek] = blocks ?? []

  const { loading, error, data } = useQuery<PoolDataResponse>(POOLS_BULK(undefined), {
    client: dataClient,
  })

  console.log(block24?.number)
  console.log(block48?.number)
  console.log(blockWeek?.number)

  const {
    loading: loading24,
    error: error24,
    data: data24,
  } = useQuery<PoolDataResponse>(POOLS_BULK(block24?.number), { client: dataClient })
  const {
    loading: loading48,
    error: error48,
    data: data48,
  } = useQuery<PoolDataResponse>(POOLS_BULK(block48?.number), { client: dataClient })
  const {
    loading: loadingWeek,
    error: errorWeek,
    data: dataWeek,
  } = useQuery<PoolDataResponse>(POOLS_BULK(blockWeek?.number), { client: dataClient })

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

  const ethPriceUSD = data?.bundles?.[0]?.ethPriceUSD ? parseFloat(data?.bundles?.[0]?.ethPriceUSD) : 0

  const parsed = data?.pools
    ? data.pools.reduce((accum: { [address: string]: PoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsed24 = data24?.pools
    ? data24.pools.reduce((accum: { [address: string]: PoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsed48 = data48?.pools
    ? data48.pools.reduce((accum: { [address: string]: PoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsedWeek = dataWeek?.pools
    ? dataWeek.pools.reduce((accum: { [address: string]: PoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}

  // format data and calculate daily changes
  const formatted = data?.pools.reduce((accum: { [address: string]: PoolData }, pool) => {
    const current: PoolFields | undefined = parsed[pool.id]
    const oneDay: PoolFields | undefined = parsed24[pool.id]
    const twoDay: PoolFields | undefined = parsed48[pool.id]
    const week: PoolFields | undefined = parsedWeek[pool.id]

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

    const feeTier = current ? parseInt(current.feeTier) : 0

    if (current) {
      accum[pool.id] = {
        address: pool.id,
        feeTier,
        liquidity: parseFloat(current.liquidity),
        sqrtPrice: parseFloat(current.sqrtPrice),
        tick: parseFloat(current.tick),
        token0: {
          address: current.token0.id,
          name: formatTokenName(current.token0.id, current.token0.name),
          symbol: formatTokenSymbol(current.token0.id, current.token0.symbol),
          decimals: parseInt(current.token0.decimals),
          derivedETH: parseFloat(current.token0.derivedETH),
        },
        token1: {
          address: current.token1.id,
          name: formatTokenName(current.token1.id, current.token1.name),
          symbol: formatTokenSymbol(current.token1.id, current.token1.symbol),
          decimals: parseInt(current.token1.decimals),
          derivedETH: parseFloat(current.token1.derivedETH),
        },
        token0Price: parseFloat(current.token0Price),
        token1Price: parseFloat(current.token1Price),
        volumeUSD,
        volumeUSDChange,
        volumeUSDWeek,
        tvlUSD,
        tvlUSDChange,
        tvlToken0,
        tvlToken1,
      }
    }

    return accum
  }, {})

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
