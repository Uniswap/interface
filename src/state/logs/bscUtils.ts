import { BSC_TOKEN_DATA, BSC_TOKEN_DATA_BY_BLOCK_ONE, BSC_TOKEN_DATA_BY_BLOCK_TWO, TOKEN_DATA, bscClient, get2DayPercentChange, getBlockFromTimestamp, getPercentChange, toChecksum } from './utils'
import { startOfMinute, subDays, subWeeks } from 'date-fns'

import React, { } from 'react'
import _ from 'lodash'
import gql from 'graphql-tag'
import moment from 'moment'
import { request } from 'graphql-request'
import { useActiveWeb3React } from 'hooks/web3'
import useInterval from 'hooks/useInterval'
import { useQuery } from '@apollo/client'
import { useWeb3React } from '@web3-react/core';

export const INFO_CLIENT = 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2'
export const BITQUERY_CLIENT = 'https://graphql.bitquery.io';

export interface BnbPrices {
    current: number
    oneDay: number
    twoDay: number
    week: number
}


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

interface TransactionResults {
    mints: any[]
    swaps: any[]
    burns: any[]
}

const BIT_QUERY_CLIENT = 'https://graphql.bitquery.io';



export const fetchBscHolders = async (address: string) => {
    const holders = 0
    return holders
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

// const getBlockSubqueries = (timestamps: number[]) =>
//   timestamps?.map((timestamp) => {
//     return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${timestamp + 600
//       } }) {
//       number
//     }`
//   })

// const blocksQueryConstructor = (subqueries: string[]) => {
//   return gql`query Blocks {
//     ${subqueries}
//   }`
// }

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
        (args: any) => '',
        [],
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
    const { chainId } = useWeb3React()


    React.useEffect(() => {
        // refetch blocks on network switch
        setBlocks(undefined)
    }, [chainId])

    React.useEffect(() => {
        const fetchData = async () => {
            if (!blocks?.length) {
                const timestampsArray = JSON.parse(timestampsString)
                if (chainId === 1 || !chainId) {
                    const result1 = await getBlockFromTimestamp(timestampsArray[0])
                    const result2 = await getBlockFromTimestamp(timestampsArray[1]);
                    setBlocks([result1, result2])
                } else if (chainId === 56) {
                    const result = await getBlocksFromTimestamps(timestampsArray, sortDirection, skipCount)
                    if (result.length === 0) {
                        setError(true)
                    } else {
                        setBlocks(result)
                    }
                }
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
    const [data, setData] = React.useState<any>()
    const [ttl, setTtl] = React.useState<number>(-1)
    React.useEffect(() => {
        if (!data || ttl < new Date().valueOf()) {
            fetch('https://api1.binance.com/api/v3/ticker/price?symbol=BNBUSDT')
                .then((res) => res.json())
                .then((response) => {
                    setData(response.price)
                })
        }
    }, [data])
    return {
        current: data,
        oneDay: data,
        twoDay: data,
        week: data
    }
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
    const queryOne = useQuery(QUERY_ONE, { fetchPolicy: 'network-only', client: bscClient });
    const queryTwo = useQuery(QUERY_TWO, { fetchPolicy: 'cache-first', client: bscClient });
    const queryThree = useQuery(QUERY_THREE, { fetchPolicy: 'cache-first', client: bscClient });

    const one = React.useMemo(() => queryOne.data, [queryOne.data]);
    const two = React.useMemo(() => queryTwo.data, [queryTwo.data]);
    const three = React.useMemo(() => queryThree.data, [queryThree.data]);
    const { chainId } = useWeb3React();

    if (!address || chainId && chainId !== 56) {
        queryOne.stopPolling();
        setIsPolling(false)
        return undefined;
    } else if (
        chainId &&
        chainId === 56 &&
        !isPolling &&
        queryOne.data &&
        queryTwo.data &&
        queryThree.data) {
        setIsPolling(true)
        queryOne.startPolling(5000)
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
                +data?.derivedBNB * (parseFloat(ethPrice)),
                +oneDayData?.derivedBNB ? +oneDayData?.derivedBNB * parseFloat(ethPriceOld) : 0
            )

            const currentLiquidityUSD = parseFloat(data?.totalLiquidity) * parseFloat(ethPrice) * +data?.derivedBNB
            const oldLiquidityUSD = parseFloat(oneDayData?.totalLiquidity) * parseFloat(ethPriceOld) * parseFloat(oneDayData?.derivedBNB)

            // set data
            data.txCount = +data?.totalTransactions
            data.priceUSD = (((parseFloat(data?.derivedBNB) * parseFloat(ethPrice))))
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
    if (!data?.priceUSD && data?.derivedUSD) {
        data.priceUSD = data.derivedUSD
    }
    return data
}


export const fetchBscTokenData = async (addy: string, ethPrice: any, ethPriceOld: any, blockOne?: number, blockTwo?: number) => {
    const address = addy?.toLowerCase()
    const [t24h, t48h, ,] = getDeltaTimestamps()
    let blocks: any[] = [];
    if (blockOne && blockTwo) {
        blocks = [{ number: blockOne }, { number: blockTwo }]
    } else {
        blocks = await getBlocksFromTimestamps([t24h, t48h]);
    }
    const QUERY = BSC_TOKEN_DATA(address)
    const QUERY_ONE = BSC_TOKEN_DATA_BY_BLOCK_ONE(address, blocks[0]?.number)
    // initialize data arrays
    const [queryOne, queryTwo] = await Promise.all(
        [
            request(INFO_CLIENT, QUERY),
            request(INFO_CLIENT, QUERY_ONE)
        ]
    );

    const data = queryOne?.tokens[0]
    const oneDayData = queryTwo?.tokens[0];

    try {
        if (data
        ) {
            // calculate percentage changes and daily changes
            const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
                +data?.tradeVolumeUSD ?? 0,
                +oneDayData?.tradeVolumeUSD ?? 0,
                +oneDayData?.tradeVolumeUSD
            )

            // calculate percentage changes and daily changes
            const [oneDayVolumeUT, volumeChangeUT] = get2DayPercentChange(
                +data?.untrackedVolumeUSD,
                +oneDayData?.untrackedVolumeUSD ?? 0,
                +oneDayData?.tradeVolumeUSD
            )

            // calculate percentage changes and daily changes
            const [oneDayTxns, txnChange] = get2DayPercentChange(
                +data?.totalTransactions,
                +oneDayData?.totalTransactions ?? 0,
                +oneDayData?.totalTransactions ?? 0
            )

            const priceChangeUSD = getPercentChange(
                +data?.derivedBNB * (+ethPrice),
                +oneDayData?.derivedBNB * (+ethPriceOld)
            )

            const currentLiquidityUSD = +data?.totalLiquidity * +ethPrice * +data?.derivedBNB
            const oldLiquidityUSD = oneDayData?.totalLiquidity * +ethPrice * +data?.derivedBNB

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
            data.oneDayData = oneDayData
            data.isBSC = true;
            // new tokens
            if (data) {
                data.oneDayVolumeUSD = data?.tradeVolumeUSD / 100
                data.oneDayVolumeETH = +data?.tradeVolume * +data?.derivedBNB
                data.oneDayTxns = data?.totalTransactions
            }
        }
    } catch (e) {
        console.error(e)
    }
    return data;
}

export const useBscPairs = (tokenAddress?: string) => {
    const defaultState: any[] = []
    const tokenAddressChecked = toChecksum(tokenAddress)
    const [pairData, setPairData] = React.useReducer(function (state: any[], action: { type: any, payload: any }) {
        switch (action.type) {
            case "UPDATE":
                return {
                    ...state,
                    ...action.payload
                };
            default:
                return state;
        }
    }, defaultState)
    const { data, loading, error } = useQuery(
        TOKEN_DATA(
            tokenAddressChecked,
            null,
            true
        ),
        {
            client: bscClient,
            onCompleted: (params) => {
                if (params && params.pairs1 && params.pairs0 && Boolean(params.pairs1.length || params.pairs0.length)) {
                    const pairs = [...params.pairs0, ...params.pairs1];
                    setPairData({ type: "UPDATE", payload: pairs })
                }
            }, pollInterval: 1000000,
        })

    return React.useMemo(() => {
        if (data && (data?.pairs0?.length || data?.pairs1.length) && !_.isEqual([...data.pairs0, ...data.pairs1], pairData)) {
            const pairs = [...data.pairs0, ...data.pairs1];
            return pairs
        }
        if (pairData && Array.isArray(pairData) && pairData.length) {
            return pairData;
        }
        if (!tokenAddressChecked || loading || error) {
            return []
        }
        return data?.['pairs0'].concat(data?.['pairs1'])
    }, [data, pairData, tokenAddressChecked])
}

const TokenTxns = gql` query TokenTransactions ($allPairs: [Bytes]!) {
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
  swaps(first: 280, orderBy: timestamp, orderDirection: desc, where: { pair_in: $allPairs }) {
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
}`

interface TransactionResults {
    mintsAs0: any[]
    mintsAs1: any[]
    swapsAs0: any[]
    swapsAs1: any[]
    burnsAs0: any[]
    burnsAs1: any[]
}



export function useBscTokenTransactions(tokenAddress: string, network?: string, interval: null | number = null, pair?: string | null) {
    const { chainId } = useWeb3React()
    const pairs = useBscPairs(toChecksum(tokenAddress))

    const queryVars = React.useMemo(() => {
        let pairFilter = pairs
        if (pairFilter.length == 0) {
            pairFilter = pairs
        }

        if (pair) {
            pairFilter = [{ id: pair }]
        }
        return {
            variables: {
                allPairs: pairFilter && pairFilter.length ? pairFilter.map((pair: { id: any }) => pair.id?.toLowerCase()) : []
            }
        }
    }, [pairs, pair])

    const query = useQuery(TokenTxns, {
        ...queryVars,
        pollInterval: (chainId && chainId == 56 || network === 'bsc') ? 10000 : undefined,
        client: bscClient
    })

    if (network !== 'bsc' || !tokenAddress) {
        query.stopPolling()
        return { data: [], lastFetched: new Date(), loading: false };
    }
    console.log(`uscBscTokenTransactions`, query)
    return { pairs, data: query.data, lastFetched: new Date(), loading: query.loading };
}

export function useBscPoocoinTransactions() {
    const [data, setData] = React.useState<any[]>()
    const { chainId } = useActiveWeb3React()
    const fn = React.useCallback(async () => {
        if (chainId && chainId === 56) {
            fetch('', { method: "GET" })
                .then(response => response.json())
                .then(setData)
        }
    }, [chainId])

    useInterval(fn, 15000, true);
    return data;
}
