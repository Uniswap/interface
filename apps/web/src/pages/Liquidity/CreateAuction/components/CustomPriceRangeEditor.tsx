import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import {
  AddRangeRow,
  CustomPriceRangeRow,
  HeaderColumnLabel,
  PriceBoundColumnHeader,
  PriceRangeRowShell,
  RANGE_ROW_LEADING_SIZE,
} from '~/pages/Liquidity/CreateAuction/components/CustomPriceRangeEditorTable'
import {
  getCustomPriceHistogramLayers,
  PriceHistogram,
} from '~/pages/Liquidity/CreateAuction/components/PriceHistogram'
import {
  type CustomPriceRangeEntry,
  type CustomPriceRangePreset,
  MAX_CUSTOM_PRICE_RANGE_ENTRIES,
  PriceRangeStrategy,
} from '~/pages/Liquidity/CreateAuction/types'

export function CustomPriceRangeEditor({
  entries,
  histogramBarColor,
  onAddPreset,
  onUpdateLiquidityPercent,
  onUpdateBounds,
  onRemoveEntry,
}: {
  entries: CustomPriceRangeEntry[]
  histogramBarColor: string
  onAddPreset: (preset: CustomPriceRangePreset) => void
  onUpdateLiquidityPercent: (entryId: string, percent: number) => void
  onUpdateBounds: (
    entryId: string,
    bounds: Partial<Pick<CustomPriceRangeEntry, 'minPercentFromClearing' | 'maxPercentFromClearing'>>,
  ) => void
  onRemoveEntry: (entryId: string) => void
}) {
  const { t } = useTranslation()
  const sporeColors = useSporeColors()
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const canAddEntry = entries.length < MAX_CUSTOM_PRICE_RANGE_ENTRIES

  const rowHistogramColorByEntryId = useMemo(() => {
    const layers = getCustomPriceHistogramLayers({
      entries,
      barColor: histogramBarColor,
      neutral1Color: sporeColors.neutral1.val,
    })
    return new Map(layers.map((layer) => [layer.entryId, layer.color]))
  }, [entries, histogramBarColor, sporeColors.neutral1.val])

  return (
    <Flex gap="$spacing16">
      <PriceHistogram
        strategy={PriceRangeStrategy.CUSTOM_RANGE}
        customPriceRanges={entries}
        barColor={histogramBarColor}
        activeEntryId={activeEntryId}
        onHoverEntry={setActiveEntryId}
      />
      <Flex gap="$spacing8">
        <PriceRangeRowShell
          rowAlignItems="flex-start"
          leading={
            <Flex
              width={RANGE_ROW_LEADING_SIZE}
              height={RANGE_ROW_LEADING_SIZE}
              borderRadius="$roundedFull"
              backgroundColor="$transparent"
            />
          }
          column1={
            <HeaderColumnLabel>
              {t('toucan.createAuction.step.customizePool.priceRange.custom.liquidityPercent')}
            </HeaderColumnLabel>
          }
          column2={
            <PriceBoundColumnHeader
              label={t('toucan.createAuction.step.customizePool.priceRange.custom.minimumPrice')}
            />
          }
          column3={
            <PriceBoundColumnHeader
              label={t('toucan.createAuction.step.customizePool.priceRange.custom.maximumPrice')}
            />
          }
          trailing={
            <TouchableArea centered disabled opacity={0} aria-hidden tabIndex={-1}>
              <X size="$icon.16" color="$neutral2" />
            </TouchableArea>
          }
        />
        {entries.map((entry) => (
          <CustomPriceRangeRow
            key={entry.id}
            entry={entry}
            rowHistogramColor={rowHistogramColorByEntryId.get(entry.id) ?? histogramBarColor}
            canRemove={entries.length > 1}
            isActive={activeEntryId === entry.id}
            onHoverEntry={setActiveEntryId}
            onUpdateLiquidityPercent={(percent) => onUpdateLiquidityPercent(entry.id, percent)}
            onUpdateBounds={(bounds) => onUpdateBounds(entry.id, bounds)}
            onRemove={() => onRemoveEntry(entry.id)}
          />
        ))}
        <AddRangeRow canAddEntry={canAddEntry} onAddPreset={onAddPreset} />
      </Flex>
    </Flex>
  )
}
