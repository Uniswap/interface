import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { CHAIN_INFO } from 'src/constants/chains'
import {
  DailyTokenPricesQuery,
  HourlyTokenPricesQuery,
  useDailyTokenPricesQuery,
  useHourlyTokenPricesQuery,
} from 'src/features/historicalChainData/generated'

interface TokenPricesProps {
  token?: Token
}

interface HourlyTokenPricesProps extends TokenPricesProps {
  timestamp: number
}

export function useHourlyTokenPrices({ token, timestamp }: HourlyTokenPricesProps) {
  const endpoint = useEndpoint(token?.chainId)

  const { data, ...queryStatus } = useHourlyTokenPricesQuery(
    { endpoint },
    {
      address: token?.address.toLowerCase(),
      chainId: token?.chainId, // enforces key by chain
      periodStartUnix: Math.round(timestamp / 1000),
    },
    { enabled: Boolean(endpoint) && Boolean(token) }
  )

  const prices = useParsedPriceData(data?.tokenHourDatas)

  return {
    prices,
    ...queryStatus,
  }
}

export function useDailyTokenPrices({ token }: TokenPricesProps) {
  const endpoint = useEndpoint(token?.chainId)

  const { data, ...queryStatus } = useDailyTokenPricesQuery(
    { endpoint },
    {
      address: token?.address.toLowerCase(),
      chainId: token?.chainId, // enforces key by chain
    },
    { enabled: Boolean(endpoint) && Boolean(token) }
  )

  const prices = useParsedPriceData(data?.tokenDayDatas)

  return {
    prices,
    ...queryStatus,
  }
}

function useParsedPriceData(
  data?: HourlyTokenPricesQuery['tokenHourDatas'] | DailyTokenPricesQuery['tokenDayDatas']
) {
  return data
    ? data.map(({ open, close, high, low, ...rest }) => ({
        ...rest,
        open: parseFloat(open),
        close: parseFloat(close),
        high: parseFloat(high),
        low: parseFloat(low),
      }))
    : undefined
}

function useEndpoint(chainId?: number) {
  return useMemo(() => (chainId ? CHAIN_INFO[chainId].subgraphUrl : null) ?? '', [chainId])
}
