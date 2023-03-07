import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import axios from 'axios'
import { getUnixTime, subHours } from 'date-fns'
import { useMemo } from 'react'
import useSWR from 'swr'

import { PRICE_CHART_API } from 'constants/env'
import { COINGECKO_API_URL } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

import { useKyberswapGlobalConfig } from './useKyberSwapConfig'

export enum LiveDataTimeframeEnum {
  HOUR = '1H',
  FOUR_HOURS = '4H',
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M',
  SIX_MONTHS = '6M',
}

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
    case LiveDataTimeframeEnum.SIX_MONTHS:
      return 180 * 24
    default:
      return 7 * 24
  }
}
const generateCoingeckoUrl = (
  chainId: ChainId,
  address: string | undefined,
  timeFrame: LiveDataTimeframeEnum | 'live',
): string => {
  const timeTo = getUnixTime(new Date())
  const timeFrom =
    timeFrame === 'live' ? timeTo - 1000 : getUnixTime(subHours(new Date(), getTimeFrameHours(timeFrame)))
  const cgkId = NETWORKS_INFO[chainId].coingeckoNetworkId
  if (!cgkId) return ''
  return `${COINGECKO_API_URL}/coins/${cgkId}/contract/${address}/market_chart/range?vs_currency=usd&from=${timeFrom}&to=${timeTo}`
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

const fetchKyberDataSWR = async (url: string) => {
  const res = await axios.get(url, { timeout: 5000 })
  if (res.status === 204) {
    throw new Error('No content')
  }
  return res.data
}

const fetchKyberDataSWRWithHeader = async (url: string) => {
  const res = await axios
    .get(url, {
      timeout: 5000,
      headers: {
        'accept-version': 'Latest',
      },
    })
    .catch(error => {
      throw error
    })

  if (res.status === 204) {
    throw new Error('No content')
  }
  return res.data
}

const fetchCoingeckoDataSWR = async (tokenAddresses: any, chainId: any, timeFrame: any): Promise<any> => {
  return await Promise.all(
    [tokenAddresses[0], tokenAddresses[1]].map(address =>
      axios
        .get(generateCoingeckoUrl(chainId, address, timeFrame), { timeout: 5000 })
        .then(res => {
          if (res.status === 204) {
            throw new Error('No content')
          }
          return res.data
        })
        .catch(error => {
          throw error
        }),
    ),
  )
}

export default function useBasicChartData(tokens: (Token | null | undefined)[], timeFrame: LiveDataTimeframeEnum) {
  const { chainId, isEVM, networkInfo } = useActiveWeb3React()
  const { aggregatorDomain } = useKyberswapGlobalConfig()
  const isReverse = useMemo(() => {
    if (!tokens || !tokens[0] || !tokens[1] || tokens[0].equals(tokens[1]) || tokens[0].chainId !== tokens[1].chainId)
      return false
    const [token0] = tokens[0].sortsBefore(tokens[1]) ? [tokens[0], tokens[1]] : [tokens[1], tokens[0]]
    return token0 !== tokens[0]
  }, [tokens])
  const tokenAddresses = useMemo(
    () =>
      tokens.filter(Boolean).map(token => {
        const tokenAdd = token?.isNative ? WETH[chainId].address : token?.address
        return isEVM ? tokenAdd?.toLowerCase() : tokenAdd
      }),
    [tokens, chainId, isEVM],
  )

  const {
    data: coingeckoData,
    error: coingeckoError,
    isValidating: coingeckoLoading,
  } = useSWR(tokenAddresses[0] && tokenAddresses[1] && [tokenAddresses, chainId, timeFrame], fetchCoingeckoDataSWR, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateIfStale: false,
  })

  const {
    data: kyberData,
    error: kyberError,
    isValidating: kyberLoading,
  } = useSWR(
    coingeckoError && tokenAddresses[0] && tokenAddresses[1]
      ? `${PRICE_CHART_API}/price-chart?chainId=${chainId}&timeWindow=${timeFrame.toLowerCase()}&tokenIn=${
          tokenAddresses[0]
        }&tokenOut=${tokenAddresses[1]}`
      : null,
    fetchKyberDataSWR,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  const isKyberDataNotValid = useMemo(() => {
    if (kyberError || kyberData === null) return true
    if (kyberData && kyberData.length === 0) return true
    if (
      kyberData &&
      kyberData.length > 0 &&
      kyberData.every((item: any) => !item.token0Price || item.token0Price === '0')
    )
      return true
    return false
  }, [kyberError, kyberData])

  const chartData = useMemo(() => {
    if (!isKyberDataNotValid && kyberData && kyberData.length > 0) {
      return kyberData
        .sort((a: any, b: any) => parseInt(a.timestamp) - parseInt(b.timestamp))
        .map((item: any) => {
          return {
            time: parseInt(item.timestamp) * 1000,
            value: !isReverse ? item.token0Price : item.token1Price || 0,
          }
        })
    } else if (coingeckoData && coingeckoData[0]?.prices?.length > 0 && coingeckoData[1]?.prices?.length > 0) {
      const [data1, data2] = coingeckoData
      return data1.prices.map((item: number[]) => {
        const closestPrice = getClosestPrice(data2.prices, item[0])
        return { time: item[0], value: closestPrice > 0 ? parseFloat((item[1] / closestPrice).toPrecision(6)) : 0 }
      })
    } else return []
  }, [kyberData, coingeckoData, isKyberDataNotValid, isReverse])

  const error = (!!kyberError && !!coingeckoError) || chartData.length === 0

  const { data: liveKyberData } = useSWR(
    !isKyberDataNotValid && kyberData && chainId
      ? `${aggregatorDomain}/${networkInfo.aggregatorRoute}/tokens?ids=${tokenAddresses[0]},${tokenAddresses[1]}`
      : null,
    fetchKyberDataSWRWithHeader,
    {
      refreshInterval: 60000,
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  const { data: liveCoingeckoData } = useSWR(
    isKyberDataNotValid && coingeckoData ? [tokenAddresses, chainId, 'live'] : null,
    fetchCoingeckoDataSWR,
    {
      refreshInterval: 60000,
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  const latestData = useMemo(() => {
    if (isKyberDataNotValid) {
      if (liveCoingeckoData) {
        const [data1, data2] = liveCoingeckoData
        if (data1.prices?.length > 0 && data2.prices?.length > 0) {
          const newValue = parseFloat(
            (data1.prices[data1.prices.length - 1][1] / data2.prices[data2.prices.length - 1][1]).toPrecision(6),
          )
          return { time: new Date().getTime(), value: newValue }
        }
      }
    } else {
      if (liveKyberData) {
        const value =
          liveKyberData && tokenAddresses[0] && tokenAddresses[1]
            ? liveKyberData[tokenAddresses[0]]?.price / liveKyberData[tokenAddresses[1]]?.price
            : 0
        if (value) return { time: new Date().getTime(), value: value }
      }
    }
    return null
  }, [liveKyberData, liveCoingeckoData, isKyberDataNotValid, tokenAddresses])

  return {
    data: useMemo(() => (latestData ? [...chartData, latestData] : chartData), [latestData, chartData]),
    error: error,
    loading: !tokenAddresses[0] || !tokenAddresses[1] || kyberLoading || coingeckoLoading,
  }
}
