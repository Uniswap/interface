import { Token, WETH } from '@kyberswap/ks-sdk-core'
import useSWR from 'swr'

import { COINGECKO_API_URL } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

export interface TokenInfo {
  price: number
  marketCap: number
  marketCapRank: number
  circulatingSupply: number
  totalSupply: number
  allTimeHigh: number
  allTimeLow: number
  tradingVolume: number
  description: { en: string }
  name: string
}

export default function useTokenInfo(token: Token | undefined): { data: TokenInfo; loading: boolean; error: any } {
  const { chainId, isSolana } = useActiveWeb3React()

  const fetcher = (url: string) => (url ? fetch(url).then(r => r.json()) : Promise.reject({ data: {}, error: '' }))

  const tokenAddress = isSolana ? token?.address || '' : (token?.address || '').toLowerCase()

  let url = ''

  if (tokenAddress.toLowerCase() === WETH[chainId].address.toLowerCase()) {
    // If the token is native token, we have to use different endpoint
    url = `${COINGECKO_API_URL}/coins/${NETWORKS_INFO[chainId].coingeckoNativeTokenId}`
  } else if (tokenAddress) {
    url = `${COINGECKO_API_URL}/coins/${NETWORKS_INFO[chainId].coingeckoNetworkId}/contract/${tokenAddress}`
  }

  const { data, error } = useSWR(url, fetcher, {
    refreshInterval: 60000,
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Never retry on 404.
      if (error.status === 404) return

      // Only retry up to 10 times.
      if (retryCount >= 10) return

      if (error.status === 403) {
        // If API return 403, retry after 30 seconds.
        setTimeout(() => revalidate({ retryCount }), 30000)
        return
      }

      // Retry after 20 seconds.
      setTimeout(() => revalidate({ retryCount }), 20000)
    },
  })

  if (error && process.env.NODE_ENV === 'development') {
    console.error(error)
  }

  const loading = !data

  const result = {
    price: data?.market_data?.current_price?.usd || 0,
    marketCap: data?.market_data?.market_cap?.usd || 0,
    marketCapRank: data?.market_data?.market_cap_rank || 0,
    circulatingSupply: data?.market_data?.circulating_supply || 0,
    totalSupply: data?.market_data?.total_supply || 0,
    allTimeHigh: data?.market_data?.ath?.usd || 0,
    allTimeLow: data?.market_data?.atl?.usd || 0,
    tradingVolume: data?.market_data?.total_volume?.usd || 0,
    description: data?.description || { en: '' },
    name: data?.name || '',
  }

  return { data: result, loading, error }
}
