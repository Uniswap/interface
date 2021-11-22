import gql from 'graphql-tag'
import { ApolloClient, useQuery } from '@apollo/client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'
import moment from 'moment'
import React from 'react'
import useInterval from 'hooks/useInterval'
import _, { isEqual } from 'lodash'
import { request } from 'graphql-request'
import { INFO_CLIENT } from './bscUtils'
import { useWeb3React  } from '@web3-react/core'
export interface EventFilter {
  address?: string
  topics?: Array<string | Array<string> | null>
}

export interface Log {
  topics: Array<string>
  data: string
}

export const bscClient = new ApolloClient({
  uri: INFO_CLIENT,
  cache: new InMemoryCache() as any
});

export const client = new ApolloClient({
 
    uri: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2',
  cache: new InMemoryCache() as any
})

export const blockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
  cache: new InMemoryCache() as any
})


/**
 * Converts a filter to the corresponding string key
 * @param filter the filter to convert
 */
export function filterToKey(filter: EventFilter): string {
  return `${filter.address ?? ''}:${filter.topics?.map((topic) => (topic ? (Array.isArray(topic) ? topic.join(';') : topic) : '\0'))?.join('-') ?? ''
    }`
}


const TokenFields = `
  fragment TokenFields on Token {
    id
    name
    symbol
    derivedETH
    tradeVolume
    tradeVolumeUSD
    untrackedVolumeUSD
    totalLiquidity
    txCount
  } 
`
export const TOKEN_DATA = (tokenAddress: string, block: any, isBnb?: boolean) => {
  const queryString = `
    ${isBnb ? TokenFields.replace('derivedETH', 'derivedBNB').replace('txCount', 'totalTransactions') : TokenFields}
    query tokens {
      tokens(${block && block !== null && typeof(block) === 'string' ? `block : {number: ${block}}` : ``} where: {id:"${tokenAddress}"}) {
        ...TokenFields
      }
      pairs0: pairs(where: {token0: "${tokenAddress}"}, first: 2, orderBy: reserveUSD, orderDirection: desc){
        id
      }
      pairs1: pairs(where: {token1: "${tokenAddress}"}, first: 2, orderBy: reserveUSD, orderDirection: desc){
        id
      }
    }
  `
  return gql(queryString)
}

export const get2DayPercentChange = (valueNow: any, value24HoursAgo: any, value48HoursAgo: any) => {
  // get volume info for both 24 hour periods
  const currentChange = parseFloat(valueNow) - parseFloat(value24HoursAgo)
  const previousChange = parseFloat(value24HoursAgo) - parseFloat(value48HoursAgo)

  const adjustedPercentChange = ((currentChange - previousChange) / (previousChange)) * 100

  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return [currentChange, 0]
  }
  return [currentChange, adjustedPercentChange]
}

export const getPercentChange = (valueNow: any, value24HoursAgo: any) => {
  const adjustedPercentChange =
    ((parseFloat(valueNow) - parseFloat(value24HoursAgo)) / parseFloat(value24HoursAgo)) * 100
  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return 0
  }
  return adjustedPercentChange
}



export const GET_BLOCK = gql`
  query blocks($timestampFrom: Int!, $timestampTo: Int!) {
    blocks(
      first: 1
      orderBy: timestamp
      orderDirection: asc
      where: { timestamp_gt: $timestampFrom, timestamp_lt: $timestampTo }
    ) {
      id
      number
      timestamp
    }
  }
`

export async function getBlockFromTimestamp(timestamp: number) {
  const result = await blockClient.query({
    query: GET_BLOCK,
    variables: {
      timestampFrom: timestamp,
      timestampTo: timestamp + 600,
    },
    fetchPolicy: 'network-only',
  })
  return result?.data?.blocks?.[0]?.number
}

