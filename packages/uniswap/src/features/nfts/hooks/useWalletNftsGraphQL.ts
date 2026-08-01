import { NetworkStatus } from '@apollo/client'
import { GraphQLApi, isNonPollingRequestInFlight } from '@universe/api'
import { isMobileWeb } from '@universe/environment'
import { useCallback, useMemo } from 'react'
import { MOBILE_WEB_NUM_NEXT_NFTS, NUM_NEXT_NFTS } from 'uniswap/src/components/nfts/constants'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import type { UseWalletNftsProps, UseWalletNftsResult } from 'uniswap/src/features/nfts/hooks/types'
import { type NFTItem } from 'uniswap/src/features/nfts/types'
import { formatNftItems } from 'uniswap/src/features/nfts/utils'

export function useWalletNftsGraphQL({
  address,
  filterSpam = false,
  skip,
  chainsFilter,
  pollInterval,
  pageSize,
}: UseWalletNftsProps): UseWalletNftsResult {
  const { gqlChains } = useEnabledChains()
  const gqlChainsParam = chainsFilter?.map(toGraphQLChain)
  const chains = gqlChainsParam ?? gqlChains

  const { data, fetchMore, refetch, networkStatus, loading } = GraphQLApi.useNftsTabQuery({
    variables: {
      ownerAddress: address,
      first: pageSize,
      filter: { filterSpam },
      chains,
    },
    notifyOnNetworkStatusChange: true, // Used to trigger network state / loading on refetch or fetchMore
    errorPolicy: 'all', // Suppress non-null image.url fields from backend
    skip,
    nextFetchPolicy: 'cache-and-network',
    pollInterval,
  })

  const nftDataItems = useMemo(() => formatNftItems(data), [data])

  const hasNextPage = data?.nftBalances?.pageInfo.hasNextPage

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage) {
      return
    }

    await fetchMore({
      variables: {
        first: isMobileWeb ? MOBILE_WEB_NUM_NEXT_NFTS : NUM_NEXT_NFTS,
        after: data.nftBalances?.pageInfo.endCursor,
      },
    })
  }, [data?.nftBalances?.pageInfo.endCursor, hasNextPage, fetchMore])

  return {
    nfts: nftDataItems ?? ([] as NFTItem[]),
    refetch,
    loading,
    isPending: isNonPollingRequestInFlight(networkStatus),
    isError: networkStatus === NetworkStatus.error,
    isFetchingMore: networkStatus === NetworkStatus.fetchMore,
    fetchNextPage,
    hasNextPage: Boolean(hasNextPage),
  }
}
