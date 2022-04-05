import { rawRequest, request } from 'graphql-request'
import gql from 'graphql-tag'
import moment from 'moment'
import React, { useCallback } from 'react'
import { subDays, subWeeks, startOfMinute } from 'date-fns'
import { bscClient, BSC_TOKEN_DATA, BSC_TOKEN_DATA_BY_BLOCK_ONE, BSC_TOKEN_DATA_BY_BLOCK_TWO, get2DayPercentChange, getPercentChange, TOKEN_DATA } from './utils'
import { isEqual } from 'lodash'
import useInterval from 'hooks/useInterval'
import { useWeb3React } from '@web3-react/core';
import { useQuery } from '@apollo/client'
import { useBlockNumber } from 'state/application/hooks'
export const INFO_CLIENT = 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2'
export const BITQUERY_CLIENT = 'https://graphql.bitquery.io';

export interface BnbPrices {
  current: number
  oneDay: number
  twoDay: number
  week: number
}

const BINANCE_TRADES = gql`
  query trades {  ethereum(network: bsc) {
      dexTrades(options: {limit: 100, desc: "block.timestamp.unixtime"},
        exchangeName: {in: ["Pancake","Pancake v2"]},
      baseCurrency: {is: "0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341"}) {
        transaction {
          hash
          __typename
        }
        smartContract{
          address{
            address
          }
          contractType
          currency{
            name
          }
        }
        tradeIndex
        date {
          date
        }
        block {
          height
          timestamp {unixtime}
        }
        buyAmount
        buyAmountInUsd: buyAmount(in: USD)
        buyCurrency {
          symbol
          address
        }
        sellAmount
        sellAmountInUsd: sellAmount(in: USD)
        sellCurrency {
          symbol
          address
        }
        sellAmountInUsd: sellAmount(in: USD)
        tradeAmount(in: USD)
        transaction{
          gasValue
          gasPrice
          gas
        }
      }
    }
  }
`

const BNB_PRICES = gql`
    query prices($block24: Int!, $block48: Int!, $blockWeek: Int!) {
      current: bundle(id: "1") {
        bnbPrice
      }
      oneDay: bundle(id: "1", block: { number: $block24 }) {
        bnbPrice
      }
      twoDay: bundle(id: "1", block: { number: $block48 }) {
        bnbPrice
      }
      oneWeek: bundle(id: "1", block: { number: $blockWeek }) {
        bnbPrice
      }
    }
  `

interface PricesResponse {
  current: {
    bnbPrice: string
  }
  oneDay: {
    bnbPrice: string
  }
  twoDay: {
    bnbPrice: string
  }
  oneWeek: {
    bnbPrice: string
  }
}

const POOL_TRANSACTIONS = gql`
  query poolTransactions($address: Bytes!) {
   
    swaps(first: 200, orderBy: timestamp, orderDirection: desc, where: { pair: $address }) {
      id
      timestamp
      transaction {
        id
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
      from
      amount0In
      amount1In
      amount0Out
      amount1Out
      amountUSD
    }
   
  }
`

interface TransactionResults {
  mints: any[]
  swaps: any[]
  burns: any[]
}

const fetchPoolTransactions = async (address: string): Promise<{ data?: any[]; error: boolean }> => {
  try {
    const data = await request<TransactionResults>(INFO_CLIENT, POOL_TRANSACTIONS, {
      address: '0x89e8c0ead11b783055282c9acebbaf2fe95d1180',
    })
    const mints = data.mints.map(mapMints)
    const burns = data.burns.map(mapBurns)
    const swaps = data.swaps.map(mapSwaps)
    return { data: [...mints, ...burns, ...swaps], error: false }
  } catch (error) {
    console.error(`Failed to fetch transactions for pool ${address}`, error)
    return {
      error: true,
    }
  }
}