export const getTokenData = async (addy: string, ethPrice: any, ethPriceOld: any) => {
  const utcCurrentTime = moment().utc()
  const utcOneDayBack = utcCurrentTime.subtract(24, 'hours').unix()
  const utcTwoDaysBack = utcCurrentTime.subtract(48, 'hours').unix()
  const address = addy?.toLowerCase()
  // initialize data arrays
  let data: Record<string, any> = {}
  let oneDayData: Record<string, any> = {}
  let twoDayData: Record<string, any> = {}

  try {

    const dayOneBlock = await getBlockFromTimestamp(utcOneDayBack);
    const dayTwoBlock = await getBlockFromTimestamp(utcTwoDaysBack);
    // fetch all current and historical data
    const result = await client.query({
      query: TOKEN_DATA(address, null),
      fetchPolicy: 'network-only',
    })
    data = result?.data?.tokens?.[0]

    // get results from 24 hours in past
    const oneDayResult = await client.query({
      query: TOKEN_DATA(address, dayOneBlock),
      fetchPolicy: 'network-only',
    })
    oneDayData = oneDayResult.data.tokens[0]

    // get results from 48 hours in past
    const twoDayResult = await client.query({
      query: TOKEN_DATA(address, dayTwoBlock),
      fetchPolicy: 'cache-first',
    })
    twoDayData = twoDayResult.data.tokens[0]

    // catch the case where token wasnt in top list in previous days
    if (!oneDayData) {
      const oneDayResult = await client.query({
        query: TOKEN_DATA(address, dayOneBlock),
        fetchPolicy: 'cache-first',
      })
      oneDayData = oneDayResult.data.tokens[0]
    }

    let oneDayHistory = oneDayData?.[addy]
    let twoDayHistory = twoDayData?.[addy]
    // catch the case where token wasnt in top list in previous days
    if (!oneDayHistory) {
      const oneDayResult = await client.query({
        query: TOKEN_DATA(addy, dayOneBlock),
        fetchPolicy: 'cache-first',
      })
      oneDayHistory = oneDayResult.data.tokens[0]
    }
    if (!twoDayHistory) {
      const twoDayResult = await client.query({
        query: TOKEN_DATA(addy, dayTwoBlock),
        fetchPolicy: 'cache-first',
      })
      twoDayHistory = twoDayResult.data.tokens[0]
    }
    if (!twoDayData) {
      const twoDayResult = await client.query({
        query: TOKEN_DATA(address, {}),
        fetchPolicy: 'cache-first',
      })
      twoDayData = twoDayResult.data.tokens[0]
    }

    // calculate percentage changes and daily changes
    const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
      +data['tradeVolumeUSD'] ?? 0,
      +oneDayData['tradeVolumeUSD'] ?? 0,
      +twoDayData['tradeVolumeUSD'] ?? 0
    )

    // calculate percentage changes and daily changes
    const [oneDayVolumeUT, volumeChangeUT] = get2DayPercentChange(
      +data.untrackedVolumeUSD,
      +oneDayData?.untrackedVolumeUSD ?? 0,
      +twoDayData?.untrackedVolumeUSD ?? 0
    )

    // calculate percentage changes and daily changes
    const [oneDayTxns, txnChange] = get2DayPercentChange(
      +data.txCount,
      +oneDayData?.txCount ?? 0,
      +twoDayData?.txCount ?? 0
    )

    const priceChangeUSD = getPercentChange(
      +data?.derivedETH * (+ethPrice),
      oneDayData?.derivedETH ? +oneDayData?.derivedETH * +ethPriceOld : 0
    )

    const currentLiquidityUSD = +data?.totalLiquidity * +ethPrice * +data?.derivedETH
    const oldLiquidityUSD = +oneDayData?.totalLiquidity * +ethPriceOld * +oneDayData?.derivedETH

    // set data
    data.priceUSD = (((+data?.derivedETH) * (+ethPrice)))
    data.totalLiquidityUSD = currentLiquidityUSD
    data.oneDayVolumeUSD = oneDayVolumeUSD
    data.volumeChangeUSD = volumeChangeUSD
    data.priceChangeUSD = priceChangeUSD
    data.oneDayVolumeUT = oneDayVolumeUT
    data.volumeChangeUT = volumeChangeUT
    const liquidityChangeUSD = getPercentChange(+currentLiquidityUSD ?? 0, +oldLiquidityUSD ?? 0)
    data.liquidityChangeUSD = liquidityChangeUSD
    data.oneDayTxns = oneDayTxns
    data.txnChange = txnChange
    data.oneDayData = oneDayData?.[address]
    data.twoDayData = twoDayData?.[address]

    // new tokens
    if (!oneDayData && data) {
      data.oneDayVolumeUSD = data.tradeVolumeUSD
      data.oneDayVolumeETH = data.tradeVolume * data.derivedETH
      data.oneDayTxns = data.txCount
    }
  } catch (e) {
    console.log(e)
  }
  return data
}

