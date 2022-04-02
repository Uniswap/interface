import gql from 'graphql-tag'
import { ApolloClient, useQuery } from '@apollo/client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import moment from 'moment'
import React, { useCallback } from 'react'
import useInterval from 'hooks/useInterval'
import _, { isEqual } from 'lodash'
import { fetchBscTokenData, getDeltaTimestamps, INFO_CLIENT, useBnbPrices, useBscTokenDataHook } from './bscUtils'
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

type Block = {
  timestamp: string | number;
  block: number;
}
type BlockState = {
  latest?: Block;
  oneDay?: Block;
  twoDay?: Block;
}

type BlockAction = {
  payload: {
    data: Block;
  }
  type: "SET" | "UPDATE";
  key: 'latest' | 'oneDay' | 'twoDay';
}

function blockReducer  (state: BlockState, action: BlockAction) {
  switch(action.type) {
    case "SET":
    case "UPDATE": {
      return {
        ...state,
        [action.key]: action.payload.data
      }
    }
  }
}


export const useOneDayBlock = () => {
  const [state, dispatch] = React.useReducer(blockReducer, {
    oneDay: undefined, 
    latest: undefined, 
    twoDay: undefined
  })  

  const [t24, , , ] = getDeltaTimestamps()

  React.useEffect(() => {
    getBlockFromTimestamp(t24).then((block) => dispatch({type: "SET", key: "oneDay", payload: {data: block}}))
  }, [])

  return state?.oneDay
}
 
