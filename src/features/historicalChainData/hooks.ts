import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { CHAIN_INFO } from 'src/constants/chains'
import { usePricesQuery } from './generated'

const d = new Date()
const ONE_MONTH_AGO = d.setMonth(d.getMonth() - 1)

export function useHistoricalPrices({ token }: { token: Token }) {
  const endpoint = useMemo(() => CHAIN_INFO[token.chainId].subgraphUrl ?? '', [token])

  return usePricesQuery(
    { endpoint },
    {
      address: token.address.toLowerCase(),
      chainId: token.chainId, // enforces key by chain
      hourlyPeriodStartUnix: Math.round(ONE_MONTH_AGO / 1000),
    },
    { enabled: Boolean(token) && Boolean(endpoint) }
  )
}
