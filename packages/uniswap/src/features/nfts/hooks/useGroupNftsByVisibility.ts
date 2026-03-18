import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { buildNftsArray, getIsNftHidden } from 'uniswap/src/features/nfts/utils'
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
  hiddenNfts: NFTItem[]
  shownNfts: NFTItem[]
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
      nfts: buildNftsArray({
        shownNfts: shown,
        hiddenNfts: hidden,
        showHidden,
        allPagesFetched,
      }),
      numHidden: hidden.length,
      numShown: shown.length,
      hiddenNfts: hidden,
      shownNfts: shown,
    }
  }, [nftDataItems, nftVisibility, showHidden, allPagesFetched])
}