const fetchBnbPrices = async (
  block24: number,
  block48: number,
  blockWeek: number,
): Promise<{ bnbPrices: BnbPrices | undefined; error: boolean }> => {
  try {
    const data = await request<PricesResponse>(INFO_CLIENT, BNB_PRICES, {
      block24,
      block48,
      blockWeek,
    }).catch(err => console.error("ERROR", err))

    return {
      error: false,
      bnbPrices: data && data ? {
        current: parseFloat(data.current?.bnbPrice ?? '0'),
        oneDay: parseFloat(data.oneDay?.bnbPrice ?? '0'),
        twoDay: parseFloat(data.twoDay?.bnbPrice ?? '0'),
        week: parseFloat(data.oneWeek?.bnbPrice ?? '0'),
      } : undefined,
    }
  } catch (error) {
    console.error('Failed to fetch BNB prices', error)
    return {
      error: true,
      bnbPrices: undefined,
    }
  }
}

const getUnixTime = (date: Date) => moment(date).unix()
export const getDeltaTimestamps = (): [number, number, number, number] => {
  const utcCurrentTime = getUnixTime(new Date()) * 1000
  const t24h = getUnixTime(startOfMinute(subDays(utcCurrentTime, 1)))
  const t48h = getUnixTime(startOfMinute(subDays(utcCurrentTime, 2)))
  const t7d = getUnixTime(startOfMinute(subWeeks(utcCurrentTime, 1)))
  const t14d = getUnixTime(startOfMinute(subWeeks(utcCurrentTime, 2)))
  return [t24h, t48h, t7d, t14d]
}

export const BLOCKS_CLIENT = 'https://api.thegraph.com/subgraphs/name/pancakeswap/blocks'

