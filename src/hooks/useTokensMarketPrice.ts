import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import useSWR from 'swr'

import { COINGECKO_API_URL, KNC, KNC_COINGECKO_ID, ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useKNCMarketPrice() {
  const url = `${COINGECKO_API_URL}/simple/price?ids=${KNC_COINGECKO_ID}&vs_currencies=usd`

  const { data, error } = useSWR(url, fetcher, {
    refreshInterval: 30000,
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

  return data?.[KNC_COINGECKO_ID]?.usd || 0
}

export default function useTokensMarketPrice(tokens: (Token | null | undefined)[]) {
  const { chainId } = useActiveWeb3React()
  const kncPrice = useKNCMarketPrice()

  const tokenAddress = tokens
    .filter(Boolean)
    .map(token =>
      token?.isNative || token?.address === ZERO_ADDRESS ? WETH[chainId || ChainId.MAINNET].address : token?.address,
    )

  const url = `${COINGECKO_API_URL}/simple/token_price/${
    NETWORKS_INFO[chainId || ChainId.MAINNET].coingeckoNetworkId
  }?contract_addresses=${tokenAddress.join()}&vs_currencies=usd`

  const { data, error } = useSWR(url, fetcher, {
    refreshInterval: 30000,
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

  return useMemo(() => {
    return tokens.map(token => {
      if (!token || !token.address) return 0

      if (token.address.toLowerCase() === KNC[chainId as ChainId].address.toLowerCase()) return kncPrice

      if (!data || !data[token?.address?.toLowerCase()]) return 0

      if (token.isNative || token.address === ZERO_ADDRESS)
        return data[WETH[chainId || ChainId.MAINNET].address.toLowerCase()]?.usd ?? 0

      return data[token?.address?.toLowerCase()]?.usd ?? 0
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, data, JSON.stringify(tokens)])
}
