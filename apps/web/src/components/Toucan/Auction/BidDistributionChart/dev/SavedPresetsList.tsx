// TODO: Remove this file once live auction data is implemented
// List of saved custom bid distribution presets

import {
  BID_TOKEN_CONFIGS,
  getBidTokenInfoFromConfig,
  SavedCustomPreset,
  toHumanReadable,
} from 'components/Toucan/Auction/BidDistributionChart/dev/customPresets'
import { getDatasetLabel } from 'components/Toucan/Auction/BidDistributionChart/dev/devUtils'
import { useCustomPresetsStore } from 'components/Toucan/Auction/BidDistributionChart/dev/useCustomPresetsStore'
import { useMockDataStore } from 'components/Toucan/Auction/store/mocks/useMockDataStore'
import { useState } from 'react'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { Edit } from 'ui/src/components/icons/Edit'
import { Trash } from 'ui/src/components/icons/Trash'

interface SavedPresetsListProps {
  onClose: () => void
  onEditPreset: (preset: SavedCustomPreset) => void
}

export const SavedPresetsList = ({ onClose, onEditPreset }: SavedPresetsListProps) => {
  const { presets, deletePreset, clearAllPresets } = useCustomPresetsStore()
  const { loadCustomPreset, selectedPresetId } = useMockDataStore()
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const handleLoadPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      loadCustomPreset(preset)
      onClose()
    }
  }

  const handleClearAll = () => {
    if (showConfirmClear) {
      clearAllPresets()
      setShowConfirmClear(false)
    } else {
      setShowConfirmClear(true)
    }
  }

  // Empty state
  if (presets.length === 0) {
    return (
      <Flex gap="$spacing16" alignItems="center" py="$spacing24">
        <Text variant="body2" color="$neutral2" textAlign="center">
          No custom presets saved.
        </Text>
        <Text variant="body3" color="$neutral3" textAlign="center">
          Create one in the Customize tab.
        </Text>
      </Flex>
    )
  }

  return (
    <Flex gap="$spacing12">
      <Text variant="heading3" color="$neutral1">
        Saved Presets
      </Text>

      <Flex gap="$spacing8">
        {presets.map((preset) => {
          // Create preset-specific bidTokenInfo using its own config (not the active chart's token)
          const presetBidTokenInfo = getBidTokenInfoFromConfig(preset.bidToken)
          const label = getDatasetLabel(preset.distributionData, presetBidTokenInfo)
          const config = BID_TOKEN_CONFIGS[preset.bidToken]
          const isSelected = selectedPresetId === preset.id

          // Calculate volume range and clearing price for display
          const minVolumeHuman = toHumanReadable(preset.bidVolumeMin, config.decimals)
          const maxVolumeHuman = toHumanReadable(preset.bidVolumeMax, config.decimals)
          const clearingPriceHuman = toHumanReadable(preset.clearingPrice, config.decimals)

          return (
            <Flex
              key={preset.id}
              row
              gap="$spacing12"
              alignItems="center"
              backgroundColor={isSelected ? '$surface3' : '$surface2'}
              p="$spacing12"
              borderRadius="$rounded12"
              borderWidth={isSelected ? 2 : 0}
              borderColor={isSelected ? '$white' : undefined}
            >
              <TouchableArea flex={1} onPress={() => handleLoadPreset(preset.id)} hoverStyle={{ opacity: 0.8 }}>
                <Flex gap="$spacing4">
                  <Flex row gap="$spacing8" alignItems="center">
                    <Text
                      variant="body2"
                      color={isSelected ? '$accent1' : '$neutral1'}
                      fontWeight={isSelected ? '600' : '400'}
                    >
                      {label.tickCount} Ticks ({config.symbol})
                    </Text>
                    <Text variant="body3" color={isSelected ? '$neutral2' : '$neutral3'} fontWeight="400">
                      ${label.minPrice.toFixed(2)} - ${label.maxPrice.toFixed(2)}
                    </Text>
                  </Flex>
                  <Text variant="body4" color="$neutral3">
                    {preset.name}
                  </Text>
                  <Text variant="body4" color="$neutral3">
                    Volume per tick: ${minVolumeHuman} - ${maxVolumeHuman}
                  </Text>
                  <Text variant="body4" color="$neutral3">
                    Clearing Price: ${clearingPriceHuman}
                  </Text>
                </Flex>
              </TouchableArea>

              <Flex row gap="$spacing4">
                <TouchableArea
                  onPress={() => onEditPreset(preset)}
                  p="$spacing8"
                  hoverStyle={{ backgroundColor: '$surface3' }}
                  borderRadius="$rounded8"
                >
                  <Edit size="$icon.16" color="$neutral3" />
                </TouchableArea>

                <TouchableArea
                  onPress={() => deletePreset(preset.id)}
                  p="$spacing8"
                  hoverStyle={{ backgroundColor: '$surface3' }}
                  borderRadius="$rounded8"
                >
                  <Trash size="$icon.16" color="$neutral3" />
                </TouchableArea>
              </Flex>
            </Flex>
          )
        })}
      </Flex>

      {/* Clear All Button */}
      <Flex mt="$spacing8">
        {showConfirmClear ? (
          <Flex gap="$spacing8">
            <Text variant="body3" color="$statusCritical" textAlign="center">
              Are you sure you want to delete all presets?
            </Text>
            <Flex row gap="$spacing8">
              <Button flex={1} onPress={handleClearAll} backgroundColor="$statusCritical">
                <Text variant="buttonLabel3" color="$white">
                  Yes, Clear All
                </Text>
              </Button>
              <Button flex={1} onPress={() => setShowConfirmClear(false)} backgroundColor="$surface3">
                <Text variant="buttonLabel3">Cancel</Text>
              </Button>
            </Flex>
          </Flex>
        ) : (
          <Button onPress={() => setShowConfirmClear(true)} backgroundColor="$surface3">
            <Text variant="buttonLabel3">Clear All Presets</Text>
          </Button>
        )}
      </Flex>
    </Flex>
  )
}
