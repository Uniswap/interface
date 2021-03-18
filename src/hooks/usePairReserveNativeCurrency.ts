import { gql, useQuery } from '@apollo/client'
import { ChainId, CurrencyAmount, Pair } from 'dxswap-sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'

const QUERY = gql`
  query($pairId: ID!) {
    pair(id: $pairId) {
      id
      reserveNativeCurrency
    }
  }
`

export function usePairReserveNativeCurrency(pair?: Pair): { loading: boolean; reserveNativeCurrency: CurrencyAmount } {
  const { chainId } = useActiveWeb3React()

  interface QueryResult {
    pair: { reserveNativeCurrency: string }
  }

  const { loading, data, error } = useQuery<QueryResult>(QUERY, {
    variables: { pairId: pair?.liquidityToken.address.toLowerCase() }
  })

  return useMemo(() => {
    if (loading)
      return { loading: true, reserveNativeCurrency: CurrencyAmount.nativeCurrency('0', chainId || ChainId.MAINNET) }
    if (!data || error || !chainId)
      return { loading: false, reserveNativeCurrency: CurrencyAmount.nativeCurrency('0', chainId || ChainId.MAINNET) }
    return {
      loading: false,
      reserveNativeCurrency: CurrencyAmount.nativeCurrency(data.pair.reserveNativeCurrency, chainId)
    }
  }, [data, error, loading, chainId])
}
