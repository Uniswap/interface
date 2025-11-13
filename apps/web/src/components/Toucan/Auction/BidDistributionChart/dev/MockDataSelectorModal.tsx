// TODO: Remove this file once live auction data is implemented
// Modal for selecting mock bid distribution data in development

import { CustomizePresetForm } from 'components/Toucan/Auction/BidDistributionChart/dev/CustomizePresetForm'
import { SavedCustomPreset } from 'components/Toucan/Auction/BidDistributionChart/dev/customPresets'
import { getDatasetLabel } from 'components/Toucan/Auction/BidDistributionChart/dev/devUtils'
import { SavedPresetsList } from 'components/Toucan/Auction/BidDistributionChart/dev/SavedPresetsList'
import { MOCK_BID_DISTRIBUTION_DATASETS } from 'components/Toucan/Auction/store/mocks/distributionData/bidDistributionMockData'
import { useMockDataStore } from 'components/Toucan/Auction/store/mocks/useMockDataStore'
import { BidTokenInfo } from 'components/Toucan/Auction/store/types'
import { useMemo, useState } from 'react'
import { Flex, SegmentedControl, Text, TouchableArea } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

type TabType = 'quick' | 'customize' | 'saved'

interface MockDataSelectorModalProps {
  bidTokenInfo: BidTokenInfo
}

export const MockDataSelectorModal = ({ bidTokenInfo }: MockDataSelectorModalProps) => {
  // Quick select datasets are all USDC-based, so use hardcoded USDC info for labels
  // This prevents display issues when an ETH preset is selected as active
  const quickSelectBidTokenInfo: BidTokenInfo = {
    symbol: 'USDC',
    decimals: 6,
    priceFiat: 1,
  }
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('quick')
  const [editingPreset, setEditingPreset] = useState<SavedCustomPreset | null>(null)
  const { selectedDatasetIndex, setSelectedDatasetIndex } = useMockDataStore()

  const datasetLabels = useMemo(() => {
    return MOCK_BID_DISTRIBUTION_DATASETS.map((dataset) => getDatasetLabel(dataset, quickSelectBidTokenInfo))
  }, [])

  const handleSelectDataset = (index: number) => {
    setSelectedDatasetIndex(index)
    setIsOpen(false)
  }

  const handleEditPreset = (preset: SavedCustomPreset) => {
    setEditingPreset(preset)
    setActiveTab('customize')
  }

  const handleCloseModal = () => {
    setIsOpen(false)
    setEditingPreset(null)
    // Reset to quick tab when closing
    setTimeout(() => setActiveTab('quick'), 300)
  }

  const handleCloseCustomizeForm = () => {
    setEditingPreset(null)
    setIsOpen(false)
    // Reset to quick tab when closing
    setTimeout(() => setActiveTab('quick'), 300)
  }

  return (
    <>
      {/* TODO | Toucan: Remove this dev button once live */}
      <TouchableArea onPress={() => setIsOpen(true)}>
        <Text variant="body4" color="$accent1" textDecorationLine="underline">
          dev
        </Text>
      </TouchableArea>

      <Modal isModalOpen={isOpen} onClose={handleCloseModal} name={ModalName.DevMockDataSelector}>
        <Flex
          p="$spacing2"
          gap="$spacing16"
          backgroundColor="$surface1"
          borderRadius="$rounded16"
          maxWidth={850}
          width="100%"
        >
          <Text variant="heading3" color="$neutral1">
            Bid Distribution Data
          </Text>

          {/* Tab Selector */}
          <SegmentedControl
            options={[
              { value: 'quick', display: <Text variant="buttonLabel4">Quick Select</Text> },
              { value: 'customize', display: <Text variant="buttonLabel4">Customize</Text> },
              { value: 'saved', display: <Text variant="buttonLabel4">Saved</Text> },
            ]}
            selectedOption={activeTab}
            onSelectOption={(value) => setActiveTab(value as TabType)}
          />

          {/* Tab Content */}
          {activeTab === 'quick' && (
            <Flex gap="$spacing8">
              {MOCK_BID_DISTRIBUTION_DATASETS.map((dataset, index) => {
                const { tickCount, minPrice, maxPrice } = datasetLabels[index]
                const isSelected = selectedDatasetIndex === index

                return (
                  <TouchableArea
                    key={index}
                    onPress={() => handleSelectDataset(index)}
                    backgroundColor={isSelected ? '$surface3' : '$surface2'}
                    p="$spacing12"
                    borderRadius="$rounded12"
                    hoverStyle={{ backgroundColor: '$surface3' }}
                  >
                    <Flex row gap="$spacing8" alignItems="center">
                      <Text
                        variant="body2"
                        color={isSelected ? '$accent1' : '$neutral1'}
                        fontWeight={isSelected ? '600' : '400'}
                      >
                        {tickCount} Ticks
                      </Text>
                      <Text variant="body3" color={isSelected ? '$neutral2' : '$neutral3'} fontWeight="400">
                        ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
                      </Text>
                    </Flex>
                  </TouchableArea>
                )
              })}
            </Flex>
          )}

          {activeTab === 'customize' && (
            <CustomizePresetForm onClose={handleCloseCustomizeForm} editingPreset={editingPreset} />
          )}

          {activeTab === 'saved' && <SavedPresetsList onClose={handleCloseModal} onEditPreset={handleEditPreset} />}
        </Flex>
      </Modal>
    </>
  )
}
