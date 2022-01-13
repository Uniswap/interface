import { useMemo } from 'react'
import { Token, ChainId, ETHER, WETH } from '@dynamic-amm/sdk'
import { useActiveWeb3React } from 'hooks'
import { COINGECKO_NETWORK_ID } from 'constants/index'
import useSWR from 'swr'
import { getUnixTime, subHours } from 'date-fns'

const getTimeFrameHours = (timeFrame: LiveDataTimeframeEnum) => {
  switch (timeFrame) {
    case LiveDataTimeframeEnum.HOUR:
      return 1
    case LiveDataTimeframeEnum.FOUR_HOURS:
      return 4
    case LiveDataTimeframeEnum.DAY:
      return 24
    case LiveDataTimeframeEnum.WEEK:
      return 7 * 24
    case LiveDataTimeframeEnum.MONTH:
      return 30 * 24
    default:
      return 7 * 24
  }
}
const generateCoingeckoUrl = (
  chainId: ChainId,
  address: string | undefined,
  timeFrame: LiveDataTimeframeEnum | 'live'
): string => {
  const timeTo = getUnixTime(new Date())
  const timeFrom =
    timeFrame === 'live' ? timeTo - 1000 : getUnixTime(subHours(new Date(), getTimeFrameHours(timeFrame)))

  return `https://api.coingecko.com/api/v3/coins/${
    COINGECKO_NETWORK_ID[chainId || ChainId.MAINNET]
  }/contract/${address}/market_chart/range?vs_currency=usd&from=${timeFrom}&to=${timeTo}`
}
const getClosestPrice = (prices: any[], time: number) => {
  let closestIndex = 0
  prices.forEach((item, index) => {
    if (Math.abs(item[0] - time) < Math.abs(prices[closestIndex][0] - time)) {
      closestIndex = index
    }
  })
  return prices[closestIndex][0] - time > 10000000 ? 0 : prices[closestIndex][1]
}

export enum LiveDataTimeframeEnum {
  HOUR = '1H',
  FOUR_HOURS = '4H',
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M'
}

export interface ChartDataInfo {
  readonly time: number
  readonly value: number
}

const liveDataApi: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: `${process.env.REACT_APP_AGGREGATOR_API}/ethereum/tokens`,
  [ChainId.BSCMAINNET]: `${process.env.REACT_APP_AGGREGATOR_API}/bsc/tokens`,
  [ChainId.MATIC]: `${process.env.REACT_APP_AGGREGATOR_API}/polygon/tokens`,
  [ChainId.AVAXMAINNET]: `${process.env.REACT_APP_AGGREGATOR_API}/avalanche/tokens`,
  [ChainId.FANTOM]: `${process.env.REACT_APP_AGGREGATOR_API}/fantom/tokens`,
  [ChainId.CRONOS]: `${process.env.REACT_APP_AGGREGATOR_API}/cronos/tokens`
}
const fetchKyberDataSWR = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error()
  if (res.status === 204) {
    throw new Error('No content')
  }
  return res.json()
}

const fetchCoingeckoDataSWR = async (tokenAddresses: any, chainId: any, timeFrame: any): Promise<any> => {
  return await Promise.all(
    [tokenAddresses[0], tokenAddresses[1]].map(address =>
      fetch(generateCoingeckoUrl(chainId, address, timeFrame)).then(res => {
        if (!res.ok) throw new Error()
        if (res.status === 204) {
          throw new Error('No content')
        }
        return res.json()
      })
    )
  )
}

