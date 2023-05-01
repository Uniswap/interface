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

export function useNftUniversalRouterAddress(): string | undefined {
  const { data } = useNftUniversalRouterAddressQuery({
    fetchPolicy: 'no-cache',
  })

  return useMemo(() => data?.nftRoute?.toAddress, [data])
}
