import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { CHAIN_INFO } from 'src/constants/chains'
import {
  useDailyTokenPricesQuery,
  useHourlyTokenPricesQuery,
} from 'src/features/historicalChainData/generated'

interface TokenPricesProps {
  token?: Token
}

interface HourlyTokenPricesProps extends TokenPricesProps {
  timestamp: number
}

function useEndpoint(chainId?: number) {
  return useMemo(() => (chainId ? CHAIN_INFO[chainId].subgraphUrl : null) ?? '', [chainId])
}

export function useHourlyTokenPrices({ token, timestamp }: HourlyTokenPricesProps) {
  const endpoint = useEndpoint(token?.chainId)

  return useHourlyTokenPricesQuery(
    { endpoint },
    {
      address: token?.address.toLowerCase(),
      chainId: token?.chainId, // enforces key by chain
      periodStartUnix: Math.round(timestamp / 1000),
    },
    { enabled: Boolean(endpoint) && Boolean(token) }
  )
}

export function useDailyTokenPrices({ token }: TokenPricesProps) {
  const endpoint = useEndpoint(token?.chainId)

  return useDailyTokenPricesQuery(
    { endpoint },
    {
      address: token?.address.toLowerCase(),
      chainId: token?.chainId, // enforces key by chain
    },
    { enabled: Boolean(endpoint) && Boolean(token) }
  )
}
