// TODO | Toucan: Remove this file once live auction data is implemented
// Temporary zustand store for selecting mock bid distribution data in development

import { SavedCustomPreset } from 'components/Toucan/Auction/BidDistributionChart/dev/customPresets'
import { MOCK_BID_DISTRIBUTION_DATASETS } from 'components/Toucan/Auction/store/mocks/distributionData/bidDistributionMockData'
import { BidDistributionData } from 'components/Toucan/Auction/store/types'
import { create } from 'zustand'

interface MockDataState {
  // Dataset selection
  selectedDatasetIndex: number
  selectedDataset: BidDistributionData
  isCustomPreset: boolean
  selectedPresetId: string | null // Track which custom preset is selected
  setSelectedDatasetIndex: (index: number) => void

  // Test parameters (for customization)
  bidTokenAddress: string
  tickSize: string
  clearingPrice: string
  totalSupply: string
  setTestParameters: (params: {
    bidTokenAddress: string
    tickSize: string
    clearingPrice: string
    totalSupply: string
  }) => void

  // Custom preset management
  loadCustomPreset: (preset: SavedCustomPreset) => void
  resetToDefaults: () => void
}

// Default values from FAKE_AUCTION_DATA
const DEFAULT_BID_TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // USDC
const DEFAULT_TICK_SIZE = '500000' // 0.50 USDC
const DEFAULT_CLEARING_PRICE = '5000000' // 5.00 USDC
const DEFAULT_TOTAL_SUPPLY = '1000000000000000000000000000' // 1B tokens with 18 decimals

export const useMockDataStore = create<MockDataState>((set) => ({
  // Dataset selection
  selectedDatasetIndex: 0,
  selectedDataset: MOCK_BID_DISTRIBUTION_DATASETS[0],
  isCustomPreset: false,
  selectedPresetId: null,
  setSelectedDatasetIndex: (index: number) =>
    set({
      selectedDatasetIndex: index,
      selectedDataset: MOCK_BID_DISTRIBUTION_DATASETS[index],
      isCustomPreset: false,
      selectedPresetId: null, // Clear preset ID when selecting quick preset
      // Reset ALL test parameters to defaults when selecting quick presets
      bidTokenAddress: DEFAULT_BID_TOKEN_ADDRESS,
      tickSize: DEFAULT_TICK_SIZE,
      clearingPrice: DEFAULT_CLEARING_PRICE,
      totalSupply: DEFAULT_TOTAL_SUPPLY,
    }),

  // Test parameters
  bidTokenAddress: DEFAULT_BID_TOKEN_ADDRESS,
  tickSize: DEFAULT_TICK_SIZE,
  clearingPrice: DEFAULT_CLEARING_PRICE,
  totalSupply: DEFAULT_TOTAL_SUPPLY,
  setTestParameters: (params) =>
    set({
      bidTokenAddress: params.bidTokenAddress,
      tickSize: params.tickSize,
      clearingPrice: params.clearingPrice,
      totalSupply: params.totalSupply,
    }),

  // Custom preset management
  loadCustomPreset: (preset) => {
    set({
      selectedDataset: preset.distributionData,
      selectedDatasetIndex: -1, // Indicates custom preset
      isCustomPreset: true,
      selectedPresetId: preset.id, // Store the specific preset ID
      bidTokenAddress: preset.bidTokenAddress, // Load actual token address from preset
      tickSize: preset.tickSize,
      clearingPrice: preset.clearingPrice,
      totalSupply: preset.totalSupply,
    })
  },

  resetToDefaults: () =>
    set({
      selectedDatasetIndex: 0,
      selectedDataset: MOCK_BID_DISTRIBUTION_DATASETS[0],
      isCustomPreset: false,
      selectedPresetId: null,
      bidTokenAddress: DEFAULT_BID_TOKEN_ADDRESS,
      tickSize: DEFAULT_TICK_SIZE,
      clearingPrice: DEFAULT_CLEARING_PRICE,
      totalSupply: DEFAULT_TOTAL_SUPPLY,
    }),
}))
