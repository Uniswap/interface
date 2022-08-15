import { v4 as uuidv4 } from 'uuid'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { GenieAsset } from '../types'

interface SelectAssetState {
  selectedAssets: GenieAsset[]
  selectAsset: (asset: GenieAsset) => void
  removeAsset: (asset: GenieAsset) => void
  reset: () => void
}

export const useSelectAsset = create<SelectAssetState>()(
  devtools((set) => ({
    selectedAssets: [],
    selectAsset: (asset) =>
      set(({ selectedAssets }) => {
        const assetWithId = { id: uuidv4(), ...asset }
        if (selectedAssets.length === 0) return { selectedAssets: [assetWithId] }
        else return { selectedAssets: [...selectedAssets, assetWithId] }
      }),
    removeAsset: (asset) => {
      set(({ selectedAssets }) => {
        if (selectedAssets.length === 0) return { selectedAssets: [] }
        else selectedAssets.find((x) => x.tokenId === asset.tokenId && x.address === asset.address)
        const assetsCopy = [...selectedAssets]
        assetsCopy.splice(
          selectedAssets.findIndex((n) => n.tokenId === asset.tokenId && n.address === asset.address),
          1
        )
        return { selectedAssets: assetsCopy }
      })
    },
    reset: () => set(() => ({ selectedAssets: [] })),
  }))
)
