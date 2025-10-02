import { NetworkStatus } from '@apollo/client'
import { GraphQLApi, isError } from '@universe/api'
import { useCallback, useState } from 'react'
import { NUM_FIRST_NFTS } from 'uniswap/src/components/nfts/constants'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useGroupNftsByVisibility } from 'uniswap/src/features/nfts/hooks/useGroupNftsByVisibility'
import { type NFTItem } from 'uniswap/src/features/nfts/types'
import { formatNftItems } from 'uniswap/src/features/nfts/utils'

export function useNftListRenderData({ owner, skip }: { owner: Address; skip?: boolean }): {
  nfts: (NFTItem | string)[]
  numHidden: number
  numShown: number
  isErrorState: boolean
  hasNextPage: boolean
  shouldAddInLoadingItem: boolean
  hiddenNftsExpanded: boolean
  setHiddenNftsExpanded: (value: boolean) => void
  networkStatus: NetworkStatus
  onListEndReached: () => Promise<void>
  refetch: () => void
} {
  const { gqlChains } = useEnabledChains()

  const [hiddenNftsExpanded, setHiddenNftsExpanded] = useState(false)

  const { data, fetchMore, refetch, networkStatus } = GraphQLApi.useNftsTabQuery({
    variables: {
      ownerAddress: owner,
      first: NUM_FIRST_NFTS,
      filter: { filterSpam: false },
      chains: gqlChains,
    },
    notifyOnNetworkStatusChange: true, // Used to trigger network state / loading on refetch or fetchMore
    errorPolicy: 'all', // Suppress non-null image.url fields from backend
    skip,
  })

  const nftDataItems = formatNftItems(data)

  const hasNextPage = data?.nftBalances?.pageInfo.hasNextPage

  const onListEndReached = useCallback(async () => {
    if (!hasNextPage) {
      return
    }

    await fetchMore({
      variables: {
        first: NUM_FIRST_NFTS,
        after: data.nftBalances?.pageInfo.endCursor,
      },
    })
  }, [data?.nftBalances?.pageInfo.endCursor, hasNextPage, fetchMore])

  const { nfts, numHidden, numShown } = useGroupNftsByVisibility({
    nftDataItems,
    showHidden: hiddenNftsExpanded,
    allPagesFetched: !data?.nftBalances?.pageInfo.hasNextPage,
  })

  return {
    nfts,
    numHidden,
    numShown,
    refetch,
    networkStatus,
    onListEndReached,
    hiddenNftsExpanded,
    setHiddenNftsExpanded,
    isErrorState: isError(networkStatus, !!data),
    hasNextPage: Boolean(hasNextPage),
    shouldAddInLoadingItem: networkStatus === NetworkStatus.fetchMore && numShown % 2 === 1,
  }
}