const getTokenTransactions = async (allPairsFormatted: any) => {
  const transactions: { mints?: any[]; burns?: any[]; swaps?: any[]; } = {}
  try {
    const result = await client.query({
      query: FILTERED_TRANSACTIONS,
      variables: {
        allPairs: allPairsFormatted,
      },
      fetchPolicy: 'network-only',
    })
    transactions.mints = result.data.mints
    transactions.burns = result.data.burns
    transactions.swaps = result.data.swaps
  } catch (e) {
    console.log(e)
  }
  return transactions
}

export function useTokenTransactions(tokenAddress: string, interval: null | number = null) {
  const allPairsFormatted = usePairs(tokenAddress)
  const tokenTxns = useQuery(FILTERED_TRANSACTIONS, {
    variables: {
      allPairs: allPairsFormatted ? [allPairsFormatted[0].id] : []
    },
    pollInterval: 2500
  })
  const data = React.useMemo(() => tokenTxns, [tokenTxns])
  return { data: data.data, lastFetched: new Date() };
}

const usePairs = (tokenAddress: string) => {
  const {data,loading,error} = useQuery(TOKEN_DATA(tokenAddress, null))
  return data?.['pairs0'].concat(data?.['pairs1'])
}

export const ETH_PRICE = (block?: any) => {
  const queryString = block
    ? `
    query bundles {
      bundles(where: { id: 1 } block: {number: ${block}}) {
        id
        ethPrice
      }
    }
  `
    : ` query bundles {
      bundles(where: { id: 1 }) {
        id
        ethPrice
      }
    }
  `
  return gql(queryString)
}
export function useEthPrice() {
  const [state, setState] = React.useState<{ ethPrice?: number | string, ethPriceOld?: number | string, ethPercentChange?: number | string }>({})
  const ethPrice = state?.ethPrice
  const ethPriceOld = state?.ethPriceOld;
  const ethPercentChange = state?.ethPercentChange
  React.useEffect(() => {
    async function checkForEthPrice() {
      if (!ethPrice) {
        const [ethPriceFetched, ethPriceOld, ethPercentChange] = await getEthPrice()
        setState({ ethPrice: ethPriceFetched, ethPriceOld: ethPriceOld, ethPercentChange: ethPercentChange })
      }
    }
    checkForEthPrice()
  }, [ethPrice])

  return [ethPrice, ethPriceOld, ethPercentChange]
}

/**
 * Gets the current price  of ETH, 24 hour price, and % change between them
 */
