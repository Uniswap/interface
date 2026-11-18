import { UniverseChainId } from '@universe/chains'
import { isMobileWeb } from '@universe/environment'
import { useCallback, useEffect, useState } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useWalletNfts } from 'uniswap/src/data/apiClients/dataApiService/nfts/useWalletNfts'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useGroupNftsByVisibility } from 'uniswap/src/features/nfts/hooks/useGroupNftsByVisibility'
import { type NFTItem } from 'uniswap/src/features/nfts/types'

export const NFT_LIST_PAGE_SIZE = isMobileWeb ? 20 : 30

export function useNftListRenderData({
  owner,
  skip,
  chainsFilter,
  pollInterval,
}: {
  owner: Address
  skip?: boolean
  chainsFilter?: UniverseChainId[]
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
  isError: boolean
  isPending: boolean
  isFetchingMore: boolean
  onListEndReached: () => Promise<void>
  refetch: () => void
} {
  const { chains: enabledChains } = useEnabledChains()
  const chains = chainsFilter ?? enabledChains

  const [hiddenNftsExpanded, setHiddenNftsExpanded] = useState(false)

  const {
    nfts: nftDataItems,
    hasNextPage,
    isError,
    isPending,
    isFetchingMore,
    fetchNextPage,
    refetch,
  } = useWalletNfts({
    address: owner,
    skip,
    filterSpam: false,
    chainsFilter: chains,
    pageSize: NFT_LIST_PAGE_SIZE,
    pollInterval,
  })

  const onListEndReached = useCallback(async () => {
    if (hasNextPage) {
      await fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage])

  const { nfts, numHidden, numShown, hiddenNfts, shownNfts } = useGroupNftsByVisibility({
    nftDataItems,
    showHidden: hiddenNftsExpanded,
    allPagesFetched: !hasNextPage,
  })

  // The hidden row only renders once every page is fetched, so a page of only hidden NFTs leaves nothing
  // to scroll and onEndReached never fires. Keep paging until something is shown or pages run out.
  const isPagingForShownNfts = !skip && numShown === 0 && hasNextPage
  const shouldFetchNextPage = isPagingForShownNfts && !isFetchingMore && !isError
  useEffect(() => {
    if (shouldFetchNextPage) {
      void fetchNextPage()
    }
    // A fast page can land without isFetchingMore ever rendering true, so re-check on every new page
  }, [shouldFetchNextPage, fetchNextPage, nftDataItems])

  return {
    nfts,
    numHidden,
    numShown,
    hiddenNfts,
    shownNfts,
    refetch,
    isFetchingMore,
    onListEndReached,
    hiddenNftsExpanded,
    setHiddenNftsExpanded,
    isError,
    // A skipped query stays pending forever, so suppress loading/error states for it
    isPending: (!skip && isPending) || (isPagingForShownNfts && !isError),
    isErrorState: !skip && (nftDataItems.length === 0 || isPagingForShownNfts) && isError,
    hasNextPage: Boolean(hasNextPage),
    shouldAddInLoadingItem: isFetchingMore && numShown % 2 === 1,
  }
}
