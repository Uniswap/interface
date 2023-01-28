import { Column } from 'nft/components/Flex'
import { useBag, useIsMobile } from 'nft/hooks'
import { BagItemStatus } from 'nft/types'
import { fetchPrice, recalculateBagUsingPooledAssets } from 'nft/utils'
import { useMemo } from 'react'
import { useQuery } from 'react-query'

import { BagRow } from './BagRow'

export const SaveForLaterContent = () => {
  const uncheckedItemsInBag = useBag((state) => state.itemsInBag)
  const addAssetsToBag = useBag((state) => state.addAssetsToBag)
  const removeAssetsFromBag = useBag((state) => state.removeAssetsFromBag)
  const itemsInBag = useMemo(() => {
    return recalculateBagUsingPooledAssets(uncheckedItemsInBag)
  }, [uncheckedItemsInBag])

  const { data: fetchedPriceData } = useQuery(['fetchPrice', {}], () => fetchPrice(), {})

  const { saveForLaterAssets } = useMemo(() => {
    const saveForLaterAssets = itemsInBag
      .filter((item) => item.status === BagItemStatus.SAVED_FOR_LATER)
      .map((item) => item.asset)
    return { saveForLaterAssets }
  }, [itemsInBag])

  const isMobile = useIsMobile()

  return (
    <Column>
      {saveForLaterAssets
        .slice(0)
        .reverse()
        .map((asset) => (
          <BagRow
            key={asset.id}
            asset={asset}
            usdPrice={fetchedPriceData}
            addAsset={addAssetsToBag}
            removeAsset={removeAssetsFromBag}
            showRemove={true}
            isMobile={isMobile}
          />
        ))}
    </Column>
  )
}
