import { useMemo } from 'react'
import useSWR from 'swr'

import { ChainId, ETHER, Token, WETH } from '@dynamic-amm/sdk'
import { COINGECKO_NETWORK_ID } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

export default function useTokensMarketPrice(tokens: (Token | null | undefined)[]) {
  const { chainId } = useActiveWeb3React()

  const fetcher = (url: string) => fetch(url).then(r => r.json())

  const tokenAddress = tokens
    .filter(Boolean)
    .map(token => (token === ETHER ? WETH[chainId || ChainId.MAINNET].address : token?.address))

  const url = `https://api.coingecko.com/api/v3/simple/token_price/${
    COINGECKO_NETWORK_ID[chainId || ChainId.MAINNET]
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

      // Retry after 5 seconds.
      setTimeout(() => revalidate({ retryCount }), 5000)
    }
  })

  if (error) {
    console.error(error)
  }

  return useMemo(() => {
    return tokens.map(token => {
      if (!token || !token.address || !data || !data[token?.address?.toLowerCase()]) return 0

      if (token === ETHER) return data[WETH[chainId || ChainId.MAINNET].address.toLowerCase()]?.usd ?? 0

      return data[token?.address?.toLowerCase()]?.usd ?? 0
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, data, JSON.stringify(tokens)])
}
