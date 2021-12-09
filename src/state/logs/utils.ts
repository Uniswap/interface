import gql from 'graphql-tag'
import { ApolloClient, useQuery } from '@apollo/client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import moment from 'moment'
import React from 'react'
import useInterval from 'hooks/useInterval'
import _, { isEqual } from 'lodash'
import { fetchBscTokenData, INFO_CLIENT, useBnbPrices } from './bscUtils'
import { useWeb3React } from '@web3-react/core'
import { useActiveWeb3React } from 'hooks/web3'
import { useKiba } from 'pages/Vote/VotePage'
import { Token, WETH9 } from '@uniswap/sdk-core'
import { useTokenBalance } from 'state/wallet/hooks'
export interface EventFilter {
  address?: string
  topics?: Array<string | Array<string> | null>
}

export interface Log {
  topics: Array<string>
  data: string
}

export const bscClient = new ApolloClient({
  uri: 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2',
  cache: new InMemoryCache() as any,
  defaultOptions: {
    watchQuery: {
      partialRefetch: true,
      returnPartialData: true
    }
  }
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

const BscTokenFields = `
  fragment TokenFields on Token {
    id
    name
    symbol
    derivedBNB
    tradeVolume
    tradeVolumeUSD
    untrackedVolumeUSD
    totalLiquidity
    totalTransactions
  } 
`

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
    ${isBnb ? BscTokenFields : TokenFields}
    query tokens {
      tokens(${block && block !== null && typeof (block) === 'string' ? `block : {number: ${block}}` : ``} where: {id:"${tokenAddress}"}) {
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

export const BSC_TOKEN_DATA = (tokenAddress: string, block?: string) => {
  const queryString = `
    ${TokenFields.replace('derivedETH', 'derivedBNB').replace('txCount', 'totalTransactions')}
    query tokens {
      tokens(where: {id:"${tokenAddress}"}) {
        ...TokenFields
      }
      pairs0: pairs(where: {token0: "${tokenAddress}"}, first: 2, orderBy: reserveUSD, orderDirection: desc){
        id
        name
      }
      pairs1: pairs(where: {token1: "${tokenAddress}"}, first: 2, orderBy: reserveUSD, orderDirection: desc){
        id
        name
      }
    }
  `
  return gql(queryString)
}

export const BSC_TOKEN_DATA_BY_BLOCK_ONE = (tokenAddress: string, block: string) => {
  const queryString = `
    ${TokenFields.replace('derivedETH', 'derivedBNB').replace('txCount', 'totalTransactions')}
    query tokens {
      tokens(block: {number: ${block}} where: {id:"${tokenAddress}"}) {
        ...TokenFields
      }
      pairs0: pairs(where: {token0: "${tokenAddress}"}, first: 2, orderBy: reserveUSD, orderDirection: desc){
        id
        name
      }
      pairs1: pairs(where: {token1: "${tokenAddress}"}, first: 2, orderBy: reserveUSD, orderDirection: desc){
        id
        name
      }
    }
  `
  return gql(queryString)
}

export const BSC_TOKEN_DATA_BY_BLOCK_TWO = (tokenAddress: string, block: string) => {
  const queryString = `
    ${TokenFields.replace('derivedETH', 'derivedBNB').replace('txCount', 'totalTransactions')}
    query tokens {
      tokens(block: {number: ${block}} where: {id:"${tokenAddress}"}) {
        ...TokenFields
      }
      pairs0: pairs(where: {token0: "${tokenAddress}"}, first: 2, orderBy: reserveUSD, orderDirection: desc){
        id
        name
      }
      pairs1: pairs(where: {token1: "${tokenAddress}"}, first: 2, orderBy: reserveUSD, orderDirection: desc){
        id
        name
      }
    }`
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


export const useTokenDataHook = function (address: any, ethPrice: any, ethPriceOld: any) {
  const { chainId } = useActiveWeb3React()
  const [tokenData, setTokenData] = React.useState<any>()
  const prices = useBnbPrices()
  const func = async () => {
    if (address && ethPrice && ethPriceOld &&
      chainId === 1) {
      await getTokenData(address, ethPrice, ethPriceOld).then(setTokenData)
    } else if (address && chainId && chainId === 56) {
      fetchBscTokenData('0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341', prices?.current, prices?.current).then(setTokenData)
    }
  }
  React.useEffect(() => {
    func()
  }, [chainId, ethPriceOld, ethPrice,])
  useInterval(func, 30000, false);
  return tokenData
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
      +data?.tradeVolumeUSD ?? 0,
      +oneDayData?.tradeVolumeUSD ?? 0,
      +twoDayData?.tradeVolumeUSD ?? 0
    )

    // calculate percentage changes and daily changes
    const [oneDayVolumeUT, volumeChangeUT] = get2DayPercentChange(
      +data?.untrackedVolumeUSD,
      +oneDayData?.untrackedVolumeUSD ?? 0,
      +twoDayData?.untrackedVolumeUSD ?? 0
    )

    // calculate percentage changes and daily changes
    const [oneDayTxns, txnChange] = get2DayPercentChange(
      +data?.txCount,
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
  const { chainId } = useWeb3React()
  const allPairsFormatted = usePairs(tokenAddress)
  const tokenTxns = useQuery(FILTERED_TRANSACTIONS, {
    variables: {
      allPairs: allPairsFormatted && Array.isArray(allPairsFormatted) && allPairsFormatted.length ? [allPairsFormatted[0].id] : []
    },
    pollInterval: 10000
  })

  React.useEffect(() => {
    if (chainId && chainId !== 1) {
      tokenTxns.stopPolling();
    }
  }, [chainId])
  const data = React.useMemo(() => tokenTxns, [tokenTxns])
  return { data: data.data, lastFetched: new Date(), loading: tokenTxns.loading };
}

const usePairs = (tokenAddress: string) => {
  const { data, loading, error } = useQuery(TOKEN_DATA(tokenAddress, null))
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
  const [tokenData, setTokenData] = React.useState<{ [address: string]: any }>({})
  const [ethPrice, ethPriceOld, ethPricePercent] = useEthPrice()
  const intervalCallback = () => {
    console.log(`Running interval driven data fetch..`)
    if (tokenAddress && ethPrice && ethPriceOld) {
      console.log(`Have necessary parameters, checking for updates..`)
      getTokenData(tokenAddress, ethPrice, ethPriceOld).then((data) => {
        if (!isEqual(tokenData?.[tokenAddress]?.priceUSD, data?.priceUSD)) {
          console.log("updating token data, price changed.")
          setTokenData({ ...tokenData, [tokenAddress]: data })
        }
      })
    }
  }
  useInterval(intervalCallback, interval, false)
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
          name
        }
        token1 {
          id
          symbol
          name
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
          name
          id
        }
        token1 {
          symbol
          name
          id
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
          name
          id
        }
        token1 {
          symbol
          name
          id
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

const USER_SELLS = gql`query sellTransactions ($user: Bytes!) { swaps(orderBy: timestamp, orderDirection: desc, where: { to: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", from: $user }) {
  id
  transaction {
    id
    timestamp
  }
  pair {
    token0 {
      symbol
      name
      id
    }
    token1 {
      symbol
      name
      id
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
}`

export const useUserSells = (account?: string | null) => {
  const { chainId } = useWeb3React()
  const poller = useQuery(USER_SELLS, { variables: { user: account }, pollInterval: 15000 })
  if (chainId !== 56) poller.stopPolling();
  const { data, loading, error } = poller;
  return { data, loading, error }
}

export const useTotalReflections = (account?: string | null, tokenAddress?: string | null) => {
  const { chainId } = useWeb3React()
  const userTransactions = useUserTransactions(account)
  const tokenData = useTokenData(tokenAddress as string)

  const [totalBought, setTotalBought] = React.useState<number | undefined>()
  const [totalSold, setTotalSold] = React.useState<number | undefined>()
  const [totalGained, setTotalGained] = React.useState<number | undefined>()

  const token = React.useMemo(() => !tokenData || !tokenAddress ? null : new Token(1, tokenAddress as string, 9, tokenData.symbol, tokenData.name), [tokenData, tokenAddress])
  const balance = useTokenBalance(account as string, token as Token)
  const userTxs = React.useMemo(() => !userTransactions?.data ?
    [] :
    userTransactions.data?.swaps?.filter((swap: any) => {
      return [
        tokenAddress?.toLowerCase(),
        WETH9[1].address
      ].includes(swap?.pair?.token0?.id) &&
        [
          tokenAddress?.toLowerCase(),
          WETH9[1].address?.toLowerCase()
        ].includes(swap?.pair?.token1?.id?.toLowerCase())
    }), [userTransactions])

  const userBuys = React.useMemo(() => userTxs?.filter((swap: any) => {
    return swap?.pair?.token0?.id?.toLowerCase() == tokenAddress?.toLowerCase()
  }), [userTxs])

  const userSells = React.useMemo(() => userTxs?.filter((swap: any) => {
    return swap?.pair?.token0?.id?.toLowerCase() == WETH9[1].address?.toLowerCase()
  }), [userTxs])

  React.useEffect(() => {
    if (chainId && account && userTransactions.data && tokenAddress && userSells && userBuys && balance) {
      // sum the sold amount
      const sumSold = _.sumBy(userSells, (swap: any) => parseFloat(swap.amount0Out))
      setTotalSold(sumSold);
      // sum the bought amount
      const sumBought = _.sumBy(userBuys, (swap: any) => parseFloat(swap.amount0In))
      setTotalBought(sumBought);
      // current balance
      const currentBalance = +balance?.toFixed(0);
      // calculate the total gained on reflections
      const tG = currentBalance - (sumBought) - (sumSold);
      setTotalGained(tG)
    }
  }, [
    account,
    userTransactions.data,
    chainId,
    balance,
    userSells,
    userBuys,
    userTxs,
    tokenAddress
  ])

  return React.useMemo(() => ({
    loading: userTransactions.loading,
    error: userTransactions.error,
    totalGained,
    totalSold,
    totalBought,
    balance
  }), [
    userTransactions.error,
    userTransactions.loading,
    userTransactions.data,
    tokenAddress,
    totalGained,
    balance,
    totalSold,
    totalBought
  ])
}


export const useTotalKibaGains = (account?: string | null) => {
  const { chainId } = useWeb3React()
  const [totalBought, setTotalBought] = React.useState<number | undefined>()
  const [totalSold, setTotalSold] = React.useState<number | undefined>()
  const [totalGained, setTotalGained] = React.useState<number | undefined>()
  const userTransactions = useUserTransactions(account)
  const kibaBalance = useKiba(account)

  React.useEffect(() => {
    if (chainId && userTransactions &&
      userTransactions.data && kibaBalance && +kibaBalance.toFixed(0) > 0) {
      const userTxs = userTransactions.data?.swaps?.filter((swap: any) => {
        return ['KIBA', 'WETH'].includes(swap?.pair?.token0?.symbol) && ['KIBA', 'WETH'].includes(swap?.pair?.token1?.symbol)
      })
      const userBuys = userTxs.filter((swap: any) => swap?.pair?.token0?.symbol == 'KIBA')
      const userSells = userTxs.filter((swap: any) => swap?.pair?.token0?.symbol == 'WETH')

      const sumSold = _.sumBy(userSells, (swap: any) => parseFloat(swap.amount0Out))
      setTotalSold(sumSold);
      const sumBought = _.sumBy(userBuys, (swap: any) => parseFloat(swap.amount0In))
      setTotalBought(sumBought);
      console.log(sumSold, sumBought)
      const currentBalance = +kibaBalance?.toFixed(0);
      const totalGained = currentBalance + (sumSold - sumBought);
      const tG = +(kibaBalance).toFixed(0) - (sumBought) - (sumSold);
      setTotalGained(tG)
    }
  }, [userTransactions.data, chainId, kibaBalance])

  return React.useMemo(() => ({ totalGained, totalSold, totalBought }), [totalGained, totalSold, totalBought])
}

export const useUserTransactions = (account?: string | null) => {
  const { chainId } = useWeb3React()
  const sells = useUserSells(account)
  const query = useQuery(USER_TRANSACTIONS, {
    variables: {
      user: account ? account : ''
    },
    pollInterval: 15000
  })
  if (chainId !== 56) query.stopPolling();
  const { data, loading, error } = query;

  const mergedData = React.useMemo(() => {
    if (sells?.data?.swaps && data?.swaps) {
      const uniqueSwaps = _.uniqBy([
        ...data.swaps,
        ...sells.data.swaps
      ], swap => swap?.transaction?.id);
      data.swaps = _.orderBy(uniqueSwaps, swap => new Date(+swap.transaction.timestamp * 1000), 'desc');
    }
    return data;
  }, [sells, data])

  return { data: mergedData, loading: sells.loading || loading, error }
}

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
          name
          symbol
        }
        token1 {
          id
          symbol
          name
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
          name
        }
        token1 {
          id
          symbol
          name
        }
      }
      sender
      liquidity
      amount0
      amount1
      amountUSD
    }
    swaps(first: 250, orderBy: timestamp, orderDirection: desc, where: { pair_in: $allPairs }) {
      id
      transaction {
        id
        timestamp
      }
      pair {
        token0 {
          symbol
          name
          id
        }
        token1 {
          symbol
          name
          id
        }
      }
      amount0In
      amount0Out
      amount1In
      amount1Out
      amountUSD
      to
      sender
      from
    }
  }
`