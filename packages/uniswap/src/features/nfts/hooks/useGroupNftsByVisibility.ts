import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { EMPTY_NFT_ITEM, HIDDEN_NFTS_ROW } from 'uniswap/src/features/nfts/constants'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { getIsNftHidden } from 'uniswap/src/features/nfts/utils'
import { selectNftsVisibility } from 'uniswap/src/features/visibility/selectors'

// Apply to NFTs fetched from API hidden filter, which is stored in Redux
export function useGroupNftsByVisibility({
  nftDataItems,
  showHidden,
  allPagesFetched,
}: {
  nftDataItems: Array<NFTItem> | undefined
  showHidden: boolean
  allPagesFetched: boolean
}): {
  nfts: Array<NFTItem | string>
  numHidden: number
  numShown: number
} {
  const nftVisibility = useSelector(selectNftsVisibility)
  return useMemo(() => {
    const { shown, hidden } = (nftDataItems ?? []).reduce<{
      shown: NFTItem[]
      hidden: NFTItem[]
    }>(
      (acc, item) => {
        const isNftHidden = getIsNftHidden({
          contractAddress: item.contractAddress,
          tokenId: item.tokenId,
          isSpam: item.isSpam,
          nftVisibility,
        })
        if (isNftHidden) {
          acc.hidden.push(item)
        } else {
          acc.shown.push(item)
        }
        return acc
      },
      { shown: [], hidden: [] },
    )
    return {
      nfts: [
        ...shown,
        ...(hidden.length && allPagesFetched
          ? [
              // to fill the gap for odd number of shown elements in 2 columns layout
              ...(shown.length % 2 ? [EMPTY_NFT_ITEM] : []),
              HIDDEN_NFTS_ROW,
            ]
          : []),
        ...(showHidden && allPagesFetched ? hidden : []),
      ],
      numHidden: hidden.length,
      numShown: shown.length,
    }
  }, [nftDataItems, nftVisibility, showHidden, allPagesFetched])
}
