import { useMemo, useRef } from 'react'
import useSWRImmutable from 'swr/immutable'

import { COINGECKO_API_URL } from 'constants/index'
import { NETWORKS_INFO, TRUESIGHT_NETWORK_TO_CHAINID } from 'constants/networks'
import { TrueSightTimeframe } from 'pages/TrueSight/index'

export interface CoinGeckoChartData {
  prices: [number, number][]
  market_caps: [number, number][]
  total_volumes: [number, number][]
}

export interface FormattedCoinGeckoChartData {
  prices: { time: number; value: string }[]
  marketCaps: { time: number; value: string }[]
  totalVolumes: { time: number; value: string }[]
}

const initialCoinGeckoChartData = { prices: [], market_caps: [], total_volumes: [] }

function formatCoinGeckoChartData(data: CoinGeckoChartData): FormattedCoinGeckoChartData {
  return {
    prices: data.prices.map(item => ({ time: item[0] ?? 0, value: item[1].toString() ?? 0 })),
    marketCaps: data.market_caps.map(item => ({ time: item[0] ?? 0, value: item[1].toString() ?? 0 })),
    totalVolumes: data.total_volumes.map(item => ({ time: item[0] ?? 0, value: item[1].toString() ?? 0 })),
  }
}

const FETCHING_COINGECKO_CHART_DATA_OFFSET = 2000
const FETCHING_COINGECKO_CHART_DATA_ERROR_RETRY_INTERVAL = FETCHING_COINGECKO_CHART_DATA_OFFSET / 2

export default function useGetCoinGeckoChartData(
  tokenNetwork: string | undefined,
  tokenAddress: string | undefined,
  timeframe: TrueSightTimeframe,
) {
  const latestRequestingTime = useRef(0)
  const controller = useRef(new AbortController())

  const {
    data,
    isValidating: isLoading,
    error,
  } = useSWRImmutable<CoinGeckoChartData>(
    ['useGetCoinGeckoChartData', timeframe, tokenAddress ?? '', tokenNetwork ?? ''],
    async () => {
      if (tokenNetwork && tokenAddress) {
        try {
          controller.current.abort()
          controller.current = new AbortController()
          const to = Math.floor(Date.now() / 1000)
          const from = to - (timeframe === TrueSightTimeframe.ONE_DAY ? 24 * 3600 : 24 * 3600 * 7)
          const chainId = TRUESIGHT_NETWORK_TO_CHAINID[tokenNetwork]
          const coinGeckoNetworkId = NETWORKS_INFO[chainId].coingeckoNetworkId
          let url = `${COINGECKO_API_URL}/coins/${coinGeckoNetworkId}/contract/${tokenAddress.toLowerCase()}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
          if (tokenAddress === 'bnb') {
            url = `${COINGECKO_API_URL}/coins/binancecoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
          } else if (tokenNetwork === 'bsc' && tokenAddress === '0x1Fa4a73a3F0133f0025378af00236f3aBDEE5D63') {
            // NEAR
            url = `${COINGECKO_API_URL}/coins/near/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
          } else if (tokenNetwork === 'eth' && tokenAddress === '0x7c8161545717a334f3196e765d9713f8042EF338') {
            // CAKE
            url = `${COINGECKO_API_URL}/coins/binance-smart-chain/contract/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
          }
          if (Date.now() - latestRequestingTime.current < FETCHING_COINGECKO_CHART_DATA_OFFSET) {
            // Too Many Request
            throw new Error('429')
          }
          latestRequestingTime.current = Date.now()
          const response = await fetch(url, { signal: controller.current.signal })
          if (response.ok) {
            const result = await response.json()
            return result
          }
        } catch (err) {
          // Too Many Request
          throw new Error('429')
        }
      }
      return initialCoinGeckoChartData
    },
    {
      errorRetryInterval: FETCHING_COINGECKO_CHART_DATA_ERROR_RETRY_INTERVAL,
      errorRetryCount: 60 / FETCHING_COINGECKO_CHART_DATA_ERROR_RETRY_INTERVAL, // CoinGecko might block upto 1 minute
    },
  )

  return useMemo(() => {
    const formattedData = formatCoinGeckoChartData(data ?? initialCoinGeckoChartData)

    // If the error is Too Many Request, show loading and then retry in intervals until success
    return { isLoading: error?.message === '429' ? true : isLoading, data: formattedData }
  }, [data, isLoading, error])
}