export default function useLiveChartData(tokens: (Token | null | undefined)[], timeFrame: LiveDataTimeframeEnum) {
  const { chainId } = useActiveWeb3React()

  const isReverse = useMemo(() => {
    if (!tokens || !tokens[0] || !tokens[1] || tokens[0].equals(tokens[1])) return false
    const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? [tokens[0], tokens[1]] : [tokens[1], tokens[0]]
    return token0 !== tokens[0]
  }, [tokens])

  const tokenAddresses = useMemo(
    () =>
      tokens
        .filter(Boolean)
        .map(token => (token === ETHER ? WETH[chainId || ChainId.MAINNET].address : token?.address)?.toLowerCase()),
    [tokens]
  )
  const { data: kyberData, error: kyberError } = useSWR(
    tokenAddresses[0] && tokenAddresses[1]
      ? `https://price-chart.kyberswap.com/api/price-chart?chainId=${chainId}&timeWindow=${timeFrame.toLowerCase()}&tokenIn=${
          tokenAddresses[0]
        }&tokenOut=${tokenAddresses[1]}`
      : null,
    fetchKyberDataSWR,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false
    }
  )
  const isKyberDataNotValid = useMemo(() => {
    if (kyberError || kyberData === null) return true
    if (kyberData && kyberData.length === 0) return true
    if (
      kyberData &&
      kyberData.length > 0 &&
      kyberData.every((item: any) => !item.token0Price || item.token0Price == '0')
    )
      return true
    return false
  }, [kyberError, kyberData])

  const { data: coingeckoData, error: coingeckoError } = useSWR(
    isKyberDataNotValid ? [tokenAddresses, chainId, timeFrame] : null,
    fetchCoingeckoDataSWR,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false
    }
  )

  const chartData = useMemo(() => {
    if (!isKyberDataNotValid && kyberData && kyberData.length > 0) {
      return kyberData
        .sort((a: any, b: any) => parseInt(a.timestamp) - parseInt(b.timestamp))
        .map((item: any) => {
          return {
            time: parseInt(item.timestamp) * 1000,
            value: !isReverse ? item.token0Price : item.token1Price || 0
          }
        })
    } else if (coingeckoData && coingeckoData[0]?.prices?.length > 0 && coingeckoData[1]?.prices?.length > 0) {
      const [data1, data2] = coingeckoData
      return data1.prices.map((item: number[]) => {
        const closestPrice = getClosestPrice(data2.prices, item[0])
        return { time: item[0], value: closestPrice > 0 ? parseFloat((item[1] / closestPrice).toPrecision(6)) : 0 }
      })
    } else return []
  }, [kyberData, coingeckoData, isKyberDataNotValid])
  const error = kyberError && coingeckoError

  const { data: liveKyberData, error: liveKyberDataError } = useSWR(
    !isKyberDataNotValid && kyberData && chainId
      ? liveDataApi[chainId] + `?ids=${tokenAddresses[0]},${tokenAddresses[1]}`
      : null,
    fetchKyberDataSWR,
    {
      refreshInterval: 60000,
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false
    }
  )
  const { data: liveCoingeckoData, error: liveCoingeckoDataError } = useSWR(
    isKyberDataNotValid && coingeckoData ? [tokenAddresses, chainId, 'live'] : null,
    fetchCoingeckoDataSWR,
    {
      refreshInterval: 60000,
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false
    }
  )
  const latestData = useMemo(() => {
    if (isKyberDataNotValid) {
      if (liveCoingeckoData) {
        const [data1, data2] = liveCoingeckoData
        if (data1.prices?.length > 0 && data2.prices?.length > 0) {
          const newValue = parseFloat(
            (data1.prices[data1.prices.length - 1][1] / data2.prices[data2.prices.length - 1][1]).toPrecision(6)
          )
          return { time: new Date().getTime(), value: newValue }
        }
      }
    } else {
      if (liveKyberData) {
        const value =
          liveKyberData && tokenAddresses[0] && tokenAddresses[1]
            ? liveKyberData[tokenAddresses[0]].price / liveKyberData[tokenAddresses[1]].price
            : 0
        if (value) return { time: new Date().getTime(), value: value }
      }
    }
    return null
  }, [liveKyberData, liveCoingeckoData])
  return {
    data: useMemo(() => (latestData ? [...chartData, latestData] : chartData), [latestData, chartData]),
    error: error,
    loading: chartData.length === 0 && !error
  }
}
