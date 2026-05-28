import { useTranslation } from 'react-i18next'
import { Flex, IconButton, Popover, Spacer, Text, TouchableArea } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { PriceRangeStrategy } from '~/pages/Liquidity/CreateAuction/types'

const BAR_ICON_SIZE = 16
const BAR_WIDTH = 3
const BAR_GAP = 2

/** Uniform block height so 3 blocks + 2 vertical gaps fill the icon (ascending triangle). */
const CUSTOM_RANGE_BAR_BLOCK_HEIGHT = Math.floor((BAR_ICON_SIZE - 2) / 3)

const CONCENTRATED_BAR_HEIGHTS = [0.45, 0.8, 0.6]
const FULL_RANGE_BAR_HEIGHTS = [0.6, 0.6, 0.6]

/** Bottom row: 3 bars; middle: center + right; top: right only — same-sized blocks, left→right ramp. */
function CustomRangeStackedBarsIcon({ barColor }: { barColor: string }) {
  const blocksPerColumn = [1, 2, 3] as const
  return (
    <Flex row alignItems="flex-end" gap={BAR_GAP} height={BAR_ICON_SIZE} width={BAR_ICON_SIZE}>
      {blocksPerColumn.map((count, colIndex) => (
        <Flex key={colIndex} width={BAR_WIDTH} height={BAR_ICON_SIZE}>
          <Flex grow />
          <Flex gap="$spacing1">
            {Array.from({ length: count }, (_, blockIndex) => (
              <Flex
                key={blockIndex}
                width={BAR_WIDTH}
                height={CUSTOM_RANGE_BAR_BLOCK_HEIGHT}
                backgroundColor={barColor}
                borderRadius={BAR_WIDTH / 2}
              />
            ))}
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}

function ThreeBarsIcon({ strategy, barColor }: { strategy: PriceRangeStrategy; barColor: string }) {
  if (strategy === PriceRangeStrategy.CUSTOM_RANGE) {
    return <CustomRangeStackedBarsIcon barColor={barColor} />
  }
  const heights = (() => {
    if (strategy === PriceRangeStrategy.CONCENTRATED_FULL_RANGE) {
      return CONCENTRATED_BAR_HEIGHTS
    }
    return FULL_RANGE_BAR_HEIGHTS
  })()
  return (
    <Flex row alignItems="flex-end" gap={BAR_GAP} height={BAR_ICON_SIZE} width={BAR_ICON_SIZE}>
      {heights.map((ratio, i) => (
        <Flex
          key={i}
          width={BAR_WIDTH}
          height={Math.round(ratio * BAR_ICON_SIZE)}
          backgroundColor={barColor}
          borderRadius={BAR_WIDTH / 2}
        />
      ))}
    </Flex>
  )
}

interface StrategyOptionProps {
  label: string
  description: string
  strategy: PriceRangeStrategy
  isSelected: boolean
  isAdvanced?: boolean
  advancedLabel?: string
  onPress: () => void
  barColor: string
}

function StrategyOption({
  label,
  description,
  strategy,
  isSelected,
  isAdvanced = false,
  advancedLabel,
  onPress,
  barColor,
}: StrategyOptionProps) {
  return (
    <Popover.Close asChild>
      <TouchableArea
        row
        alignItems="flex-start"
        gap="$spacing8"
        px="$spacing12"
        py="$spacing8"
        borderRadius="$rounded16"
        backgroundColor="$transparent"
        hoverStyle={{ backgroundColor: '$surface3' }}
        onPress={onPress}
      >
        <Flex flex={1} minWidth={0} gap="$spacing2">
          <Flex row alignItems="flex-start" gap="$spacing6">
            <ThreeBarsIcon strategy={strategy} barColor={barColor} />
            <Text variant="buttonLabel3" color="$neutral1" lineHeight={20}>
              {label}
            </Text>
            {isAdvanced && (
              <Flex backgroundColor="$surface3" borderRadius="$rounded6" px="$spacing4" py="$spacing2">
                <Text variant="buttonLabel4" color="$neutral1" fontSize={8} lineHeight={12}>
                  {advancedLabel}
                </Text>
              </Flex>
            )}
            {isSelected && (
              <>
                <Spacer flex={1} />
                <CheckCircleFilled color="$neutral1" size="$icon.16" flexShrink={0} />
              </>
            )}
          </Flex>
          <Text variant="body4" color="$neutral2">
            {description}
          </Text>
        </Flex>
      </TouchableArea>
    </Popover.Close>
  )
}

interface PriceRangeStrategyPopoverProps {
  selectedStrategy: PriceRangeStrategy
  onStrategySelect: (strategy: PriceRangeStrategy) => void
  barColor: string
}

export function PriceRangeStrategyPopover({
  selectedStrategy,
  onStrategySelect,
  barColor,
}: PriceRangeStrategyPopoverProps) {
  const { t } = useTranslation()
  return (
    <Popover placement="bottom-end" offset={8}>
      <Popover.Trigger>
        <IconButton
          size="xsmall"
          emphasis="secondary"
          icon={<RotatableChevron direction="down" color="$neutral2" size="$icon.16" />}
        />
      </Popover.Trigger>
      <Popover.Content
        maxWidth={280}
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        borderColor="$surface3"
        backgroundColor="$surface1"
        p="$spacing4"
        elevate
        animation={['fast', { opacity: { overshootClamping: true } }]}
        animateOnly={['transform', 'opacity']}
        enterStyle={{ scale: 0.95, opacity: 0 }}
        exitStyle={{ scale: 0.95, opacity: 0 }}
      >
        <Flex gap="$spacing8">
          <StrategyOption
            label={t('toucan.createAuction.step.customizePool.priceRange.concentratedFullRange')}
            description={t('toucan.createAuction.step.customizePool.priceRange.concentratedFullRange.menuDescription')}
            strategy={PriceRangeStrategy.CONCENTRATED_FULL_RANGE}
            isSelected={selectedStrategy === PriceRangeStrategy.CONCENTRATED_FULL_RANGE}
            onPress={() => onStrategySelect(PriceRangeStrategy.CONCENTRATED_FULL_RANGE)}
            barColor={barColor}
          />
          <StrategyOption
            label={t('toucan.createAuction.step.customizePool.priceRange.fullRange')}
            description={t('toucan.createAuction.step.customizePool.priceRange.fullRange.menuDescription')}
            strategy={PriceRangeStrategy.FULL_RANGE}
            isSelected={selectedStrategy === PriceRangeStrategy.FULL_RANGE}
            onPress={() => onStrategySelect(PriceRangeStrategy.FULL_RANGE)}
            barColor={barColor}
          />
          <StrategyOption
            label={t('common.customRange')}
            description={t('toucan.createAuction.step.customizePool.priceRange.custom.menuDescription')}
            strategy={PriceRangeStrategy.CUSTOM_RANGE}
            isSelected={selectedStrategy === PriceRangeStrategy.CUSTOM_RANGE}
            isAdvanced
            advancedLabel={t('toucan.createAuction.step.customizePool.priceRange.advanced')}
            onPress={() => onStrategySelect(PriceRangeStrategy.CUSTOM_RANGE)}
            barColor={barColor}
          />
        </Flex>
      </Popover.Content>
    </Popover>
  )
}
