import gql from 'graphql-tag'
import { ApolloClient, useQuery } from '@apollo/client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import moment from 'moment'
import React, { useCallback } from 'react'
import useInterval from 'hooks/useInterval'
import _, { isEqual } from 'lodash'
import { fetchBscTokenData, getDeltaTimestamps, INFO_CLIENT, useBlocksFromTimestamps, useBnbPrices, useBscTokenDataHook } from './bscUtils'
import { useWeb3React } from '@web3-react/core'
import { useActiveWeb3React } from 'hooks/web3'
import { useKiba } from 'pages/Vote/VotePage'
import { Token, WETH9 } from '@uniswap/sdk-core'
import { useTokenBalance } from 'state/wallet/hooks'
import { binanceTokens } from 'utils/binance.tokens'
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

function blockReducer(state: BlockState, action: BlockAction) {
  switch (action.type) {
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

  const [t24, , ,] = getDeltaTimestamps()

  React.useEffect(() => {
    getBlockFromTimestamp(t24).then((block) => dispatch({ type: "SET", key: "oneDay", payload: { data: block } }))
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
    fetchPolicy: 'cache-first',
  })
  return result?.data?.blocks?.[0]?.number
}


export const useTokenDataHook = function (address: any, ethPrice: any, ethPriceOld: any) {
  const { chainId } = useActiveWeb3React()
  const [tokenData, setTokenData] = React.useState<any>()
  const prices = useBnbPrices()
  const [t24h, t48h] = getDeltaTimestamps()
  const blocks = useBlocksFromTimestamps([t24h, t48h])
  const func = useCallback(async () => {
    if (address && ethPrice && ethPriceOld && blocks?.blocks &&
      chainId === 1) {
      await getTokenData(address, ethPrice, ethPriceOld).then(setTokenData)
    } else if (address && chainId === 56 && blocks?.blocks &&
      prices?.current && prices?.oneDay) {
      fetchBscTokenData(address, prices?.current, prices?.oneDay).then((data) => setTokenData({ ...data, priceUSD: data?.priceUSD ? data.priceUSD : data?.derivedUSD }))
    }
  }, [chainId, address, blocks, ethPrice, ethPriceOld, prices])

  React.useEffect(() => {
    let cancelled = false;
    if (!tokenData && !cancelled) func()
    return () => {
      cancelled = true;
    }
  }, [chainId, ethPriceOld, blocks, address, ethPrice, prices])
  useInterval(func, 30000, false);
  return tokenData
}

export const getTokenData = async (addy: string, ethPrice: any, ethPriceOld: any, blockOne?: number, blockTwo?: number) => {
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
    const [result, oneDayResult, twoDayResult] = await Promise.all(
      [
        client.query({
          query: TOKEN_DATA(address, null),
          fetchPolicy: 'network-only',
        }),
        client.query({
          query: TOKEN_DATA(address, dayOneBlock),
          fetchPolicy: 'cache-first',
        }),
        client.query({
          query: TOKEN_DATA(address, dayTwoBlock),
          fetchPolicy: 'cache-first',
        })
      ]
    );

    data = result?.data?.tokens[0]
    oneDayData = oneDayResult?.data?.tokens[0]
    twoDayData = twoDayResult?.data?.tokens[0]
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
    data.priceUSD = (((parseFloat(data?.derivedETH)) * (parseFloat(ethPrice))))
    data.totalLiquidityUSD = currentLiquidityUSD
    data.oneDayVolumeUSD = oneDayVolumeUSD
    data.volumeChangeUSD = volumeChangeUSD
    data.priceChangeUSD = priceChangeUSD
    data.oneDayVolumeUT = oneDayVolumeUT
    data.volumeChangeUT = volumeChangeUT
    const liquidityChangeUSD = getPercentChange(
      parseFloat(currentLiquidityUSD.toString() ?? '0'),
      parseFloat(oldLiquidityUSD.toString() ?? '0')
    );
    data.liquidityChangeUSD = liquidityChangeUSD
    data.oneDayTxns = oneDayTxns
    data.txnChange = txnChange

    data.oneDayData = oneDayData
    data.twoDayData = twoDayData

    // new tokens
    if (!oneDayData && data) {
      data.oneDayVolumeUSD = parseFloat(data.tradeVolumeUSD)
      data.oneDayVolumeETH = parseFloat(data.tradeVolume) * parseFloat(data.derivedETH)
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
      fetchPolicy: 'cache-first',
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
    if (!chainId) return;
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
      fetchPolicy: 'cache-first',
    })
    const resultOneDay = await client.query({
      query: ETH_PRICE(oneDayBlock),
      fetchPolicy: 'cache-first',
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
  
  pairs(first:2, where:{ token0_in:["0x4b2c54b80b77580dc02a0f6734d3bad733f50900", "0x612e1726435fe38dd49a0b35b4065b56f49c8f11"]}) {
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

const KIBA_TOKEN_BSC = gql`
query trackerdata {
  
  pairs(first:2 , where:{ token0_in:["0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341", "0x612e1726435fe38dd49a0b35b4065b56f49c8f11"]}) {
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

export const useKibaPairData = function () {
  const { chainId } = useWeb3React()
  const kibaQuery = React.useMemo(() => {
    if (chainId && chainId === 1) return KIBA_TOKEN
    if (chainId === 56) return KIBA_TOKEN_BSC
    return KIBA_TOKEN
  }, [chainId])
  const { data: kiba, loading, error } = useQuery(kibaQuery,
    {
      pollInterval: 60000,
      fetchPolicy: 'cache-first'
    })
  return { data: kiba, loading, error }
}
export const useTopPairData = function () {
  const { chainId } = useWeb3React()
  const tokenQuery = React.useMemo(() => {
    if (chainId && chainId === 1) return TOP_TOKENS
    if (chainId === 56) return TOP_TOKENS_BSC
    return TOP_TOKENS
  }, [chainId])
  const { data, loading, error } = useQuery(tokenQuery,
    {
      pollInterval: 60000,
      fetchPolicy: 'cache-first'
    })
  return { data, loading, error }
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
  const poller = useQuery(USER_SELLS, { variables: { user: account }, pollInterval: 60000 })
  const secondPoller = useQuery(USER_BNB_SELLS, { variables: { user: account?.toLowerCase() }, pollInterval: 60000 })
  if (chainId !== 1) poller.stopPolling();
  if (chainId !== 56) secondPoller.stopPolling()
  let data = null,
    loading = false,
    error = null;
  if (chainId === 1) {
    loading = poller.loading
    error = poller.error
    data = poller.data
  }
  else if (chainId === 56) {
    loading = secondPoller.loading
    error = secondPoller.error
    data = secondPoller.data
  }
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
  const currencySold = React.useMemo(() => {
    if (chainId === 1 || !chainId) return WETH9[1].address?.toLowerCase()
    if (chainId === 56) return binanceTokens.wbnb.address.toLowerCase()
    return ''
  }, [chainId])
  const userTxs = React.useMemo(() => !userTransactions?.data ?
    [] :
    userTransactions.data?.swaps?.filter((swap: any) => {
      return [
        tokenAddress?.toLowerCase(),
        currencySold
      ].includes(swap?.pair?.token0?.id) &&
        [
          tokenAddress?.toLowerCase(),
          currencySold
        ].includes(swap?.pair?.token1?.id?.toLowerCase())
    }), [userTransactions, currencySold])

  const userBuys = React.useMemo(() => userTxs?.filter((swap: any) => {
    return swap?.pair?.token0?.id?.toLowerCase() == tokenAddress?.toLowerCase()
  }), [userTxs])

  const userSells = React.useMemo(() => userTxs?.filter((swap: any) => {
    return swap?.pair?.token0?.id?.toLowerCase() == (chainId === 56 ? binanceTokens.wbnb.address?.toLowerCase() : WETH9[1].address?.toLowerCase())
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

type BscTransaction = {
  blockHash: string
  blockNumber: string
  confirmations: string
  contractAddress: string
  cumulativeGasUsed: string
  from: string
  gas: string
  gasPrice: string
  gasUsed: string
  hash: string
  input: string
  nonce: string
  timeStamp: string
  to: string
  tokenDecimal: string
  tokenName: string
  tokenSymbol: string
  transactionIndex: string
  value: string
}


export const useTotalKibaGains = (account ?: string | null) => {
  const { chainId } = useWeb3React()
  const [totalBought, setTotalBought] = React.useState<number | undefined>()
  const [totalSold, setTotalSold] = React.useState<number | undefined>()
  const [totalGained, setTotalGained] = React.useState<number | undefined>()
  const userTransactions = useUserTransactions(account)
  const kibaBalance = useKiba(account)
  const currencySold = React.useMemo(() => {
    if (chainId === 1) return { address: '0x4b2c54b80b77580dc02a0f6734d3bad733f50900'.toLowerCase(), symbol: 'KIBA' }
    if (chainId === 56) return { address: '0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341'.toLowerCase(), symbol: 'KIBA' }

    return { address: '', symbol: '' }
  }, [chainId])
  const currencyBought = React.useMemo(() => {
    if (chainId === 1) return { address: WETH9[1].address.toLowerCase(), symbol: 'WETH' }
    if (chainId === 56) return { address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'.toLowerCase(), symbol: 'WBNB' }
    return { address: '', symbol: '' }
  }, [chainId])

  const [airdroppedAmount, setAirdroppedAmount] = React.useState<number>(0)
  const transferAPIurl = React.useMemo(() => {
    if (!account || !chainId) return '';
    if (chainId === 56) return `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341&address=${account}&page=1&offset=10000&startblock=0&endblock=999999999&sort=asc&apikey=G5GE5FR37HCTS1UZ957PRB9DYUBGV4SU75`
    if (chainId === 1) return `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=0x4b2c54b80b77580dc02a0f6734d3bad733f50900&address=${account}&page=1&offest=10000&startblock=0&endblock=999999999&sort=asc&apikey=2SIRTH18CHU6HM22AGRF1XE9M7AKDR9PM7`
    return ''
  }, [chainId, account])

  React.useEffect(( ) => setAllTransfers(undefined), [chainId, account])
  const [allTransfers, setAllTransfers] = React.useState<BscTransaction[]>()
  const [isLoading, setIsLoading] = React.useState(false)
  React.useEffect(() => {
    if (account && !allTransfers &&
        !isLoading) {
      setIsLoading(true)
      fetch(`${transferAPIurl}`, { method: "GET" })
        .then((response) => response.json())
        .then((data) => {

          const incomingTransfers = (data.result.filter((transaction: BscTransaction) =>
            transaction.to?.toLowerCase() == account?.toLowerCase()
          )).map((a:BscTransaction) => ({...a, type: 'incoming'}));
          
          const outgoingTransfers = (data.result.filter((transaction: BscTransaction) =>
            transaction.from?.toLowerCase() == account?.toLowerCase()
          )).map((a:BscTransaction) => ({...a, type: 'outgoing'}))

          setAllTransfers(outgoingTransfers.concat(incomingTransfers))

          let airdroppedAmount = 0,
              incoming = 0 , 
              outgoing = 0 ;
          
          incomingTransfers.forEach((airdrop: BscTransaction) => incoming += parseFloat(airdrop.value) / 10 ** 9);
          outgoingTransfers.forEach((airdrop: BscTransaction) => outgoing += parseFloat(airdrop.value) / 10 ** 9);
          airdroppedAmount = incoming;
          setAirdroppedAmount(airdroppedAmount)
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false))
    }
  }, [chainId, account, allTransfers, isLoading])

  React.useEffect(() => {
    if (chainId && userTransactions &&
      userTransactions.data && kibaBalance && +kibaBalance.toFixed(0) > 0 && 
      allTransfers) {
      const userTxs = userTransactions.data?.swaps?.filter((swap: any) => {
        const { token0, token1 } = swap.pair;
        return [currencyBought.address, currencySold.address].includes(token0.id?.toLowerCase()) && [currencyBought.address, currencySold.address].includes(token1?.id?.toLowerCase()) &&
                !allTransfers.some(item => item.hash == swap.transaction.id)
      })
      const userBuys = userTxs.filter((swap: any) => parseFloat(swap?.amount1Out) > 0)
      const userSells = userTxs.filter((swap: any) => parseFloat(swap?.amount1In) > 0)
      const sumSold = _.sumBy(userSells, (swap: any) => parseFloat(swap.amount0Out) - parseFloat(swap.amount0In))
      setTotalSold(sumSold);
      const sumBought = _.sumBy(userBuys, (swap: any) => parseFloat(swap.amount0In))
      setTotalBought(sumBought);
      const currentBalance = +kibaBalance?.toFixed(0);
      // from their current balance, how much was transferred in to them?
      let tG = (currentBalance - airdroppedAmount);
          // then, how much was bought?
          tG = tG - sumBought;

      // that gives us the remainder to finish the calculation
      setTotalGained(tG)
    }
  }, [
    userTransactions.data, 
    account, 
    allTransfers,
    currencyBought, 
    airdroppedAmount, 
    chainId, 
    kibaBalance, 
    currencySold])

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
  const { data: bscData, loading: bscLoading, error: bscError } = bscQuery;
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
    } else if (chainId === 56) {
      if (sells?.data?.swaps && bscData?.swaps) {
        const uniqueSwaps = _.uniqBy([
          ...bscData.swaps,
          ...sells.data.swaps
        ], swap => swap?.transaction?.id);
        bscData.swaps = _.orderBy(uniqueSwaps, swap => new Date(+swap.transaction.timestamp * 1000), 'desc');
      }
      return bscData;
    }
  }, [sells?.data, data, bscData, chainId])

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