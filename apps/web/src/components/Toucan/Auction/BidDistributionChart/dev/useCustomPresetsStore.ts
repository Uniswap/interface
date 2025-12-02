// TODO: Remove this file once live auction data is implemented
// Zustand store for persisting custom bid distribution presets to localStorage

import { SavedCustomPreset } from 'components/Toucan/Auction/BidDistributionChart/dev/customPresets'
import { create } from 'zustand'
import { PersistStorage, persist, StorageValue } from 'zustand/middleware'

interface CustomPresetsState {
  presets: SavedCustomPreset[]
  savePreset: (preset: Omit<SavedCustomPreset, 'id' | 'createdAt'>) => void
  updatePreset: (id: string, preset: Omit<SavedCustomPreset, 'id' | 'createdAt'>) => void
  deletePreset: (id: string) => void
  clearAllPresets: () => void
}

// Custom storage implementation that handles Map serialization
const customStorage: PersistStorage<CustomPresetsState> = {
  getItem: (name) => {
    const str = localStorage.getItem(name)
    if (!str) {
      return null
    }
    const parsed = JSON.parse(str)
    if (parsed.state?.presets) {
      parsed.state.presets = parsed.state.presets
        .map((preset: any) => {
          let distributionData: Map<string, string>

          if (preset.distributionData instanceof Map) {
            distributionData = preset.distributionData
          } else if (Array.isArray(preset.distributionData)) {
            distributionData = new Map(preset.distributionData as [string, string][])
          } else if (preset.distributionData && typeof preset.distributionData === 'object') {
            distributionData = new Map(Object.entries(preset.distributionData) as [string, string][])
          } else {
            distributionData = new Map()
          }

          return { ...preset, distributionData }
        })
        .filter((preset: SavedCustomPreset) => preset.distributionData.size > 0)
    }
    return parsed as StorageValue<CustomPresetsState>
  },
  setItem: (name, value) => {
    const serializable = {
      ...value,
      state: {
        ...value.state,
        presets: value.state.presets.map((preset: any) => {
          // Convert Map to array for JSON serialization
          let distributionData: any
          if (preset.distributionData instanceof Map) {
            distributionData = Array.from(preset.distributionData.entries())
          } else if (
            preset.distributionData &&
            typeof preset.distributionData === 'object' &&
            'entries' in preset.distributionData &&
            typeof preset.distributionData.entries === 'function'
          ) {
            // Map-like object with entries method
            distributionData = Array.from(preset.distributionData.entries())
          } else if (Array.isArray(preset.distributionData)) {
            distributionData = preset.distributionData
          } else if (preset.distributionData && typeof preset.distributionData === 'object') {
            // Plain object - convert to array format
            distributionData = Object.entries(preset.distributionData)
          } else {
            distributionData = []
          }

          return {
            ...preset,
            distributionData,
          }
        }),
      },
    }
    localStorage.setItem(name, JSON.stringify(serializable))
  },
  removeItem: (name) => {
    localStorage.removeItem(name)
  },
}

export const useCustomPresetsStore = create<CustomPresetsState>()(
  persist(
    (set) => ({
      presets: [],

      savePreset: (preset) => {
        const newPreset: SavedCustomPreset = {
          ...preset,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        }
        set((state) => ({
          presets: [...state.presets, newPreset],
        }))
      },

      updatePreset: (id, preset) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id
              ? {
                  ...preset,
                  id: p.id, // Keep the same ID
                  createdAt: p.createdAt, // Keep the original creation date
                }
              : p,
          ),
        }))
      },

      deletePreset: (id) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        }))
      },

      clearAllPresets: () => {
        set({ presets: [] })
      },
    }),
    {
      name: 'toucan-custom-bid-presets',
      storage: customStorage,
    },
  ),
)
