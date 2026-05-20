import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

interface LimitPriceButtonProps {
  priceAdjustmentPercentage: number
  disabled?: boolean
  selected?: boolean
  onSelect: (priceAdjustmentPercentage: number) => void
}

function marketSegmentLayout({
  selected,
  disabled,
  highlighted,
}: {
  selected: boolean
  disabled: boolean
  highlighted: boolean
}) {
  const foreground = highlighted || (selected && !disabled) ? '$neutral1' : '$neutral2'
  const background = highlighted || selected ? '$surface3' : 'transparent'
  return { foreground, background }
}

interface MarketSegmentButtonProps {
  selected?: boolean
  disabled?: boolean
  highlighted: boolean
  onPress: () => void
  children: ReactNode
}

function MarketSegmentButton({ selected, disabled, highlighted, onPress, children }: MarketSegmentButtonProps) {
  const { foreground, background } = marketSegmentLayout({
    selected: Boolean(selected),
    disabled: Boolean(disabled),
    highlighted,
  })
  const borderRadiusProps = highlighted
    ? {
        borderTopLeftRadius: '$roundedFull',
        borderBottomLeftRadius: '$roundedFull',
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderRightWidth: 0,
      }
    : { borderRadius: '$roundedFull' }
  return (
    <TouchableArea
      row
      alignItems="center"
      justifyContent="center"
      height="$spacing28"
      px="$spacing8"
      py="$spacing2"
      backgroundColor={background}
      borderWidth={1}
      borderColor="$surface3"
      {...borderRadiusProps}
      disabled={disabled}
      onPress={onPress}
    >
      <Text variant="buttonLabel2" color={foreground}>
        {children}
      </Text>
    </TouchableArea>
  )
}

function MarketSegmentXButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableArea disabled={disabled} onPress={onPress}>
      <Flex
        row
        centered
        height="$spacing28"
        p="$spacing6"
        pl="$spacing4"
        backgroundColor="$surface3"
        borderWidth={1}
        borderColor="$surface3"
        borderLeftColor="transparent"
        borderTopRightRadius="$roundedFull"
        borderBottomRightRadius="$roundedFull"
        borderTopLeftRadius={0}
        borderBottomLeftRadius={0}
      >
        <X size="$icon.16" color="$neutral2" />
      </Flex>
    </TouchableArea>
  )
}

export function LimitPresetPriceButton({
  priceAdjustmentPercentage,
  selected,
  disabled,
  onSelect,
}: LimitPriceButtonProps) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const sign = priceAdjustmentPercentage > 0 ? '+' : '-'
  return (
    <MarketSegmentButton
      selected={selected}
      disabled={disabled}
      highlighted={false}
      onPress={() => onSelect(priceAdjustmentPercentage)}
    >
      {priceAdjustmentPercentage === 0 ? (
        t('common.market.label')
      ) : (
        <>
          {sign}
          {formatPercent(Math.abs(priceAdjustmentPercentage))}
        </>
      )}
    </MarketSegmentButton>
  )
}

/**
 * A button to reset the price to the market price (i.e. an adjustment of 0%)
 * When defined, this button displays customAdjustmentPercentage instead of "Market"
 */
export function LimitCustomMarketPriceButton({
  customAdjustmentPercentage,
  selected,
  disabled,
  onSelect,
}: Omit<LimitPriceButtonProps, 'priceAdjustmentPercentage'> & {
  customAdjustmentPercentage?: number
}) {
  const { t } = useTranslation()
  const onSetAdjustmentPercentage = () => onSelect(0)
  const { formatPercent } = useLocalizationContext()

  return (
    <Flex row width="unset" gap="$spacing1">
      <MarketSegmentButton
        selected={selected}
        disabled={disabled}
        highlighted={customAdjustmentPercentage !== undefined}
        onPress={onSetAdjustmentPercentage}
      >
        {!customAdjustmentPercentage ? (
          t('common.market.label')
        ) : (
          <>
            {customAdjustmentPercentage > 0 ? '+' : ''}
            {formatPercent(customAdjustmentPercentage)}
          </>
        )}
      </MarketSegmentButton>
      {customAdjustmentPercentage ? (
        <MarketSegmentXButton disabled={disabled} onPress={onSetAdjustmentPercentage} />
      ) : null}
    </Flex>
  )
}
