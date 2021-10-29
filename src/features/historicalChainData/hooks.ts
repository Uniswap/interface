import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { CHAIN_INFO } from 'src/constants/chains'
import { usePricesQuery } from './generated'

export function useHistoricalPrices({ token }: { token?: Token }) {
  const endpoint = useMemo(
    () => (token ? CHAIN_INFO[token.chainId].subgraphUrl : '') ?? '',
    [token]
  )

  return usePricesQuery(
    { endpoint },
    { address: token!.address.toLowerCase(), chainId: token!.chainId, skip: 0 },
    { enabled: Boolean(token) && Boolean(endpoint) }
  )
}
