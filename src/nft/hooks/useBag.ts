import create from 'zustand'
import { devtools } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

import { BagItem, BagItemStatus, BagStatus, UpdatedGenieAsset } from '../types'

type BagState = {
  bagStatus: BagStatus
  itemsInBag: BagItem[]
  addAssetToBag: (asset: UpdatedGenieAsset) => void
  removeAssetFromBag: (asset: UpdatedGenieAsset) => void
  isLocked: boolean
  setLocked: (isLocked: boolean) => void
  didOpenUnavailableAssets: boolean

  bagExpanded: boolean
  toggleBag: () => void
}

export const useBag = create<BagState>()(
  devtools(
    (set, get) => ({
      bagStatus: BagStatus.ADDING_TO_BAG,

      didOpenUnavailableAssets: false,
      setDidOpenUnavailableAssets: (didOpen) =>
        set(() => ({
          didOpenUnavailableAssets: didOpen,
        })),
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
          if (get().isLocked) return { itemsInBag: itemsInBag }
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
          if (get().isLocked) return { itemsInBag: itemsInBag }
          if (itemsInBag.length === 0) return { itemsInBag: [] }
          const itemsCopy = [...itemsInBag]
          const index = itemsCopy.findIndex((n) =>
            asset.id ? n.asset.id === asset.id : n.asset.tokenId === asset.tokenId && n.asset.address === asset.address
          )
          if (index === -1) return { itemsInBag: itemsInBag }
          itemsCopy.splice(index, 1)
          return { itemsInBag: itemsCopy }
        })
      },
    }),
    { name: 'useBag' }
  )
)
