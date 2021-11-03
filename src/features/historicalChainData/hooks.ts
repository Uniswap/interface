import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { CHAIN_INFO } from 'src/constants/chains'
import {
  useDailyTokenPricesQuery,
  useHourlyTokenPricesQuery,
} from 'src/features/historicalChainData/generated'

const d = new Date()
const ONE_MONTH_AGO = d.setMonth(d.getMonth() - 1)

export function useHistoricalPrices({ token: { chainId, address } }: { token: Token }) {
  const endpoint = useMemo(() => CHAIN_INFO[chainId].subgraphUrl ?? '', [chainId])
  const enabled = Boolean(endpoint)

  const hourlyTokenPrices = useHourlyTokenPricesQuery(
    { endpoint },
    {
      address: address.toLowerCase(),
      chainId, // enforces key by chain
      periodStartUnix: Math.round(ONE_MONTH_AGO / 1000),
    },
    { enabled }
  )

  const dailyTokenPrices = useDailyTokenPricesQuery(
    { endpoint },
    {
      address: address.toLowerCase(),
      chainId, // enforces key by chain
    },
    { enabled }
  )

  return { dailyTokenPrices, hourlyTokenPrices }
}