const getBlockSubqueries = (timestamps: number[]) =>
  timestamps.map((timestamp) => {
    return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${timestamp + 600
      } }) {
      number
    }`
  })

const blocksQueryConstructor = (subqueries: string[]) => {
  return gql`query blocks {
    ${subqueries}
  }`
}

/**
 * Helper function to get large amount GraphQL subqueries
 * @param queryConstructor constructor function that combines subqueries
 * @param subqueries individual queries
 * @param endpoint GraphQL endpoint
 * @param skipCount how many subqueries to fire at a time
 * @returns
 */
export const multiQuery = async (
  queryConstructor: (subqueries: string[]) => string,
  subqueries: string[],
  endpoint: string,
  skipCount = 1000,
) => {
  let fetchedData = {}
  let allFound = false
  let skip = 0
  try {
    while (!allFound) {
      let end = subqueries.length
      if (skip + skipCount < subqueries.length) {
        end = skip + skipCount
      }
      const subqueriesSlice = subqueries.slice(skip, end)
      // eslint-disable-next-line no-await-in-loop
      const result = await request(endpoint, queryConstructor(subqueriesSlice))
      fetchedData = {
        ...fetchedData,
        ...result,
      }
      allFound = Object.keys(result).length < skipCount || skip + skipCount > subqueries.length
      skip += skipCount
    }
    return fetchedData
  } catch (error) {
    console.error('Failed to fetch info data', error)
    return null
  }
}

/**
 * @notice Fetches block objects for an array of timestamps.
 * @param {Array} timestamps
 */
export const getBlocksFromTimestamps = async (
  timestamps: number[],
  sortDirection: 'asc' | 'desc' = 'desc',
  skipCount = 500,
): Promise<any[]> => {
  if (timestamps?.length === 0) {
    return []
  }

  const fetchedData: any = await multiQuery(
    blocksQueryConstructor as any,
    getBlockSubqueries(timestamps),
    BLOCKS_CLIENT,
    skipCount,
  )

  const sortingFunction =
    sortDirection === 'desc' ? (a: any, b: any) => b.number - a.number : (a: any, b: any) => a.number - b.number

  const blocks: any[] = []
  if (fetchedData) {
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(fetchedData)) {
      if (fetchedData[key].length > 0) {
        blocks.push({
          timestamp: key.split('t')[1],
          number: parseInt(fetchedData[key][0].number, 10),
        })
      }
    }
    // graphql-request does not guarantee same ordering of batched requests subqueries, hence manual sorting
    blocks.sort(sortingFunction)
  }
  return blocks
}
/**
 * for a given array of timestamps, returns block entities
 * @param timestamps
 * @param sortDirection
 * @param skipCount
 */
export const useBlocksFromTimestamps = (
  timestamps: number[],
  sortDirection: 'asc' | 'desc' = 'desc',
  skipCount = 1000,
): {
  blocks?: any[]
  error: boolean
} => {
  const [blocks, setBlocks] = React.useState<any[]>()

  const [error, setError] = React.useState(false)

  const timestampsString = JSON.stringify(timestamps)
  const blocksString = blocks ? JSON.stringify(blocks) : undefined

  React.useEffect(() => {
    const fetchData = async () => {
      const timestampsArray = JSON.parse(timestampsString)
      const result = await getBlocksFromTimestamps(timestampsArray, sortDirection, skipCount)

      if (result.length === 0) {
        setError(true)
      } else {
        setBlocks(result)
      }
    }
    const blocksArray = blocksString ? JSON.parse(blocksString) : undefined
    if (!blocksArray && !error) {
      fetchData()
    }
  }, [blocksString, error, skipCount, sortDirection, timestampsString])

  return React.useMemo(() => ({
    blocks,
    error,
  }), [blocks, error])
}

/**
 * Returns BNB prices at current, 24h, 48h, and 7d intervals
 */
export const useBnbPrices = (): BnbPrices | undefined => {
  const [prices, setPrices] = React.useState<BnbPrices | undefined>()
  const fetch = React.useCallback(async () => {
    const res = await window.fetch('https://api.pancakeswap.info/api/v2/tokens/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', { method: "GET" })
    const data = await res.json()
    setPrices({
      current: +data.data.price,
      oneDay: 0,
      twoDay: 0,
      week: 0
    });
  }, [prices])

  useInterval(fetch, 60000, true)
  return prices
}
export const mapMints = (mint: any) => {
  return {
    type: 'mint',
    hash: mint.id.split('-')[0],
    timestamp: mint.timestamp,
    sender: mint.to,
    token0Symbol: mint.pair.token0.symbol,
    token1Symbol: mint.pair.token1.symbol,
    token0Address: mint.pair.token0.id,
    token1Address: mint.pair.token1.id,
    amountUSD: parseFloat(mint.amountUSD),
    amountToken0: parseFloat(mint.amount0),
    amountToken1: parseFloat(mint.amount1),
  }
}

export const mapBurns = (burn: any) => {
  return {
    type: 'burn',
    hash: burn.id.split('-')[0],
    timestamp: burn.timestamp,
    sender: burn.sender,
    token0Symbol: burn.pair.token0.symbol,
    token1Symbol: burn.pair.token1.symbol,
    token0Address: burn.pair.token0.id,
    token1Address: burn.pair.token1.id,
    amountUSD: parseFloat(burn.amountUSD),
    amountToken0: parseFloat(burn.amount0),
    amountToken1: parseFloat(burn.amount1),
  }
}

export const mapSwaps = (swap: any) => {
  return { ...swap, type: 'swap' }
}

export const useBscTokenData = (addy: any, price: any, price1: any) => {
  return useBscTokenDataHook(addy, price, price1)
}

export const useBscTokenDataHook = (addy: string, ethPrice: any, ethPriceOld: any) => {
  const address = addy?.toLowerCase()
  const utcCurrentTime = moment().utc()
  const [isPolling, setIsPolling] = React.useState(false)
  const utcOneDayBack = utcCurrentTime.subtract(1, 'day').unix()
  const utcTwoDaysBack = utcCurrentTime.subtract(2, 'days').unix()
  const payload = useBlocksFromTimestamps([utcOneDayBack, utcTwoDaysBack])
 
  const QUERY_ONE = BSC_TOKEN_DATA(address)
  const QUERY_TWO = BSC_TOKEN_DATA_BY_BLOCK_ONE(address, payload.blocks?.[0]?.number?.toString())
  const QUERY_THREE = BSC_TOKEN_DATA_BY_BLOCK_TWO(address, (payload.blocks?.[1]?.number?.toString()));

  // initialize data arrays
  const queryOne = useQuery(QUERY_ONE, {  fetchPolicy: 'network-only' });
  const queryTwo = useQuery(QUERY_TWO, { fetchPolicy: 'network-only' });
  const queryThree = useQuery(QUERY_THREE, { fetchPolicy: 'network-only' });

  const one = React.useMemo(() => queryOne.data, [queryOne.data]);
  const two = React.useMemo(() => queryTwo.data, [queryTwo.data]);
  const three = React.useMemo(() => queryThree.data, [queryThree.data]);
  const { chainId } = useWeb3React();

  if (chainId && chainId !== 56) {
    queryOne.stopPolling();
    queryTwo.stopPolling();
    queryThree.stopPolling();
    setIsPolling(false)
  } else if (chainId && 
    chainId === 56 && 
    !isPolling && 
    queryOne.data && 
    queryTwo.data && 
    queryThree.data) {
    setIsPolling(true)
    queryOne.startPolling(15000)
    queryTwo.startPolling(15000);
    queryThree.startPolling(15000)
  }

  const data = one?.tokens[0];
  if (data) data.id = 1;

  const oneDayData = two?.tokens[0];
  if (oneDayData) oneDayData.id = 2;

  const twoDayData = three?.tokens[0];
  if (twoDayData) twoDayData.id = 3;

  try {
    if (data && oneDayData && twoDayData && payload.blocks?.length &&
      [data, oneDayData, twoDayData].every(item => ![data, oneDayData, twoDayData].filter(a => a.id !== item.id).some(b => b.totalTransactions.toString() === item.totalTransactions.toString()))) {
      // calculate percentage changes and daily changes
      const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
        +data?.tradeVolumeUSD ?? 0,
        +oneDayData['tradeVolumeUSD'] ?? 0,
        +twoDayData['tradeVolumeUSD'] ?? 0
      )

      // calculate percentage changes and daily changes
      const [oneDayVolumeUT, volumeChangeUT] = get2DayPercentChange(
        +data?.untrackedVolumeUSD,
        +oneDayData?.untrackedVolumeUSD ?? 0,
        +twoDayData?.untrackedVolumeUSD ?? 0
      )

      // calculate percentage changes and daily changes
      const [oneDayTxns, txnChange] = get2DayPercentChange(
        +data?.totalTransactions,
        +oneDayData?.totalTransactions ?? 0,
        +twoDayData?.totalTransactions ?? 0
      )

      const priceChangeUSD = getPercentChange(
        +data?.derivedBNB * (+ethPrice),
        +oneDayData?.derivedBNB ? +oneDayData?.derivedBNB * +ethPrice : 0
      )

      const currentLiquidityUSD = +data?.totalLiquidity * +ethPrice * +data?.derivedBNB
      const oldLiquidityUSD = +oneDayData?.totalLiquidity * +ethPriceOld * +oneDayData?.derivedBNB

      // set data
      data.txCount = +data.totalTransactions
      data.priceUSD = (((+data?.derivedBNB) * (+ethPrice)))
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
      data.isBSC = true;
      // new tokens
      if (!oneDayData && data) {
        data.oneDayVolumeUSD = data?.tradeVolumeUSD
        data.oneDayVolumeETH = +data?.tradeVolume * +data?.derivedBNB
        data.oneDayTxns = data?.totalTransactions
      }
    }
  } catch (e) {
    console.error(e)
  }
  return data
}


export const fetchBscTokenData = async (addy: string, ethPrice: any, ethPriceOld: any) => {
  const address = addy?.toLowerCase()
  const utcCurrentTime = moment().utc()
  
  const utcOneDayBack = utcCurrentTime.subtract(1, 'day').unix()
  const utcTwoDaysBack = utcCurrentTime.subtract(2, 'days').unix()
 
  const QUERY_ONE = BSC_TOKEN_DATA(address)

  // initialize data arrays
  const queryOne = await request(INFO_CLIENT, QUERY_ONE)

  const one =  queryOne.data
  const data = one?.tokens[0];


  try {
    if (data
      ) {
      // calculate percentage changes and daily changes
      const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
        +data?.tradeVolumeUSD ?? 0,
         0,
         0
      )

      // calculate percentage changes and daily changes
      const [oneDayVolumeUT, volumeChangeUT] = get2DayPercentChange(
        +data?.untrackedVolumeUSD,
         0,
         0
      )

      // calculate percentage changes and daily changes
      const [oneDayTxns, txnChange] = get2DayPercentChange(
        +data?.totalTransactions,
        0,
         0
      )

      const priceChangeUSD = getPercentChange(
        +data?.derivedBNB * (+ethPrice),
        0
      )

      const currentLiquidityUSD = +data?.totalLiquidity * +ethPrice * +data?.derivedBNB
      const oldLiquidityUSD = 0

      // set data
      data.txCount = +data.totalTransactions
      data.priceUSD = (((+data?.derivedBNB) * (+ethPrice)))
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
      data.oneDayData = undefined
      data.twoDayData = undefined
      data.isBSC = true;
      // new tokens
      if (data) {
        data.oneDayVolumeUSD = data?.tradeVolumeUSD
        data.oneDayVolumeETH = +data?.tradeVolume * +data?.derivedBNB
        data.oneDayTxns = data?.totalTransactions
      }
    }
  } catch (e) {
    console.error(e)
  }
  return data
}



/**
 * Data to display transaction table on Token page
 */
const TOKEN_TRANSACTIONS = gql`
query tokenTransactions($address: Bytes!) {
    swaps(first: 200, orderBy: timestamp, orderDirection: desc, where: {token0: $address }) {
      id
      timestamp
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
      from
      to
      sender
      amount0In
      amount1In
      amount0Out
      amount1Out
      amountUSD
    }
  }
