import { NetworkStatus } from '@apollo/client'
import { GraphQLApi, isError } from '@universe/api'
import { useCallback, useState } from 'react'
import { NUM_FIRST_NFTS } from 'uniswap/src/components/nfts/constants'
import type { NftsNextFetchPolicy } from 'uniswap/src/components/nfts/types'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useGroupNftsByVisibility } from 'uniswap/src/features/nfts/hooks/useGroupNftsByVisibility'
import { type NFTItem } from 'uniswap/src/features/nfts/types'
import { formatNftItems } from 'uniswap/src/features/nfts/utils'

export function useNftListRenderData({
  owner,
  skip,
  chainsFilter,
  nextFetchPolicy,
  pollInterval,
}: {
  owner: Address
  skip?: boolean
  chainsFilter?: UniverseChainId[]
  nextFetchPolicy?: NftsNextFetchPolicy
  pollInterval?: PollingInterval
}): {
  nfts: (NFTItem | string)[]
  numHidden: number
  numShown: number
  hiddenNfts: NFTItem[]
  shownNfts: NFTItem[]
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
  const gqlChainsParam = chainsFilter?.map(toGraphQLChain)
  const chains = gqlChainsParam ?? gqlChains

  const [hiddenNftsExpanded, setHiddenNftsExpanded] = useState(false)

  const { data, fetchMore, refetch, networkStatus } = GraphQLApi.useNftsTabQuery({
    variables: {
      ownerAddress: owner,
      first: NUM_FIRST_NFTS,
      filter: { filterSpam: false },
      chains,
    },
    notifyOnNetworkStatusChange: true, // Used to trigger network state / loading on refetch or fetchMore
    errorPolicy: 'all', // Suppress non-null image.url fields from backend
    skip,
    nextFetchPolicy,
    pollInterval,
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

  const { nfts, numHidden, numShown, hiddenNfts, shownNfts } = useGroupNftsByVisibility({
    nftDataItems,
    showHidden: hiddenNftsExpanded,
    allPagesFetched: !data?.nftBalances?.pageInfo.hasNextPage,
  })

  return {
    nfts,
    numHidden,
    numShown,
    hiddenNfts,
    shownNfts,
    refetch,
    networkStatus,
    onListEndReached,
    hiddenNftsExpanded,
    setHiddenNftsExpanded,
    // Don't show error state when query is intentionally skipped
    isErrorState: skip ? false : isError(networkStatus, !!data),
    hasNextPage: Boolean(hasNextPage),
    shouldAddInLoadingItem: networkStatus === NetworkStatus.fetchMore && numShown % 2 === 1,
  }
}
