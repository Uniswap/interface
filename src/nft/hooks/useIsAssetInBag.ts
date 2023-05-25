import { GenieAsset } from 'nft/types'
import { useMemo } from 'react'

import { useBag } from './useBag'

export function useIsAssetInBag(asset: GenieAsset): boolean {
  const itemsInBag = useBag((state) => state.itemsInBag)

  return useMemo(() => {
    return itemsInBag.some((item) => asset.tokenId === item.asset.tokenId && asset.address === item.asset.address)
  }, [asset, itemsInBag])
}
