import { isMobileWeb } from '@universe/environment'
import { useCallback, useState } from 'react'
import { MOBILE_WEB_NUM_FIRST_NFTS, NUM_FIRST_NFTS } from 'uniswap/src/components/nfts/constants'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useGroupNftsByVisibility } from 'uniswap/src/features/nfts/hooks/useGroupNftsByVisibility'
import { useWalletNfts } from 'uniswap/src/features/nfts/hooks/useWalletNfts'
import { type NFTItem } from 'uniswap/src/features/nfts/types'

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
    pageSize: isMobileWeb ? MOBILE_WEB_NUM_FIRST_NFTS : NUM_FIRST_NFTS,
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
    isPending,
    // Don't show error state when query is intentionally skipped
    isErrorState: !skip && nftDataItems.length === 0 && isError,
    hasNextPage: Boolean(hasNextPage),
    shouldAddInLoadingItem: isFetchingMore && numShown % 2 === 1,
  }
}
