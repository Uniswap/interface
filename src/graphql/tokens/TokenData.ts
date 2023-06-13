import { useQuery } from '@apollo/client'
import { apolloClient } from 'graphql/data/apollo'
import gql from 'graphql-tag'
import { useBlocksFromTimestamps } from 'hooks/useBlocksFromTimestamps'
import { useEthPrices } from 'hooks/useEthPrices'
import { get2DayChange } from 'utils/data'
import { useDeltaTimestamps } from 'utils/queries'

import { getPercentChange } from './../../utils/data'

export type TokenData = {
  // token is in some pool on uniswap
  exists: boolean

  // basic token info
  name: string
  symbol: string
  address: string

  // volume
  volumeUSD: number
  volumeUSDChange: number
  volumeUSDWeek: number
  txCount: number

  //fees
  feesUSD: number

  // tvl
  tvlToken: number
  tvlUSD: number
  tvlUSDChange: number

  priceUSD: number
  priceUSDChange: number
  priceUSDChangeWeek: number
}

const TOKENS_BULK = (block: number | undefined, tokens: string[]) => {
  let tokenString = `[`
  tokens.map((address) => {
    return (tokenString += `"${address}",`)
  })
  tokenString += ']'
  const queryString =
    `
    query tokens {
      tokens(where: {id_in: ${tokenString}},` +
    (block ? `block: {number: ${block}} ,` : ``) +
    ` orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
        id
        symbol
        name
        derivedSYS
        volumeUSD
        volume
        txCount
        totalValueLocked
        feesUSD
        totalValueLockedUSD
      }
    }
    `
  return gql(queryString)
}

interface TokenFields {
  id: string
  symbol: string
  name: string
  derivedSYS: string
  volumeUSD: string
  volume: string
  feesUSD: string
  txCount: string
  totalValueLocked: string
  totalValueLockedUSD: string
}

interface TokenDataResponse {
  tokens: TokenFields[]
  bundles: {
    sysPriceUSD: string
  }[]
}

/**
 * Fetch top addresses by volume
 */
export function useFetchedTokenData(tokenAddresses: string[]): {
  loading: boolean
  error: boolean
  data: TokenData[] | undefined
} {
  // get blocks from historic timestamps
  const [t24, t48, tWeek] = useDeltaTimestamps()

  const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48, tWeek])

  const [block24, block48, blockWeek] = blocks ?? []
  const ethPrices = useEthPrices()

  const { loading, error, data } = useQuery<TokenDataResponse>(TOKENS_BULK(undefined, tokenAddresses), {
    client: apolloClient,
  })

  const {
    loading: loading24,
    error: error24,
    data: data24,
  } = useQuery<TokenDataResponse>(TOKENS_BULK(parseInt(block24?.number), tokenAddresses), {
    client: apolloClient,
  })

  const {
    loading: loading48,
    error: error48,
    data: data48,
  } = useQuery<TokenDataResponse>(TOKENS_BULK(parseInt(block48?.number), tokenAddresses), {
    client: apolloClient,
  })

  const {
    loading: loadingWeek,
    error: errorWeek,
    data: dataWeek,
  } = useQuery<TokenDataResponse>(TOKENS_BULK(parseInt(blockWeek?.number), tokenAddresses), {
    client: apolloClient,
  })

  const anyError = Boolean(error || error24 || error48 || blockError || errorWeek)
  const anyLoading = Boolean(loading || loading24 || loading48 || loadingWeek || !blocks)

  if (!ethPrices) {
    return {
      loading: true,
      error: false,
      data: undefined,
    }
  }

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: undefined,
    }
  }

  const parsed = data?.tokens
    ? data.tokens.reduce((accum: { [address: string]: TokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsed24 = data24?.tokens
    ? data24.tokens.reduce((accum: { [address: string]: TokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsed48 = data48?.tokens
    ? data48.tokens.reduce((accum: { [address: string]: TokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsedWeek = dataWeek?.tokens
    ? dataWeek.tokens.reduce((accum: { [address: string]: TokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}

  // format data and calculate daily changes
  const formatted = tokenAddresses.map((address) => {
    const current: TokenFields | undefined = parsed[address]
    const oneDay: TokenFields | undefined = parsed24[address]
    const twoDay: TokenFields | undefined = parsed48[address]
    const week: TokenFields | undefined = parsedWeek[address]

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
    const tvlUSD = current ? parseFloat(current.totalValueLockedUSD) : 0
    const tvlUSDChange = getPercentChange(current?.totalValueLockedUSD, oneDay?.totalValueLockedUSD)
    const tvlToken = current ? parseFloat(current.totalValueLocked) : 0
    const priceUSD = current ? parseFloat(current.derivedSYS) * ethPrices.current : 0
    const priceUSDOneDay = oneDay ? parseFloat(oneDay.derivedSYS) * ethPrices.oneDay : 0
    const priceUSDWeek = week ? parseFloat(week.derivedSYS) * ethPrices.week : 0
    const priceUSDChange =
      priceUSD && priceUSDOneDay ? getPercentChange(priceUSD.toString(), priceUSDOneDay.toString()) : 0

    const priceUSDChangeWeek =
      priceUSD && priceUSDWeek ? getPercentChange(priceUSD.toString(), priceUSDWeek.toString()) : 0
    const txCount =
      current && oneDay
        ? parseFloat(current.txCount) - parseFloat(oneDay.txCount)
        : current
        ? parseFloat(current.txCount)
        : 0
    const feesUSD =
      current && oneDay
        ? parseFloat(current.feesUSD) - parseFloat(oneDay.feesUSD)
        : current
        ? parseFloat(current.feesUSD)
        : 0

    return {
      exists: !!current,
      address,
      name: current?.name,
      symbol: current?.symbol,
      volumeUSD,
      volumeUSDChange,
      volumeUSDWeek,
      txCount,
      tvlUSD,
      feesUSD,
      tvlUSDChange,
      tvlToken,
      priceUSD,
      priceUSDChange,
      priceUSDChangeWeek,
    }
  })

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
