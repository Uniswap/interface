import { v4 as uuidv4 } from 'uuid'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { BagItem, BagItemStatus, BagStatus, UpdatedGenieAsset } from '../types'

type BagState = {
  itemsInBag: BagItem[]
  addAssetToBag: (asset: UpdatedGenieAsset) => void
  removeAssetFromBag: (asset: UpdatedGenieAsset) => void
  isLocked: boolean
  setLocked: (isLocked: boolean) => void
  bagExpanded: boolean
  toggleBag: () => void
}

export const useBag = create<BagState>()(
  devtools(
    (set, get) => ({
      bagExpanded: false,
      toggleBag: () =>
        set(({ bagExpanded }) => ({
          bagExpanded: !bagExpanded,
        })),
      isLocked: false,
      setLocked: (_isLocked) =>
        set(() => ({
          isLocked: _isLocked,
        })),
      itemsInBag: [],
      addAssetToBag: (asset) =>
        set(({ itemsInBag }) => {
          if (get().isLocked) return { itemsInBag }
          const assetWithId = { asset: { id: uuidv4(), ...asset }, status: BagItemStatus.ADDED_TO_BAG }
          if (itemsInBag.length === 0)
            return {
              itemsInBag: [assetWithId],
              bagStatus: BagStatus.ADDING_TO_BAG,
            }
          else
            return {
              itemsInBag: [...itemsInBag, assetWithId],
              bagStatus: BagStatus.ADDING_TO_BAG,
            }
        }),
      removeAssetFromBag: (asset) => {
        set(({ itemsInBag }) => {
          if (get().isLocked) return { itemsInBag }
          if (itemsInBag.length === 0) return { itemsInBag: [] }
          const itemsCopy = [...itemsInBag]
          const index = itemsCopy.findIndex((n) =>
            asset.id ? n.asset.id === asset.id : n.asset.tokenId === asset.tokenId && n.asset.address === asset.address
          )
          if (index === -1) return { itemsInBag }
          itemsCopy.splice(index, 1)
          return { itemsInBag: itemsCopy }
        })
      },
    }),
    { name: 'useBag' }
  )
)