const getEthPrice = async () => {
  const utcCurrentTime = moment().utc()
  const timestamp = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()

  let ethPrice = 0
  let ethPriceOneDay = 0
  let priceChangeETH = 0

  try {
    const oneDayBlock = await getBlockFromTimestamp(timestamp);
    const result = await client.query({
      query: ETH_PRICE(),
      fetchPolicy: 'network-only',
    })
    const resultOneDay = await client.query({
      query: ETH_PRICE(oneDayBlock),
      fetchPolicy: 'network-only',
    })

    const currentPrice = +result?.data?.bundles[0]?.ethPrice
    const oldPrice = +resultOneDay?.data?.bundles[0]?.ethPrice
    ethPrice = currentPrice
    ethPriceOneDay = oldPrice
    priceChangeETH = getPercentChange(+ethPrice, +ethPriceOneDay)
  } catch (e) {
    console.error(e)
  }

  return [ethPrice, ethPriceOneDay, priceChangeETH]
}
export function useTokenData(tokenAddress: string, interval: null | number = null) {
  const [tokenData, setTokenData] = React.useState<{ [address: string]: any }>({

  })
  const [ethPrice, ethPriceOld, ethPricePercent] = useEthPrice()
  const intervalCallback = () => {
    console.log(`Running interval driven data fetch..`)
    if(tokenAddress && ethPrice && ethPriceOld) {
      console.log(`Have necessary parameters, checking for updates..`)
      getTokenData(tokenAddress, ethPrice, ethPriceOld).then((data) => {
        if (!isEqual(tokenData?.[tokenAddress]?.priceUSD, data?.priceUSD)) {
          console.log("updating token data, price changed.")
          setTokenData({ ...tokenData, [tokenAddress]: data })
        }
      })
    }
  }
  // React.useEffect(() => {
  //   if (!tokenData?.[tokenAddress] && tokenAddress && ethPrice && ethPriceOld) {
  //     getTokenData(tokenAddress, ethPrice, ethPriceOld).then((data) => {
  //       setTokenData({ ...tokenData, [tokenAddress]: data })
  //     })
  //   } else if (tokenData?.[tokenAddress] && tokenAddress && ethPrice && ethPriceOld) {  
  //     getTokenData(tokenAddress, ethPrice, ethPriceOld).then((data) => {
  //       if (!isEqual(tokenData?.[tokenAddress]?.priceUSD, data?.priceUSD)) {
  //         console.log("updating token data, price changed.")
  //         setTokenData({ ...tokenData, [tokenAddress]: data })
  //       }
  //     })
  //   }
  // }, [tokenAddress, tokenData, ethPrice, ethPriceOld])
  useInterval(intervalCallback, interval, false)
  if (!tokenAddress) return {}
  return tokenData?.[tokenAddress] || {}
}
/**
 * Convert a filter key to the corresponding filter
 * @param key key to convert
 */
export function keyToFilter(key: string): EventFilter {
  const pcs = key.split(':')
  const address = pcs[0]
  const topics = pcs[1].split('-').map((topic) => {
    const parts = topic.split(';')
    if (parts.length === 1) return parts[0]
    return parts
  })

  return {
    address: address.length === 0 ? undefined : address,
    topics,
  }
}


export const USER_TRANSACTIONS = gql`
  query transactions($user: Bytes!) {
    mints(orderBy: timestamp, orderDirection: desc, where: { to: $user }) {
      id
      transaction {
        id
        timestamp
      }
      pair {
        id
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      to
      liquidity
      amount0
      amount1
      amountUSD
    }
    burns(orderBy: timestamp, orderDirection: desc, where: { sender: $user }) {
      id
      transaction {
        id
        timestamp
      }
      pair {
        id
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
      sender
      to
      liquidity
      amount0
      amount1
      amountUSD
    }
    swaps(orderBy: timestamp, orderDirection: desc, where: { to: $user, from: $user}) {
      id
      transaction {
        id
        timestamp
      }
      pair {
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
      amount0In
      amount0Out
      amount1In
      amount1Out
      amountUSD
      to
    }
  }
`

export const FILTERED_TRANSACTIONS = gql`
  query ($allPairs: [Bytes]!) {
    mints(first: 5, where: { pair_in: $allPairs }, orderBy: timestamp, orderDirection: desc) {
      transaction {
        id
        timestamp
      }
      pair {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      to
      liquidity
      amount0
      amount1
      amountUSD
    }
    burns(first: 5, where: { pair_in: $allPairs }, orderBy: timestamp, orderDirection: desc) {
      transaction {
        id
        timestamp
      }
      pair {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      sender
      liquidity
      amount0
      amount1
      amountUSD
    }
    swaps(first: 200, where: { pair_in: $allPairs }, orderBy: timestamp, orderDirection: desc) {
      transaction {
        id
        timestamp
      }
      id
      pair {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      amount0In
      amount0Out
      amount1In
      amount1Out
      amountUSD
      to
      from
      sender
    }
  }
`