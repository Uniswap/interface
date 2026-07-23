import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Spacer, Text, TouchableArea, useMedia } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { X } from 'ui/src/components/icons/X'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  formatPresetLabel,
  normalizeSignedInput,
} from '~/pages/Liquidity/CreateAuction/components/customPriceRangeEditorFormatting'
import {
  LiquidityPercentInput,
  PriceBoundInput,
} from '~/pages/Liquidity/CreateAuction/components/CustomPriceRangeEditorInputs'
import {
  CUSTOM_PRICE_RANGE_POSITIVE_INFINITY,
  CUSTOM_PRICE_RANGE_PRESETS,
  type CustomPriceRangeEntry,
  type CustomPriceRangePreset,
  MIN_CUSTOM_PRICE_RANGE_PERCENT_FROM_CLEARING,
} from '~/pages/Liquidity/CreateAuction/types'

/** Dot width — must match histogram bullet on each range row */
export const RANGE_ROW_LEADING_SIZE = 6

export function HeaderColumnLabel({ children }: { children: ReactNode }): JSX.Element {
  return (
    <Flex flex={1} flexBasis={0} minWidth={0} width="100%">
      <Text variant="body4" color="$neutral1" width="100%">
        {children}
      </Text>
    </Flex>
  )
}

export function PriceBoundColumnHeader({
  label,
  showPercentFromClearingHint = true,
}: {
  label: ReactNode
  showPercentFromClearingHint?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex flex={1} flexBasis={0} minWidth={0} width="100%" row flexWrap="wrap" alignItems="baseline">
      <Text variant="body4" color="$neutral1">
        {label}
      </Text>
      {showPercentFromClearingHint ? (
        <Text variant="body4" color="$neutral2">
          {t('toucan.createAuction.step.customizePool.priceRange.custom.percentFromClearingHint')}
        </Text>
      ) : null}
    </Flex>
  )
}

type PriceRangeRowShellProps = {
  /** When omitted, no leading column is rendered (e.g. read-only review table). */
  leading?: ReactNode
  column1: ReactNode
  column2: ReactNode
  column3: ReactNode
  /** When omitted, no trailing column is rendered (e.g. read-only review table). */
  trailing?: ReactNode
  backgroundColor?: '$surface3' | '$transparent'
  /** Header rows use flex-start so wrapped labels align to the top; data rows stay vertically centered. */
  rowAlignItems?: 'center' | 'flex-start'
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function PriceRangeRowShell({
  leading,
  column1,
  column2,
  column3,
  trailing,
  backgroundColor = '$transparent',
  rowAlignItems = 'center',
  onMouseEnter,
  onMouseLeave,
}: PriceRangeRowShellProps): JSX.Element {
  return (
    <Flex
      row
      alignItems={rowAlignItems}
      gap="$spacing8"
      width="100%"
      px="$spacing8"
      backgroundColor={backgroundColor}
      borderRadius="$rounded8"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {leading !== undefined ? (
        <Flex flexShrink={0} alignItems="center" justifyContent="center" width={RANGE_ROW_LEADING_SIZE}>
          {leading}
        </Flex>
      ) : null}
      <Flex
        flex={1}
        flexBasis={0}
        minWidth={0}
        gap="$spacing4"
        row
        width="100%"
        $platform-web={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)',
        }}
      >
        {column1}
        {column2}
        {column3}
      </Flex>
      {trailing !== undefined ? (
        <Flex flexShrink={0} alignItems="center" justifyContent="center">
          {trailing}
        </Flex>
      ) : null}
    </Flex>
  )
}