`

interface TransactionResults {
  mintsAs0: any[]
  mintsAs1: any[]
  swapsAs0: any[]
  swapsAs1: any[]
  burnsAs0: any[]
  burnsAs1: any[]
}

const fetchTokenTransactions = async (address: string): Promise<{ data?: any; error: boolean }> => {
  try {
    console.log("Fetching token transactions")

    const data = await request<TransactionResults>(INFO_CLIENT, TOKEN_TRANSACTIONS, {
      address
    }).catch(console.error)
    console.log("Got token transactions")

    return { data, error: false }
  } catch (error) {
    console.error(`Failed to fetch transactions for token ${address}`, error)
    return {
      error: true,
    }
  }
}


export function useBscTokenTransactions(tokenAddress: string, interval: null | number = null) {
  const { chainId } = useWeb3React()
  const query = useQuery(TOKEN_TRANSACTIONS, {
    variables: {
      address: tokenAddress
    },
    pollInterval: 5000
  })
  if (chainId && chainId !== 56) query.stopPolling();
  return React.useMemo(() => ({ data: query.data, lastFetched: new Date() }), [query]);
}

/* eslint-disable no-param-reassign */


/**
* Transactions of the given pool, used on Pool page
*/
const BSC_POOL_TRANSACTIONS = gql`
  query poolTransactions($address: Bytes!) {
    mints(first: 5, orderBy: timestamp, orderDirection: desc, where: { pair_in: $address }) {
      id
      timestamp
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
      amount0
      amount1
      amountUSD
    }
    swaps(first: 200, where: { pair: $address }, orderBy: timestamp, orderDirection: asc) {
      id
      timestamp
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
      from
      amount0In
      amount1In
      amount0Out
      amount1Out
      amountUSD
    }
    burns(first: 5, orderBy: timestamp, orderDirection: desc, where: { pair_in: $address }) {
      id
      timestamp
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
      amount0
      amount1
      amountUSD
    }
  }
`

interface TransactionResults {
  mints: any[]
  swaps: any[]
  burns: any[]
}

const fetchBscPoolTransactions = async (address: string): Promise<{ data?: any; error: boolean }> => {
  try {
    const data = await request<TransactionResults>(INFO_CLIENT, BSC_POOL_TRANSACTIONS, {
      address
    })
    const mints = data.mints.map(mapMints)
    const burns = data.burns.map(mapBurns)
    const swaps = data.swaps.map(mapSwaps)
    return {
      data:
      {
        swaps: [...mints, ...burns, ...swaps].filter(a => a.type === 'swap'),
        lastFetched: new Date()
      },
      error: false
    }
  } catch (error) {
    console.error(`Failed to fetch transactions for pool ${address}`, error)
    return {
      error: true,
    }
  }
}

export default fetchBscPoolTransactions