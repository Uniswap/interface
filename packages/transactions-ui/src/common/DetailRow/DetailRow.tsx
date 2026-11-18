import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { IndicativeLoadingWrapper } from '@universe/transactions-ui/src/common/IndicativeLoadingWrapper/IndicativeLoadingWrapper'
import type { ReactNode } from 'react'

export interface DetailRowProps {
  /**
   * Product copy. A string renders in the standard label style; pass a node when the
   * adapter wraps the label in its info tooltip or modal trigger.
   */
  label: ReactNode
  /** A string renders in the standard value style. Pass a node for composed values. */
  value: ReactNode
  /** Price before a discount, struck through ahead of `value` (UniswapX savings, sponsored gas). */
  strikethroughValue?: string
  /** One line of small print under the row, e.g. the smart wallet activation note under network cost. */
  caption?: string
  /** Indicative quote with no value yet: the value renders as the loading skeleton. */
  isLoading?: boolean
  /**
   * The value takes all the space right of the label, so a pressable value (ExchangeRate)
   * presses across it, like the old Rate row. Content stays end-aligned.
   */
  fillValue?: boolean
  /**
   * Makes the whole row, caption included, one press target with a trailing chevron after
   * the value, e.g. the network cost row that opens the gas editor. Omit it for display-only rows.
   */
  onPress?: () => void
  testID?: string
}

/**
 * One label-left, value-right line: the rows inside transaction details on the form and
 * review screens, and every hand-rolled `justifyContent="space-between"` row elsewhere
 * (InfoRow, SummaryRow, KeyValueRow, MarginDetailRow, LiquidityModalDetailRows).
 *
 * Replaces the row frames of SlippageRow, PriceDifferenceRow, RoutingInfoRow,
 * EstimatedTime, RateRow, SwapFee, NetworkFee and NetworkCostRow. Product-specific
 * values (the Auto pill, a colored price impact, a chain logo) stay small views in the
 * product folder and arrive here as `value`.
 *
 * @alias InfoRow, SummaryRow, KeyValueRow, LabelValueRow, LineItem, DetailLineItem
 */
export function DetailRow({
  label,
  value,
  strikethroughValue,
  caption,
  isLoading,
  fillValue,
  onPress,
  testID,
}: DetailRowProps): JSX.Element {
  const row = (
    <Flex
      row
      alignItems="center"
      gap="$spacing12"
      justifyContent="space-between"
      testID={caption || onPress ? undefined : testID}
    >
      {typeof label === 'string' ? (
        <Text
          color="$neutral2"
          // A filling value can overflow the row (a long rate). Native layout has no min-content
          // floor, so a shrinking label would break mid-word there ("Rat" / "e").
          flexShrink={fillValue ? 0 : 1}
          numberOfLines={3}
          variant="body3"
        >
          {label}
        </Text>
      ) : (
        label
      )}
      <IndicativeLoadingWrapper loading={isLoading}>
        <Flex row shrink alignItems="center" gap="$spacing6" grow={fillValue} justifyContent="flex-end">
          {strikethroughValue ? (
            <Text color="$neutral2" textDecorationLine="line-through" variant="body3">
              {strikethroughValue}
            </Text>
          ) : null}
          {typeof value === 'string' ? (
            <Text color="$neutral1" variant="body3">
              {value}
            </Text>
          ) : (
            value
          )}
          {onPress ? <RotatableChevron color="$neutral3" direction="right" size="$icon.16" /> : null}
        </Flex>
      </IndicativeLoadingWrapper>
    </Flex>
  )

  const content = caption ? (
    <Flex gap="$spacing4" testID={onPress ? undefined : testID}>
      {row}
      <Text color="$neutral3" variant="body4">
        {caption}
      </Text>
    </Flex>
  ) : (
    row
  )

  if (!onPress) {
    return content
  }

  return (
    <TouchableArea testID={testID} onPress={onPress}>
      {content}
    </TouchableArea>
  )
}