const BscTokenFields = `
  fragment TokenFields on Token {
    id
    name
    symbol
    tradeVolume
    tradeVolumeUSD
    untrackedVolumeUSD
    totalLiquidity
    totalTransactions
    derivedBNB
    derivedUSD
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
    ${TokenFields.replace('derivedETH', '').replace('txCount', '')}
    query tokens {
      tokens(where: {id:"${tokenAddress}"}) {
        ...TokenFields
        derivedUSD
        totalTransactions
        totalLiquidity
        derivedBNB
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
    ${TokenFields.replace('derivedETH', 'derivedBNB').replace('txCount', '')}
    query tokens {
      tokens(block: {number: ${block}} where: {id:"${tokenAddress}"}) {
        ...TokenFields
        derivedUSD
        totalTransactions
        totalLiquidity
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
    ${TokenFields.replace('derivedETH', '').replace('txCount', '')}
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
  const func = useCallback(async () => {
    if (address && ethPrice && ethPriceOld &&
      chainId === 1) {
      await getTokenData(address, ethPrice, ethPriceOld).then(setTokenData)
    } else if (address && chainId && chainId === 56 &&
      prices?.current && prices?.oneDay) {
      fetchBscTokenData(address, prices?.current, prices?.oneDay).then((data) => setTokenData({...data, priceUSD: data?.priceUSD ? data.priceUSD : data?.derivedUSD }))
    }
  }, [chainId, address, ethPrice, ethPriceOld, prices])
  React.useEffect(() => {
    if (!tokenData) func()
  }, [chainId, ethPriceOld, ethPrice, prices])
  useInterval(func, 30000, false);
  return tokenData
}

export const getTokenData = async (addy: string, ethPrice: any, ethPriceOld: any, blockOne?: number, blockTwo?:number) => {
  const utcCurrentTime = moment().utc()
  const utcOneDayBack = utcCurrentTime.subtract(24, 'hours').unix()
  const utcTwoDaysBack = utcCurrentTime.subtract(48, 'hours').unix()
  const address = addy?.toLowerCase()
  // initialize data arrays
  let data: Record<string, any> = {}
  let oneDayData: Record<string, any> = {}
  let twoDayData: Record<string, any> = {}
  let dayOneBlock: number;
  let dayTwoBlock: number;
  try {
    if (!blockOne && !blockTwo) {
     dayOneBlock = await getBlockFromTimestamp(utcOneDayBack);
     dayTwoBlock = await getBlockFromTimestamp(utcTwoDaysBack);
    } else {
      dayOneBlock = blockOne as number;
      dayTwoBlock = blockTwo as number;
    }
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
    data.priceUSD = (((+data?.derivedETH) * (+ethPrice ?? 0)))
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
    console.error(e)
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

export const BNB_USER_TRANSACTIONS = gql`
query transactions($user: String!) {
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
  swaps(orderBy: timestamp, orderDirection: desc, where: { from: $user }) {
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
`;
const USER_BNB_SELLS = gql`query sellTransactions ($user: Bytes!) { swaps(orderBy: timestamp, orderDirection: desc, where: { to: "0x10ed43c718714eb63d5aa57b78b54704e256024e", from: $user }) {
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
const TOP_TOKENS_BSC = gql`
query trackerdata {
  pairs(first: 20, orderBy: volumeUSD, orderDirection:desc,  where: {id_not_in:["0xa478c2975ab1ea89e8196811f51a7b7ade33eb11", "0x23fe4ee3bd9bfd1152993a7954298bb4d426698f", "0xe5ffe183ae47f1a0e4194618d34c5b05b98953a8", "0xf9c1fa7d41bf44ade1dd08d37cc68f67ae75bf92" , "0x382a9a8927f97f7489af3f0c202b23ed1eb772b5", "0xbb2b8038a1640196fbe3e38816f3e67cba72d940", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852", "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"]}) {
    id
    token0 {
      id
      totalLiquidity
      tradeVolume
      tradeVolumeUSD
      symbol
      name
    }
        token1 {
      id
      totalLiquidity
      tradeVolume
      tradeVolumeUSD
          symbol
          name
    }
    volumeToken0
    volumeToken1
    reserveUSD
    reserveBNB
    totalSupply
    token0Price
    token1Price
    totalTransactions
    untrackedVolumeUSD
    volumeUSD
  }
}
`

const TOP_TOKENS_QUERY = (tokenIds: string[]) => gql`
query trackerdata {
  tokens(orderBy: volumeUSD, orderDirection:desc,  where: {id_in:${tokenIds}}) {
    ...TokenFields
  }`


  
const TOP_TOKENS = gql`
query trackerdata {
  pairs(first: 12, orderBy: volumeUSD, orderDirection:desc,  where: {id_not_in:[
    "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11", 
    "0x23fe4ee3bd9bfd1152993a7954298bb4d426698f", 
    "0xe5ffe183ae47f1a0e4194618d34c5b05b98953a8", 
    "0xf9c1fa7d41bf44ade1dd08d37cc68f67ae75bf92" , 
    "0x002b931ef0edc4bf61cfa47e82d85fe3a6a31197",
    "0x382a9a8927f97f7489af3f0c202b23ed1eb772b5", 
    "0xbb2b8038a1640196fbe3e38816f3e67cba72d940",
    "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852", 
    "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"
  ]}) {
    id
    token0 {
      id
      totalSupply
      totalLiquidity
      tradeVolume
      tradeVolumeUSD
      symbol
      name
    }
        token1 {
      id
      totalSupply
      totalLiquidity
      tradeVolume
      tradeVolumeUSD
          symbol
          name
    }
    volumeToken0
    volumeToken1
    reserveUSD
    reserveETH
    totalSupply
    token0Price
    token1Price
    txCount
    liquidityProviderCount
    createdAtBlockNumber
    untrackedVolumeUSD
    volumeUSD
  }
}
`
const KIBA_TOKEN = gql`
query trackerdata {
  
  pairs(first:1 , where:{ token0:"0x4b2c54b80b77580dc02a0f6734d3bad733f50900"}) {
    id
    token0 {
      id
      totalSupply
      totalLiquidity
      tradeVolume
      tradeVolumeUSD
      symbol
      name
    }
        token1 {
      id
      totalSupply
      totalLiquidity
      tradeVolume
      tradeVolumeUSD
          symbol
          name
    }
    volumeToken0
    volumeToken1
    reserveUSD
    reserveETH
    totalSupply
    token0Price
    token1Price
    txCount
    liquidityProviderCount
    createdAtBlockNumber
    untrackedVolumeUSD
    volumeUSD
  }
}`

const KIBA_TOKEN_BSC =  gql`
query trackerdata {
  
  pairs(first:1 , where:{ token0_in:["0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341"]}) {
    id
    token0 {
      id
      derivedBNB
      derivedUSD
      totalTransactions
      totalLiquidity
      tradeVolume
      tradeVolumeUSD
      symbol
      name
    }
    token1 {
      id
      derivedBNB
      derivedUSD
      totalTransactions
      totalLiquidity
      tradeVolume
      tradeVolumeUSD
      symbol
      name
    }
    volumeToken0
    volumeToken1
    reserveUSD
    reserveBNB
    totalSupply
    token0Price
    token1Price
    untrackedVolumeUSD
    volumeUSD
  }
}`
export const useTopPairData = function ( ) {
  const {chainId } = useWeb3React()
  const tokenQuery = React.useMemo(() => chainId && chainId === 1 ? TOP_TOKENS : chainId === 56 ? TOP_TOKENS_BSC : TOP_TOKENS,[chainId])
  const kibaQuery = React.useMemo(() => chainId && chainId === 1 ? KIBA_TOKEN : chainId === 56 ?KIBA_TOKEN_BSC : KIBA_TOKEN, [chainId])
  const {data,loading,error} = useQuery(tokenQuery, {pollInterval: 60000, fetchPolicy :'cache-first'})
  const {data: kiba} = useQuery(kibaQuery, {pollInterval: 60000, fetchPolicy:'cache-first'})
  const allData = React.useMemo(() => {
    if (kiba && data) {
      return { pairs: kiba.pairs.concat(data.pairs) }
    }
    return data
  },[kiba, data])
  return {data: allData,loading,error}
}

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
  const secondPoller = useQuery(USER_BNB_SELLS, { variables: { user: account?.toLowerCase()}, pollInterval: 60000})
  if (chainId !== 1) poller.stopPolling();
  if (chainId !== 56) secondPoller.stopPolling()
  let data = null,loading = false,error = null;
  if (chainId === 1)
   {
     console.dir(poller)
     loading = poller.loading
     error = poller.error
     data = poller.data
   }
   else if (chainId === 56) {
     console.dir(secondPoller)
    loading = secondPoller.loading
    error = secondPoller.error
    data = secondPoller.data   }
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

  const bscQuery = useQuery(BNB_USER_TRANSACTIONS, {
    variables: {
      user: account ? account.toLowerCase() : ''
    }, 
    pollInterval: 60000
  })
  if (chainId !== 1) query.stopPolling()
  if (chainId !== 56) bscQuery.stopPolling();
  const { data, loading, error } = query;
  const {data: bscData, loading: bscLoading, error: bscError } = bscQuery;
  const mergedData = React.useMemo(() => {
    if (chainId === 1) {
    if (sells?.data?.swaps && data?.swaps) {
      const uniqueSwaps = _.uniqBy([
        ...data.swaps,
        ...sells.data.swaps
      ], swap => swap?.transaction?.id);
      data.swaps = _.orderBy(uniqueSwaps, swap => new Date(+swap.transaction.timestamp * 1000), 'desc');
    } 
    return data;
  } else if (chainId === 56 ){
    if (sells?.data?.swaps && bscData?.swaps) {
      const uniqueSwaps = _.uniqBy([
        ...bscData.swaps,
        ...sells.data.swaps
      ], swap => swap?.transaction?.id);
      bscData.swaps = _.orderBy(uniqueSwaps, swap => new Date(+swap.transaction.timestamp * 1000), 'desc');
    }
    return bscData;
  }
  }, [sells, data, bscData, chainId]) 

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