import gql from 'graphql-tag'

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
    // no cache because a different version of nftRoute query is going to be called around the same time
    fetchPolicy: 'no-cache',
  })

  return {
    universalRouterAddress: data?.nftRoute?.toAddress,
    universalRouterAddressIsLoading: loading,
  }
}
