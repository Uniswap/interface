import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { CustomPriceRangeEditor } from '~/pages/Liquidity/CreateAuction/components/CustomPriceRangeEditor'
import { PriceHistogram } from '~/pages/Liquidity/CreateAuction/components/PriceHistogram'
import { PriceRangeStrategyPopover } from '~/pages/Liquidity/CreateAuction/components/PriceRangeStrategyPopover'
import {
  type CustomPriceRangeEntry,
  type CustomPriceRangePreset,
  PriceRangeStrategy,
} from '~/pages/Liquidity/CreateAuction/types'
import { getRecommendedStrategy } from '~/pages/Liquidity/CreateAuction/utils'

interface PriceRangeStrategySelectorProps {
  selectedStrategy: PriceRangeStrategy
  onStrategySelect: (strategy: PriceRangeStrategy) => void
  histogramBarColor: string
  customPriceRanges: CustomPriceRangeEntry[]
  onAddCustomPriceRangePreset: (preset: CustomPriceRangePreset) => void
  onUpdateCustomPriceRangeLiquidityPercent: (entryId: string, percent: number) => void
  onUpdateCustomPriceRangeBounds: (
    entryId: string,
    bounds: Partial<Pick<CustomPriceRangeEntry, 'minPercentFromClearing' | 'maxPercentFromClearing'>>,
  ) => void
  onRemoveCustomPriceRange: (entryId: string) => void
}

export function PriceRangeStrategySelector({
  selectedStrategy,
  onStrategySelect,
  histogramBarColor,
  customPriceRanges,
  onAddCustomPriceRangePreset,
  onUpdateCustomPriceRangeLiquidityPercent,
  onUpdateCustomPriceRangeBounds,
  onRemoveCustomPriceRange,
}: PriceRangeStrategySelectorProps) {
  const { t } = useTranslation()
  const recommendedStrategy = getRecommendedStrategy()
  const isRecommended = selectedStrategy === recommendedStrategy

  const title = (() => {
    if (selectedStrategy === PriceRangeStrategy.CONCENTRATED_FULL_RANGE) {
      return t('toucan.createAuction.step.customizePool.priceRange.concentratedFullRange')
    }
    if (selectedStrategy === PriceRangeStrategy.CUSTOM_RANGE) {
      return t('toucan.createAuction.step.customizePool.priceRange.custom')
    }
    return t('toucan.createAuction.step.customizePool.priceRange.fullRange')
  })()

  const description = (() => {
    if (selectedStrategy === PriceRangeStrategy.CONCENTRATED_FULL_RANGE) {
      return t('toucan.createAuction.step.customizePool.priceRange.concentratedFullRange.description')
    }
    if (selectedStrategy === PriceRangeStrategy.CUSTOM_RANGE) {
      return t('toucan.createAuction.step.customizePool.priceRange.custom.description')
    }
    return t('toucan.createAuction.step.customizePool.priceRange.fullRange.description')
  })()

  return (
    <Flex
      backgroundColor="$surface1"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded20"
      p="$spacing16"
      gap="$spacing16"
    >
      <Flex row alignItems="flex-start" gap="$spacing12">
        <Flex flex={1} gap="$spacing4">
          <Flex row alignItems="center" gap="$spacing8">
            <Text variant="subheading2" color="$neutral1">
              {title}
            </Text>
            {isRecommended && (
              <Flex backgroundColor="$surface3" borderRadius="$rounded6" px="$spacing6" py="$spacing2">
                <Text variant="buttonLabel4" color="$neutral1">
                  {t('toucan.createAuction.step.customizePool.priceRange.recommended')}
                </Text>
              </Flex>
            )}
          </Flex>
          <Text variant="body3" color="$neutral2">
            {description}
          </Text>
        </Flex>

        <PriceRangeStrategyPopover
          selectedStrategy={selectedStrategy}
          onStrategySelect={onStrategySelect}
          barColor={histogramBarColor}
        />
      </Flex>

      {selectedStrategy === PriceRangeStrategy.CUSTOM_RANGE ? (
        <CustomPriceRangeEditor
          entries={customPriceRanges}
          histogramBarColor={histogramBarColor}
          onAddPreset={onAddCustomPriceRangePreset}
          onUpdateLiquidityPercent={onUpdateCustomPriceRangeLiquidityPercent}
          onUpdateBounds={onUpdateCustomPriceRangeBounds}
          onRemoveEntry={onRemoveCustomPriceRange}
        />
      ) : (
        <PriceHistogram strategy={selectedStrategy} barColor={histogramBarColor} />
      )}
    </Flex>
  )
}
