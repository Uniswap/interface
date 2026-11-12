import { Flex, Spacer, Text, TouchableArea, Tooltip } from '@universe/mycelium'
import { Plus } from '@universe/mycelium/icons/Plus'
import { QuestionInCircleFilled } from '@universe/mycelium/icons/QuestionInCircleFilled'
import { X } from '@universe/mycelium/icons/X'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { noop } from 'utilities/src/react/noop'
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
import {
  CUSTOM_PRICE_RANGE_PERCENT_DISPLAY_DECIMALS,
  FULL_RANGE_REMAINDER_BOUNDS,
  FULL_RANGE_REMAINDER_ENTRY_ID,
} from '~/pages/Liquidity/CreateAuction/utils'

/** The disabled remainder fields never fire; their handlers are required by the shared inputs. */
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

/**
 * The `?` that explains the remainder row. Shared by the editor and the review table so the two
 * surfaces cannot drift apart on the one piece of copy that says where the liquidity goes.
 */
export function FullRangeRemainderHelp(): JSX.Element {
  const { t } = useTranslation()
  const helpText = t('toucan.createAuction.step.customizePool.priceRange.custom.fullRangeRemainderHelp')

  return (
    <Tooltip placement="top">
      <Tooltip.Trigger asChild>
        <Flex centered cursor="help" aria-label={helpText}>
          <QuestionInCircleFilled size="$icon.16" color="$neutral3" />
        </Flex>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Tooltip.Arrow />
        <Text variant="body4" color="$neutral1" maxWidth={280}>
          {helpText}
        </Text>
      </Tooltip.Content>
    </Tooltip>
  )
}

/**
 * The unallocated share of the LP budget, as a read-only row. It is not one of the user's ranges:
 * the migrator opens a single full-range position for whatever the ranges leave unspent, so this
 * reports a position that will exist rather than a gap to fill. It mirrors the editable rows —
 * same fields, same alignment — with the inputs disabled and the bounds fixed at the full range;
 * the remove control is replaced by hover help, since there is nothing here to remove.
 * Rendered only when the remainder is non-zero.
 */
export function FullRangeRemainderRow({
  remainderPercent,
  rowHistogramColor,
  isActive,
  onHoverEntry,
}: {
  remainderPercent: number
  rowHistogramColor: string
  isActive: boolean
  onHoverEntry: (entryId: string | null) => void
}) {
  const { t } = useTranslation()
  // The row deliberately carries no visible label — it is meant to read as one more range. Assistive
  // tech gets none of the visual cues that mark it out (muted values, no remove control), so each
  // field names itself instead.
  const fieldLabel = (field: string): string =>
    t('toucan.createAuction.step.customizePool.priceRange.custom.fullRangeRemainderFieldLabel', { field })

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
          value={remainderPercent}
          isActive={false}
          disabled
          accessibilityLabel={fieldLabel(
            t('toucan.createAuction.step.customizePool.priceRange.custom.liquidityPercent'),
          )}
          onValueChange={noop}
        />
      }
      column2={
        <PriceBoundInput
          side="min"
          value={FULL_RANGE_REMAINDER_BOUNDS.minPercentFromClearing}
          isActive={false}
          disabled
          accessibilityLabel={fieldLabel(t('toucan.createAuction.step.customizePool.priceRange.custom.minimumPrice'))}
          onValueChange={noop}
        />
      }
      column3={
        <PriceBoundInput
          side="max"
          value={FULL_RANGE_REMAINDER_BOUNDS.maxPercentFromClearing}
          isActive={false}
          disabled
          accessibilityLabel={fieldLabel(t('toucan.createAuction.step.customizePool.priceRange.custom.maximumPrice'))}
          onValueChange={noop}
        />
      }
      trailing={<FullRangeRemainderHelp />}
      backgroundColor={isActive ? '$surface3' : '$transparent'}
      onMouseEnter={() => onHoverEntry(FULL_RANGE_REMAINDER_ENTRY_ID)}
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
  const formatFinitePercentValue = (value: number): string =>
    normalizeSignedInput(formatPercent(value, CUSTOM_PRICE_RANGE_PERCENT_DISPLAY_DECIMALS))

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
