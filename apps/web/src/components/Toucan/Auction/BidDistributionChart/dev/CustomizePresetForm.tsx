// TODO: Remove this file once live auction data is implemented
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: dev-only file with intentional dependencies */
// Form for customizing and generating bid distribution presets

import {
  AUCTION_TOKEN_DECIMALS,
  BID_TOKEN_CONFIGS,
  CustomPresetParams,
  fromHumanReadable,
  generatePresetName,
  generateRandomBidDistribution,
  SavedCustomPreset,
  toHumanReadable,
  validateTickCount,
} from 'components/Toucan/Auction/BidDistributionChart/dev/customPresets'
import { useCustomPresetsStore } from 'components/Toucan/Auction/BidDistributionChart/dev/useCustomPresetsStore'
import { useMockDataStore } from 'components/Toucan/Auction/store/mocks/useMockDataStore'
import { useCallback, useEffect, useState } from 'react'
import { Button, Flex, Input, SegmentedControl, Text } from 'ui/src'

interface CustomizePresetFormProps {
  onClose: () => void
  editingPreset?: SavedCustomPreset | null
}

export const CustomizePresetForm = ({ onClose, editingPreset }: CustomizePresetFormProps) => {
  const savePreset = useCustomPresetsStore((state) => state.savePreset)
  const updatePreset = useCustomPresetsStore((state) => state.updatePreset)
  const loadCustomPreset = useMockDataStore((state) => state.loadCustomPreset)

  const isEditMode = !!editingPreset

  // Form state
  const [bidToken, setBidToken] = useState<'USDC' | 'ETH'>('USDC')
  const [tickSizeHuman, setTickSizeHuman] = useState(BID_TOKEN_CONFIGS.USDC.defaultTickSizeHuman)
  const [clearingPriceHuman, setClearingPriceHuman] = useState(BID_TOKEN_CONFIGS.USDC.defaultClearingPriceHuman)
  const [tickRangeMin, setTickRangeMin] = useState('1')
  const [tickRangeMax, setTickRangeMax] = useState('100')
  const [tickCount, setTickCount] = useState('20')
  const [bidVolumeMinHuman, setBidVolumeMinHuman] = useState('1000')
  const [bidVolumeMaxHuman, setBidVolumeMaxHuman] = useState('10000')
  const [totalSupply, setTotalSupply] = useState('1000000000')

  // Load editing preset values
  useEffect(() => {
    if (editingPreset) {
      const config = BID_TOKEN_CONFIGS[editingPreset.bidToken]
      setBidToken(editingPreset.bidToken)
      setTickSizeHuman(toHumanReadable(editingPreset.tickSize, config.decimals))
      setClearingPriceHuman(toHumanReadable(editingPreset.clearingPrice, config.decimals))
      setTickRangeMin(editingPreset.tickRangeMin.toString())
      setTickRangeMax(editingPreset.tickRangeMax.toString())
      setTickCount(editingPreset.tickCount.toString())
      setBidVolumeMinHuman(toHumanReadable(editingPreset.bidVolumeMin, config.decimals))
      setBidVolumeMaxHuman(toHumanReadable(editingPreset.bidVolumeMax, config.decimals))
      // Convert totalSupply from raw (with 18 decimals) to human-readable
      setTotalSupply(toHumanReadable(editingPreset.totalSupply, AUCTION_TOKEN_DECIMALS))
      // Note: bidTokenAddress is derived from bidToken config, not loaded separately
    }
  }, [editingPreset])

  const [error, setError] = useState<string>('')

  const config = BID_TOKEN_CONFIGS[bidToken]

  // Handle bid token change
  const handleBidTokenChange = useCallback((value: string) => {
    const newToken = value as 'USDC' | 'ETH'
    setBidToken(newToken)
    const newConfig = BID_TOKEN_CONFIGS[newToken]
    setTickSizeHuman(newConfig.defaultTickSizeHuman)
    setClearingPriceHuman(newConfig.defaultClearingPriceHuman)
    setError('')
  }, [])

  // Validate clearing price on blur
  const handleClearingPriceBlur = useCallback(() => {
    try {
      const clearingPriceRaw = fromHumanReadable(clearingPriceHuman, config.decimals)
      if (BigInt(clearingPriceRaw) < 0n) {
        setError('Invalid clearing price')
      } else {
        setError('')
      }
    } catch {
      setError('Invalid clearing price')
    }
  }, [clearingPriceHuman, config.decimals])

  // Arrow key handlers for numeric inputs
  const handleTickSizeKeyPress = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const current = parseFloat(tickSizeHuman || '0')
        const increment = e.key === 'ArrowUp' ? 0.01 : -0.01
        const newValue = Math.max(0.01, current + increment)
        setTickSizeHuman(newValue.toFixed(2))
      }
    },
    [tickSizeHuman],
  )

  const handleClearingPriceKeyPress = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const clearingPriceRaw = fromHumanReadable(clearingPriceHuman, config.decimals)
        const tickSizeRaw = fromHumanReadable(tickSizeHuman, config.decimals)
        const tickSizeBigInt = BigInt(tickSizeRaw)
        const increment = e.key === 'ArrowUp' ? tickSizeBigInt : -tickSizeBigInt
        const newValue = BigInt(clearingPriceRaw) + increment
        const newValueHuman = toHumanReadable(newValue.toString(), config.decimals)
        setClearingPriceHuman(newValueHuman)
      }
    },
    [clearingPriceHuman, tickSizeHuman, config.decimals],
  )

  const handleNumericKeyPress = useCallback(
    (setter: (value: string) => void, currentValue: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          const current = parseInt(currentValue || '0')
          const increment = e.key === 'ArrowUp' ? 1 : -1
          const newValue = Math.max(0, current + increment)
          setter(newValue.toString())
        }
      },
    [],
  )

  // Validate and save preset
  const handleSave = useCallback(() => {
    try {
      setError('')

      // Parse inputs
      const tickSizeRaw = fromHumanReadable(tickSizeHuman, config.decimals)
      const clearingPriceRaw = fromHumanReadable(clearingPriceHuman, config.decimals)
      const rangeMin = parseInt(tickRangeMin)
      const rangeMax = parseInt(tickRangeMax)
      const count = parseInt(tickCount)
      const volumeMinRaw = fromHumanReadable(bidVolumeMinHuman, config.decimals)
      const volumeMaxRaw = fromHumanReadable(bidVolumeMaxHuman, config.decimals)

      // Validation
      if (rangeMin < 1 || rangeMax > 40000 || rangeMin >= rangeMax) {
        setError('Invalid tick range. Min must be 1-40000 and less than max.')
        return
      }

      if (!validateTickCount({ tickCount: count, tickRangeMin: rangeMin, tickRangeMax: rangeMax })) {
        setError(`Tick count must be between 1 and ${rangeMax - rangeMin + 1}`)
        return
      }

      if (BigInt(volumeMinRaw) >= BigInt(volumeMaxRaw)) {
        setError('Bid volume min must be less than max')
        return
      }

      // Generate preset parameters
      // Convert totalSupply to raw format (with 18 decimals)
      const totalSupplyRaw = fromHumanReadable(totalSupply, AUCTION_TOKEN_DECIMALS)

      const params: CustomPresetParams = {
        bidToken,
        bidTokenAddress: config.address, // Store actual token address
        tickSize: tickSizeRaw,
        clearingPrice: clearingPriceRaw,
        tickRangeMin: rangeMin,
        tickRangeMax: rangeMax,
        tickCount: count,
        bidVolumeMin: volumeMinRaw,
        bidVolumeMax: volumeMaxRaw,
        totalSupply: totalSupplyRaw,
      }

      // Generate distribution data
      const distributionData = generateRandomBidDistribution(params)
      const name = generatePresetName(params)

      if (isEditMode) {
        // Update existing preset
        updatePreset(editingPreset.id, {
          ...params,
          name,
          distributionData,
        })

        // Load the updated preset
        const updatedPreset = {
          ...params,
          name,
          distributionData,
          id: editingPreset.id,
          createdAt: editingPreset.createdAt,
        }
        loadCustomPreset(updatedPreset)
      } else {
        // Save new preset
        savePreset({
          ...params,
          name,
          distributionData,
        })

        // Load the preset (need to create a temporary one with id for loading)
        const tempPreset = {
          ...params,
          name,
          distributionData,
          id: 'temp', // Will be updated when we select from saved list
          createdAt: Date.now(),
        }
        loadCustomPreset(tempPreset)
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preset')
    }
  }, [
    bidToken,
    tickSizeHuman,
    clearingPriceHuman,
    tickRangeMin,
    tickRangeMax,
    tickCount,
    bidVolumeMinHuman,
    bidVolumeMaxHuman,
    config.decimals,
    savePreset,
    loadCustomPreset,
    onClose,
  ])

  return (
    <Flex gap="$spacing24">
      {/* Bid Token Selector */}
      <Flex gap="$spacing8">
        <Text variant="body3" color="$neutral2">
          Bid Token
        </Text>
        <SegmentedControl
          options={[
            { value: 'USDC', display: <Text variant="buttonLabel4">USDC</Text> },
            { value: 'ETH', display: <Text variant="buttonLabel4">ETH</Text> },
          ]}
          selectedOption={bidToken}
          onSelectOption={handleBidTokenChange}
        />
      </Flex>

      {/* Tick Size and Clearing Price - Same Row */}
      <Flex row gap="$spacing12">
        <Flex flex={1} gap="$spacing8">
          <Text variant="body3" color="$neutral2">
            Tick Size ({bidToken})
          </Text>
          <Input
            placeholder="0.50"
            value={tickSizeHuman}
            onChangeText={setTickSizeHuman}
            onBlur={handleClearingPriceBlur}
            onKeyPress={handleTickSizeKeyPress}
            height={40}
            fontSize={12}
            borderWidth={1}
            borderColor="$neutral3"
            borderRadius="$rounded8"
            hoverStyle={{ borderColor: '$neutral1' }}
            focusStyle={{ borderColor: '$neutral1' }}
          />
        </Flex>

        <Flex width={1} backgroundColor="$neutral3" height={40} mt="$spacing24" />

        <Flex flex={1} gap="$spacing8" position="relative">
          <Text variant="body3" color="$neutral2">
            Clearing Price ({bidToken})
          </Text>
          <Input
            placeholder="5.00"
            value={clearingPriceHuman}
            onChangeText={setClearingPriceHuman}
            onBlur={handleClearingPriceBlur}
            onKeyPress={handleClearingPriceKeyPress}
            height={40}
            fontSize={12}
            borderWidth={1}
            borderColor="$neutral3"
            borderRadius="$rounded8"
            hoverStyle={{ borderColor: '$neutral1' }}
            focusStyle={{ borderColor: '$neutral1' }}
          />
          <Text variant="body4" color="$neutral3" position="absolute" top={66} right={2} fontSize={11}>
            Can be any price
          </Text>
        </Flex>
      </Flex>

      {/* Tick Range - Same Row */}
      <Flex row gap="$spacing12">
        <Flex flex={1} gap="$spacing8">
          <Text variant="body3" color="$neutral2">
            Tick Range (multipliers: 1-40000)
          </Text>
          <Flex row gap="$spacing8" alignItems="center">
            <Input
              placeholder="1"
              value={tickRangeMin}
              onChangeText={setTickRangeMin}
              onKeyPress={handleNumericKeyPress(setTickRangeMin, tickRangeMin)}
              height={40}
              fontSize={12}
              flex={1}
              borderWidth={1}
              borderColor="$neutral3"
              borderRadius="$rounded8"
              hoverStyle={{ borderColor: '$neutral1' }}
              focusStyle={{ borderColor: '$neutral1' }}
            />
            <Text variant="body3" color="$neutral3">
              to
            </Text>
            <Input
              placeholder="100"
              value={tickRangeMax}
              onChangeText={setTickRangeMax}
              onKeyPress={handleNumericKeyPress(setTickRangeMax, tickRangeMax)}
              height={40}
              fontSize={12}
              flex={1}
              borderWidth={1}
              borderColor="$neutral3"
              borderRadius="$rounded8"
              hoverStyle={{ borderColor: '$neutral1' }}
              focusStyle={{ borderColor: '$neutral1' }}
            />
          </Flex>
        </Flex>

        <Flex width={1} backgroundColor="$neutral3" height={40} mt="$spacing24" />

        <Flex flex={1} gap="$spacing8" position="relative">
          <Text variant="body3" color="$neutral2">
            Ticks with Bids
          </Text>
          <Input
            placeholder="20"
            value={tickCount}
            onChangeText={setTickCount}
            onKeyPress={handleNumericKeyPress(setTickCount, tickCount)}
            height={40}
            fontSize={12}
            borderWidth={1}
            borderColor="$neutral3"
            borderRadius="$rounded8"
            hoverStyle={{ borderColor: '$neutral1' }}
            focusStyle={{ borderColor: '$neutral1' }}
          />
          <Text variant="body4" color="$neutral3" position="absolute" top={66} right={2} fontSize={11}>
            Max: {Math.max(0, parseInt(tickRangeMax || '0') - parseInt(tickRangeMin || '0') + 1)}
          </Text>
        </Flex>
      </Flex>

      {/* Bid Volume Range and Total Supply - Same Row */}
      <Flex row gap="$spacing12">
        <Flex flex={1} gap="$spacing8">
          <Text variant="body3" color="$neutral2">
            Bid Volume Range (per tick, in {bidToken})
          </Text>
          <Flex row gap="$spacing8" alignItems="center">
            <Input
              placeholder="1000"
              value={bidVolumeMinHuman}
              onChangeText={setBidVolumeMinHuman}
              onKeyPress={handleNumericKeyPress(setBidVolumeMinHuman, bidVolumeMinHuman)}
              height={40}
              fontSize={12}
              flex={1}
              borderWidth={1}
              borderColor="$neutral3"
              borderRadius="$rounded8"
              hoverStyle={{ borderColor: '$neutral1' }}
              focusStyle={{ borderColor: '$neutral1' }}
            />
            <Text variant="body3" color="$neutral3">
              to
            </Text>
            <Input
              placeholder="10000"
              value={bidVolumeMaxHuman}
              onChangeText={setBidVolumeMaxHuman}
              onKeyPress={handleNumericKeyPress(setBidVolumeMaxHuman, bidVolumeMaxHuman)}
              height={40}
              fontSize={12}
              flex={1}
              borderWidth={1}
              borderColor="$neutral3"
              borderRadius="$rounded8"
              hoverStyle={{ borderColor: '$neutral1' }}
              focusStyle={{ borderColor: '$neutral1' }}
            />
          </Flex>
        </Flex>

        <Flex width={1} backgroundColor="$neutral3" height={40} mt="$spacing24" />

        <Flex flex={1} gap="$spacing8">
          <Text variant="body3" color="$neutral2">
            Total Supply
          </Text>
          <Input
            placeholder="1000000000"
            value={totalSupply}
            onChangeText={setTotalSupply}
            onKeyPress={handleNumericKeyPress(setTotalSupply, totalSupply)}
            height={40}
            fontSize={12}
            borderWidth={1}
            borderColor="$neutral3"
            borderRadius="$rounded8"
            hoverStyle={{ borderColor: '$neutral1' }}
            focusStyle={{ borderColor: '$neutral1' }}
          />
        </Flex>
      </Flex>

      {/* Error Message */}
      {error && (
        <Text variant="body3" color="$statusCritical">
          {error}
        </Text>
      )}

      {/* Preview */}
      <Flex p="$spacing12" backgroundColor="$surface3" borderRadius="$rounded12" gap="$spacing4">
        <Text variant="body4" color="$neutral2">
          Preview:
        </Text>
        <Text variant="body3" color="$neutral1">
          {tickCount} random ticks between $
          {toHumanReadable(
            (BigInt(fromHumanReadable(tickSizeHuman, config.decimals)) * BigInt(tickRangeMin || '1')).toString(),
            config.decimals,
          )}{' '}
          - $
          {toHumanReadable(
            (BigInt(fromHumanReadable(tickSizeHuman, config.decimals)) * BigInt(tickRangeMax || '100')).toString(),
            config.decimals,
          )}
        </Text>
        <Text variant="body3" color="$neutral1">
          Volume per tick: ${bidVolumeMinHuman} - ${bidVolumeMaxHuman}
        </Text>
      </Flex>

      {/* Save/Update Button */}
      <Button onPress={handleSave} size="large" mt={10} variant="branded">
        {isEditMode ? 'Update Preset' : 'Generate & Save Preset'}
      </Button>
    </Flex>
  )
}
