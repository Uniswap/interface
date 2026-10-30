import { Flex, Text } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { Tooltip } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'

// label (+ optional info-icon tooltip) left, value right. Generalizes the drawer's FeeRow/DrawerRow.
// value is a ReactNode so callers can pass a health-colored Text; a plain string gets the default style.
export function MarginDetailRow({
  label,
  value,
  tooltip,
  textVariant = 'body3',
}: {
  label: string
  value: ReactNode
  tooltip?: ReactNode
  // 'body4' for denser surfaces (the inline receipt); default matches the modals.
  textVariant?: 'body3' | 'body4'
}): JSX.Element {
  return (
    <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12">
      {tooltip ? (
        <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
          <Tooltip.Trigger>
            <Flex row alignItems="center" gap="$spacing4">
              <Text variant={textVariant} color="$neutral2">
                {label}
              </Text>
              <InfoCircleFilled size="$icon.16" color="$neutral3" />
            </Flex>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <Tooltip.Arrow />
            {/* Only a string gets the Text wrapper: a block-level node inside an inline Text is
                invalid nesting, the same defect the candlestick tooltip carried. */}
            {typeof tooltip === 'string' ? <Text variant="body4">{tooltip}</Text> : tooltip}
          </Tooltip.Content>
        </Tooltip>
      ) : (
        <Text variant={textVariant} color="$neutral2">
          {label}
        </Text>
      )}
      {typeof value === 'string' ? (
        <Text variant={textVariant} color="$neutral1">
          {value}
        </Text>
      ) : (
        value
      )}
    </Flex>
  )
}