export function CustomPriceRangeRow({
  entry,
  rowHistogramColor,
  canRemove,
  isActive,
  onHoverEntry,
  onUpdateLiquidityPercent,
  onUpdateBounds,
  onRemove,
}: {
  entry: CustomPriceRangeEntry
  rowHistogramColor: string
  canRemove: boolean
  isActive: boolean
  onHoverEntry: (entryId: string | null) => void
  onUpdateLiquidityPercent: (percent: number) => void
  onUpdateBounds: (
    bounds: Partial<Pick<CustomPriceRangeEntry, 'minPercentFromClearing' | 'maxPercentFromClearing'>>,
  ) => void
  onRemove: () => void
}) {
  return (
    <PriceRangeRowShell
      leading={
        <Flex
          width={RANGE_ROW_LEADING_SIZE}
          height={RANGE_ROW_LEADING_SIZE}
          borderRadius="$roundedFull"
          backgroundColor={rowHistogramColor}
        />
      }
      column1={
        <LiquidityPercentInput
          value={entry.liquidityPercent}
          isActive={false}
          onValueChange={onUpdateLiquidityPercent}
        />
      }
      column2={
        <PriceBoundInput
          side="min"
          value={entry.minPercentFromClearing}
          isActive={false}
          onValueChange={(minPercentFromClearing) => onUpdateBounds({ minPercentFromClearing })}
        />
      }
      column3={
        <PriceBoundInput
          side="max"
          value={entry.maxPercentFromClearing}
          isActive={false}
          onValueChange={(maxPercentFromClearing) => onUpdateBounds({ maxPercentFromClearing })}
        />
      }
      trailing={
        <TouchableArea centered onPress={onRemove} disabled={!canRemove} opacity={canRemove ? 1 : 0.24}>
          <X size="$icon.16" color="$neutral2" />
        </TouchableArea>
      }
      backgroundColor={isActive ? '$surface3' : '$transparent'}
      onMouseEnter={() => onHoverEntry(entry.id)}
      onMouseLeave={() => onHoverEntry(null)}
    />
  )
}

export function AddRangeRow({
  canAddEntry,
  onAddPreset,
}: {
  canAddEntry: boolean
  onAddPreset: (preset: CustomPriceRangePreset) => void
}) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const media = useMedia()
  // Hover-reveal is unusable on touch: below md the preset chips always render in their own
  // horizontally scrollable row below the Add range row.
  const alwaysShowPresetsRow = Boolean(media.md)
  const [showPresets, setShowPresets] = useState(false)
  const formatFinitePercentValue = (value: number): string => normalizeSignedInput(formatPercent(value, 4))

  const presetChips = CUSTOM_PRICE_RANGE_PRESETS.map((preset) => (
    <TouchableArea
      key={`${preset.minPercentFromClearing}-${preset.maxPercentFromClearing}`}
      flexShrink={0}
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      px="$spacing8"
      py="$spacing6"
      hoverStyle={{ backgroundColor: '$surface3' }}
      onPress={() => onAddPreset(preset)}
    >
      <Text variant="buttonLabel4" color="$neutral1">
        {formatPresetLabel(preset, formatFinitePercentValue)}
      </Text>
    </TouchableArea>
  ))

  return (
    <Flex gap="$spacing8" opacity={canAddEntry ? 1 : 0.5}>
      <Flex
        row
        alignItems="center"
        gap="$spacing4"
        height={32}
        pr="$spacing24"
        onMouseEnter={alwaysShowPresetsRow ? undefined : () => setShowPresets(true)}
        onMouseLeave={alwaysShowPresetsRow ? undefined : () => setShowPresets(false)}
      >
        <TouchableArea
          minWidth={0}
          disabled={!canAddEntry}
          onPress={() =>
            onAddPreset({
              minPercentFromClearing: MIN_CUSTOM_PRICE_RANGE_PERCENT_FROM_CLEARING,
              maxPercentFromClearing: CUSTOM_PRICE_RANGE_POSITIVE_INFINITY,
            })
          }
        >
          <Flex row alignItems="center" gap="$spacing4">
            <Plus size="$icon.16" color={canAddEntry ? '$neutral2' : '$neutral3'} />
            <Text variant="buttonLabel4" color={canAddEntry ? '$neutral2' : '$neutral3'}>
              {t('toucan.createAuction.step.customizePool.priceRange.custom.addRange')}
            </Text>
          </Flex>
        </TouchableArea>
        <Spacer flex={1} />
        {!alwaysShowPresetsRow && showPresets && canAddEntry && (
          <Flex row gap="$spacing2" flexShrink={0}>
            {presetChips}
          </Flex>
        )}
      </Flex>
      {alwaysShowPresetsRow && canAddEntry && (
        <Flex row gap="$spacing8" width="100%" $platform-web={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          {presetChips}
        </Flex>
      )}
    </Flex>
  )
}
