import { Flex, Text, Tooltip } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import type { ReactNode } from 'react'

// label (+ optional info-icon tooltip) left, value right. Generalizes the drawer's FeeRow/DrawerRow.
// value is a ReactNode so callers can pass a health-colored Text; a plain string gets the default style.
export function MarginDetailRow({
  label,
  value,
  tooltip,
  tooltipTrigger = 'icon',
  textVariant = 'body3',
}: {
  label: string
  value: ReactNode
  tooltip?: ReactNode
  // 'row': the whole row raises the tooltip and the value takes a dotted underline instead of an icon.
  tooltipTrigger?: 'icon' | 'row'
  // 'body4' for denser surfaces (the inline receipt); default matches the modals.
  textVariant?: 'body3' | 'body4'
}): JSX.Element {
  if (tooltip && tooltipTrigger === 'row') {
    return (
      <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
        <Tooltip.Trigger asChild>
          <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12" cursor="pointer">
            <Text variant={textVariant} color="$neutral2">
              {label}
            </Text>
            {/* A border, not text-decoration: an AnimatedNumber's digit slots don't inherit it. */}
            <Flex row borderBottomWidth={1} borderStyle="dotted" borderColor="$neutral3" mb={-1}>
              {typeof value === 'string' ? (
                <Text variant={textVariant} color="$neutral1">
                  {value}
                </Text>
              ) : (
                value
              )}
            </Flex>
          </Flex>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <Tooltip.Arrow />
          <Flex width={300}>{typeof tooltip === 'string' ? <Text variant="body4">{tooltip}</Text> : tooltip}</Flex>
        </Tooltip.Content>
      </Tooltip>
    )
  }
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
