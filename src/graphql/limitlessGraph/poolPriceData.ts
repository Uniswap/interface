import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { isAddress } from 'ethers/lib/utils'
import { gql, ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { Token } from '@uniswap/sdk-core'
import { FeeAmount, computePoolAddress } from '@uniswap/v3-sdk'
import { V3_CORE_FACTORY_ADDRESSES as UNISWAP_FACTORIES } from "constants/addresses-uniswap"
import { V3_CORE_FACTORY_ADDRESSES as LIMITLESS_FACTORIES, POOL_INIT_CODE_HASH, UNISWAP_POOL_INIT_CODE_HASH } from "constants/addresses"
import { useWeb3React } from '@web3-react/core'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useContract } from 'hooks/useContract'
import { abi as IUniswapV3PoolStateABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json'
import { Interface } from '@ethersproject/abi'
import { useLimitlessSubgraph } from './limitlessClients'
import dayjs, { OpUnitType }from 'dayjs'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
dayjs.extend(utc)
dayjs.extend(weekOfYear)

const POOL_STATE_INTERFACE = new Interface(IUniswapV3PoolStateABI)


export type PriceChartEntry = {
  time: number // unix timestamp
  open: number
  close: number
  high: number
  low: number
}

const PRICE_CHART = gql`
  query tokenHourDatas($startTime: Int!, $skip: Int!, $address: Bytes!) {
    tokenHourDatas(
      first: 100
      skip: $skip
      where: { token: $address, periodStartUnix_gt: $startTime }
      orderBy: periodStartUnix
      orderDirection: asc
    ) {
      periodStartUnix
      high
      low
      open
      close
    }
  }
`

const POOL_PRICE_CHART = gql`
  query poolHourDatas($startTime: Int!, $endTime: Int!, $address: String!, $amount: Int!) {
    poolHourDatas(
      where: { pool: $address, periodStartUnix_gt: $startTime, periodStartUnix_lt: $endTime }
      orderBy: periodStartUnix
      orderDirection: asc
      first: $amount
    ) {
      periodStartUnix
      high
      low
      open
      close
    }
  }
`

interface PriceResults {
  poolHourDatas: {
    periodStartUnix: number
    high: string
    low: string
    open: string
    close: string
  }[]
}

export async function fetchPoolPriceData(
  address: string,
  startTimestamp: number,
  endTimestamp: number,
  countBack: number,
  invertPrice: boolean,
  dataClient: ApolloClient<NormalizedCacheObject>,
): Promise<{
  data: PriceChartEntry[]
  error: boolean
}> {
  // start and end bounds

  try {
    // const endTimestamp = dayjs.utc().unix()

    if (!startTimestamp) {
      console.log('Error constructing price start timestamp')
      return {
        data: [],
        error: false,
      }
    }

    // let data: {
    //   periodStartUnix: number
    //   high: string
    //   low: string
    //   open: string
    //   close: string
    // }[] = []
    console.log("subgraph1: ", address, startTimestamp, endTimestamp, countBack)
    const { data: result, errors, loading } = await dataClient.query<PriceResults>({
      query: POOL_PRICE_CHART,
      variables: {
        address: address.toLowerCase(),
        startTime: startTimestamp,
        endTime: endTimestamp,
        amount: countBack > 950 ? 950 : countBack,
      },
      fetchPolicy: 'cache-first',
    })
    console.log("subgraph2: ", result, errors, loading)

    const formattedHistory = result.poolHourDatas.map((d) => {
      return {
        time: d.periodStartUnix * 1000,
        open: invertPrice ? 1 / parseFloat(d.open) : parseFloat(d.open),
        close: invertPrice ? 1 / parseFloat(d.close) : parseFloat(d.close),
        high: invertPrice ? 1 / parseFloat(d.high) : parseFloat(d.high),
        low: invertPrice ? 1 / parseFloat(d.low) : parseFloat(d.low),
      }
    })

    if (formattedHistory.length === 0) {
      return {
        data: [],
        error: false,
      }
    }

    if (formattedHistory.length <= countBack) {
      return {
        data: formattedHistory,
        error: false,
      }
    }

    if (formattedHistory.length > countBack) { 
      return {  
        data: formattedHistory.slice(formattedHistory.length - countBack, formattedHistory.length),
        error: false,
      }
    }
  } catch (e) {
    console.log("subgraph error:", e)
    return {
      data: [],
      error: true,
    }
  }

  return {
    data: [],
    error: true,
  }
}

interface PoolPrice {
  oldestFetchedTimestamp: number;
  priceData: PriceChartEntry[];
}

/**
 * Get top pools addresses that token is included in
 * If not loaded, fetch and store
 * @param address
 */
export function usePoolPriceData(
  //address: string, // pool address
  token0: Token | undefined,
  token1: Token | undefined,
  fee: FeeAmount | undefined,
  interval: number,
  timeWindow: OpUnitType
): PriceChartEntry[] | undefined {
  const { chainId } = useWeb3React()

  const [priceData, setPriceData] = useState<PoolPrice>()
  const [error, setError] = useState(false)

  const uniswapPoolAddress = useMemo(() => {
    if (chainId && token0 && token1 && fee) {
      return computePoolAddress({
        factoryAddress: UNISWAP_FACTORIES[chainId],
        tokenA: token0,
        tokenB: token1,
        fee,
        initCodeHashManualOverride: UNISWAP_POOL_INIT_CODE_HASH
      }).toLowerCase()
    }
    return undefined
  }, [chainId, token0, token1, fee])

  const limitlessPoolAddress = useMemo(() => {
    if (chainId && token0 && token1 && fee) {
      return computePoolAddress({
        factoryAddress: LIMITLESS_FACTORIES[chainId],
        tokenA: token0,
        tokenB: token1,
        fee,
        initCodeHashManualOverride: POOL_INIT_CODE_HASH
      }).toLowerCase()
    }
    return undefined
  }, [chainId, token0, token1, fee])

  const uniswapPoolContract = useContract(uniswapPoolAddress, POOL_STATE_INTERFACE)

  const [uniswapPoolExists, setUniswapPoolExists] = useState(false)

  // console.log("poolPriceData: ", error, uniswapPoolAddress, uniswapPoolContract, uniswapPoolExists, limitlessPoolAddress)

  useEffect(() => {
    async function fetch () {
      if (uniswapPoolAddress && uniswapPoolContract) {
        try {
          const feeGrowthGlobal0X128 = await uniswapPoolContract.callStatic.feeGrowthGlobal0X128()
          if (feeGrowthGlobal0X128) {
            setUniswapPoolExists(true)
          }
        } catch (err) {
          console.log("err: ", err)
        }
      }
    }
    fetch()
  }, [uniswapPoolAddress])

  // construct timestamps and check if we need to fetch more data
  const oldestTimestampFetched = priceData?.oldestFetchedTimestamp
  const utcCurrentTime = dayjs()
  const startTimestamp = utcCurrentTime.subtract(1, timeWindow).startOf('hour').unix()

  useEffect(() => {
    async function fetch() {
      // if (uniswapPoolAddress && limitlessPoolAddress) {
      //   const { data, error: fetchingError } = await fetchPoolPriceData(
      //     uniswapPoolExists ? uniswapPoolAddress : limitlessPoolAddress,
      //     interval,
      //     startTimestamp,
      //     uniswapPoolExists ? uniswapClient : limitlessClient
      //   )

      //   if (data) {
      //     setPriceData({
      //       priceData: data,
      //       oldestFetchedTimestamp: startTimestamp,
      //     })
      //   }
      //   if (fetchingError) {
      //     console.log('Error fetching pool price data', fetchingError)
      //     setError(true)
      //   }
      // }
      // const { data, error: fetchingError } = await fetchPoolPriceData(
      //   address,
      //   interval,
      //   startTimestamp,
      //   dataClient
      // )

    }

    if (!priceData && !error) {
      fetch()
    }
  }, [
    error,
    interval,
    oldestTimestampFetched,
    priceData,
    startTimestamp,
    timeWindow,
    limitlessPoolAddress,
    uniswapPoolAddress,
  ])

  // const fakePriceData = [
  //   {
  //     time: 1682377200,
  //     open: 5.0465835688061,
  //     close: 16.0465835688061,
  //     high: 20.0465835688061,
  //     low: 3.0465835688061,
  //   },
  //   {
  //     time: 1682377350,
  //     open: 13.0465835688061,
  //     close: 16.0465835688061,
  //     high: 12.0465835688061,
  //     low: 20.0465835688061,
  //   },
  //   {
  //     time: 1682377900,
  //     open: 50.0465835688061,
  //     close: 25.0465835688061,
  //     high: 80.0465835688061,
  //     low: 20.0465835688061,
  //   },    
  // ]
  // return data
  return priceData?.priceData ?? []
}