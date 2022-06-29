/* eslint-disable @typescript-eslint/camelcase */
import { useEffect, useMemo, useState } from 'react'
import { TrueSightTimeframe } from 'pages/TrueSight/index'
import { NETWORKS_INFO, TRUESIGHT_NETWORK_TO_CHAINID } from 'constants/networks'

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

function formatCoinGeckoChartData(data: CoinGeckoChartData): FormattedCoinGeckoChartData {
  return {
    prices: data.prices.map(item => ({ time: item[0] ?? 0, value: item[1].toString() ?? 0 })),
    marketCaps: data.market_caps.map(item => ({ time: item[0] ?? 0, value: item[1].toString() ?? 0 })),
    totalVolumes: data.total_volumes.map(item => ({ time: item[0] ?? 0, value: item[1].toString() ?? 0 })),
  }
}

export default function useGetCoinGeckoChartData(
  tokenNetwork: string | undefined,
  tokenAddress: string | undefined,
  timeframe: TrueSightTimeframe,
) {
  const [data, setData] = useState<CoinGeckoChartData>({ prices: [], market_caps: [], total_volumes: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()

  useEffect(() => {
    const controller = new AbortController()
    const fetchData = async () => {
      if (tokenNetwork && tokenAddress) {
        try {
          const to = Math.floor(Date.now() / 1000)
          const from = to - (timeframe === TrueSightTimeframe.ONE_DAY ? 24 * 3600 : 24 * 3600 * 7)
          const chainId = TRUESIGHT_NETWORK_TO_CHAINID[tokenNetwork]
          const coinGeckoNetworkId = NETWORKS_INFO[chainId].coingeckoNetworkId
          let url = `https://api.coingecko.com/api/v3/coins/${coinGeckoNetworkId}/contract/${tokenAddress.toLowerCase()}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
          if (tokenAddress === 'bnb') {
            url = `https://api.coingecko.com/api/v3/coins/binancecoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
          } else if (tokenNetwork === 'bsc' && tokenAddress === '0x1Fa4a73a3F0133f0025378af00236f3aBDEE5D63') {
            // NEAR
            url = `https://api.coingecko.com/api/v3/coins/near/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
          } else if (tokenNetwork === 'eth' && tokenAddress === '0x7c8161545717a334f3196e765d9713f8042EF338') {
            // CAKE
            url = `https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/market_chart/range?vs_currency=usd&from=1649824248&to=1649910648`
          }
          setError(undefined)
          setIsLoading(true)
          setData({ prices: [], market_caps: [], total_volumes: [] })
          const response = await fetch(url, { signal: controller.signal })
          if (response.ok) {
            const result = await response.json()
            setData(result)
          }
          setIsLoading(false)
        } catch (err) {
          console.error(err)
          setError(err)
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      controller.abort()
    }
  }, [timeframe, tokenAddress, tokenNetwork])

  return useMemo(() => {
    const formattedData = formatCoinGeckoChartData(data)
    return { isLoading, data: formattedData, error }
  }, [data, isLoading, error])
}
