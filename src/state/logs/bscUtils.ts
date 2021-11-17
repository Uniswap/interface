import { request, gql } from 'graphql-request'
import moment from 'moment'
import React, { useCallback } from 'react'
import { subDays, subWeeks, startOfMinute } from 'date-fns'
import { get2DayPercentChange, getPercentChange, TOKEN_DATA } from './utils'
import { isEqual } from 'lodash'
import useInterval from 'hooks/useInterval'
import { useWeb3React } from '@web3-react/core';

export const INFO_CLIENT = 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2'
export const BITQUERY_CLIENT ='https://graphql.bitquery.io';

export interface BnbPrices {
    current: number
    oneDay: number
    twoDay: number
    week: number
  }

  const BINANCE_TRADES = gql`
    ethereum(network: bsc) {
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
      })
      return {
        error: false,
        bnbPrices: {
          current: parseFloat(data.current?.bnbPrice ?? '0'),
          oneDay: parseFloat(data.oneDay?.bnbPrice ?? '0'),
          twoDay: parseFloat(data.twoDay?.bnbPrice ?? '0'),
          week: parseFloat(data.oneWeek?.bnbPrice ?? '0'),
        },
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
    return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${
      timestamp + 600
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
      blocksQueryConstructor,
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
  
    return {
      blocks,
      error,
    }
  }
  
  /**
   * Returns BNB prices at current, 24h, 48h, and 7d intervals
   */
  export const useBnbPrices = (): BnbPrices | undefined => {
    const [prices, setPrices] =  React.useState<BnbPrices | undefined>()
    const [error, setError] =  React.useState(false)
  
    const [t24, t48, tWeek] = getDeltaTimestamps()
    const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48, tWeek])
  
    React.useEffect(() => {
      const fetch = async () => {
          if (blocks ) {
        const [block24, block48, blockWeek] = blocks
        const { bnbPrices, error: fetchError } = await fetchBnbPrices(block24.number, block48.number, blockWeek.number)
        if (fetchError) {
          setError(true)
        } else {
          setPrices(bnbPrices)
        }
    }
      }
      if (!prices && !error && blocks && !blockError) {
        fetch()
      }
    }, [error, prices, blocks, blockError])
  
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
    return {...swap, type: 'swap'}
  }


export const getBscTokenData = async (addy: string, ethPrice: any, ethPriceOld: any) => {
    const utcCurrentTime = moment().utc()
    const utcOneDayBack = utcCurrentTime.subtract(24, 'hours').unix()
    const utcTwoDaysBack = utcCurrentTime.subtract(48, 'hours').unix()
    const address = addy?.toLowerCase()
    // initialize data arrays
    let data: Record<string, any> = {}
    let oneDayData: Record<string, any> = {}
    let twoDayData: Record<string, any> = {}
  
    try {
  
      const dayOneBlock = await getBlocksFromTimestamps([utcOneDayBack]);
      const dayTwoBlock = await getBlocksFromTimestamps([utcTwoDaysBack]);
      console.log(dayOneBlock, dayTwoBlock)
      // fetch all current and historical data
      const result = await request(INFO_CLIENT,TOKEN_DATA(address, null, true));
      data = result?.tokens?.[0]
  
      // get results from 24 hours in past
      const oneDayResult = await request(INFO_CLIENT, TOKEN_DATA(address, dayOneBlock[0]?.number?.toString(), true))
      oneDayData = oneDayResult?.tokens[0]
  
      // get results from 48 hours in past
      const twoDayResult = await request(INFO_CLIENT, TOKEN_DATA(address, dayTwoBlock[0]?.number?.toString(), true));
      twoDayData = twoDayResult?.tokens[0]
  
      console.log(oneDayData,twoDayData,data)

      // catch the case where token wasnt in top list in previous days
      if (!oneDayData) {
        const oneDayResult = await request(INFO_CLIENT, TOKEN_DATA(address, dayOneBlock[0]?.number?.toString(), true))
        oneDayData = oneDayResult?.tokens[0]
      }
  
      let oneDayHistory = oneDayData?.[addy]
      let twoDayHistory = twoDayData?.[addy]
      // catch the case where token wasnt in top list in previous days
      if (!oneDayHistory) {
        const oneDayResult = await request(INFO_CLIENT, TOKEN_DATA(addy, dayOneBlock[0]?.number?.toString(), true))
  
        oneDayHistory = oneDayResult?.tokens[0]
      }
      if (!twoDayHistory) {
        const twoDayResult = await request(INFO_CLIENT,TOKEN_DATA(addy, dayTwoBlock[0]?.number?.toString(), true));
        twoDayHistory = twoDayResult?.tokens[0]
      }
      if (!twoDayData) {
        const twoDayResult = await request(INFO_CLIENT, TOKEN_DATA(address, dayTwoBlock[0]?.number?.toString(), true))
        twoDayData = twoDayResult?.tokens[0]
      }
  
      // calculate percentage changes and daily changes
      const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
        +data['tradeVolumeUSD'] ?? 0,
        +oneDayData['tradeVolumeUSD'] ?? 0,
        +twoDayData['tradeVolumeUSD'] ?? 0
      )
  
      console.log(data)
      // calculate percentage changes and daily changes
      const [oneDayVolumeUT, volumeChangeUT] = get2DayPercentChange(
        +data.untrackedVolumeUSD,
        +oneDayData?.untrackedVolumeUSD ?? 0,
        +twoDayData?.untrackedVolumeUSD ?? 0
      )
  
      // calculate percentage changes and daily changes
      const [oneDayTxns, txnChange] = get2DayPercentChange(
        +data.totalTransactions,
        +oneDayData?.totalTransactions ?? 0,
        +twoDayData?.totalTransactions ?? 0
      )
  
      const priceChangeUSD = getPercentChange(
        +data?.derivedBNB * (+ethPrice),
        oneDayData?.derivedBNB ? +oneDayData?.derivedBNB * +ethPriceOld : 0
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
  
      // new tokens
      if (!oneDayData && data) {
        data.oneDayVolumeUSD = data.tradeVolumeUSD
        data.oneDayVolumeETH = data.tradeVolume * data.derivedBNB
        data.oneDayTxns = data.totalTransactions
      }
    } catch (e) {
      console.log(e)
    }
    return data
  }


/**
 * Data to display transaction table on Token page
 */
const TOKEN_TRANSACTIONS = gql`
query tokenTransactions($address: Bytes!) {
    swaps(first: 200, orderBy: timestamp, orderDirection: desc, where: {token0: $address}) {
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
  const data = await request<TransactionResults>(INFO_CLIENT, TOKEN_TRANSACTIONS, {
    address,
  })

  return { data, error: false }
} catch (error) {
  console.error(`Failed to fetch transactions for token ${address}`, error)
  return {
    error: true,
  }
}
}


