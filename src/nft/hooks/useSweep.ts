import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import { GenieAsset } from '../types'

interface SweepState {
  sweepAssets: GenieAsset[]
  setSweepAssets: (assets: GenieAsset[]) => void
  removeSweepAsset: (asset: GenieAsset) => void
  reset: () => void
}

export const useSweep = create<SweepState>()(
  persist(
    devtools((set) => ({
      sweepAssets: [],
      setSweepAssets: (assets) =>
        set(() => {
          return { sweepAssets: assets }
        }),
      removeSweepAsset: (asset) => {
        set(({ sweepAssets }) => {
          if (sweepAssets.length === 0) return { sweepAssets: [] }
          else sweepAssets.find((x) => x.tokenId === asset.tokenId && x.address === asset.address)
          const assetsCopy = [...sweepAssets]
          assetsCopy.splice(
            sweepAssets.findIndex((n) => n.tokenId === asset.tokenId && n.address === asset.address),
            1
          )
          return { sweepAssets: assetsCopy }
        })
      },
      reset: () => set(() => ({ sweepAssets: [] })),
    })),
    { name: 'useSweep' }
  )
)
