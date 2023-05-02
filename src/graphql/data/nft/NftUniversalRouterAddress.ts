import gql from 'graphql-tag'
import { useMemo } from 'react'

import { useNftUniversalRouterAddressQuery } from '../__generated__/types-and-hooks'

gql`
  query NftUniversalRouterAddress($chain: Chain = ETHEREUM) {
    nftRoute(chain: $chain, senderAddress: "", nftTrades: []) {
      toAddress
    }
  }
`

export function useNftUniversalRouterAddress() {
  const { data, loading } = useNftUniversalRouterAddressQuery({
    fetchPolicy: 'no-cache',
  })

  return useMemo(
    () => ({
      universalRouterAddress: data?.nftRoute?.toAddress,
      universalRouterAddressIsLoading: loading,
    }),
    [data?.nftRoute?.toAddress, loading]
  )
}