export function useBscTokenTransactions(tokenAddress: string, interval: null | number = null) {
    const [state, updateTokenTxns] = React.useState<any>({})
    const {chainId} = useWeb3React()
    const tokenTxns = state?.[tokenAddress]
  
    async function checkForTxns() {
        if (chainId === 56) {
        const transactions = await fetchTokenTransactions(tokenAddress)
        console.log(transactions)
        if (isEqual(transactions, tokenTxns?.txns) === false) {
          console.log("Updating transaction data...")
          console.log(transactions)
          console.log("Time since last fetch, " + moment(new Date()).diff(moment(tokenTxns?.lastFetched), 'seconds') + " seconds");
          updateTokenTxns({ ...state, [tokenAddress]: { txns: transactions, lastFetched: new Date() } })
        }
    }
    }
  
    React.useEffect(() => {
        if (chainId === 56) {
          checkForTxns();
        }
    }, [tokenAddress, chainId, tokenTxns, interval])
  
    useInterval(checkForTxns, interval, false)
    const { txns: data, lastFetched } = React.useMemo(() => tokenTxns ? tokenTxns : { txns: [], lastFetched: undefined }, [tokenTxns, tokenAddress])
    return { data: data.data, lastFetched };
  }
  
  

  /* eslint-disable no-param-reassign */

  
  /**
 * Transactions of the given pool, used on Pool page
 */
const POOL_TRANSACTIONS = gql`
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
    const data = await request<TransactionResults>(INFO_CLIENT, POOL_TRANSACTIONS, {
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