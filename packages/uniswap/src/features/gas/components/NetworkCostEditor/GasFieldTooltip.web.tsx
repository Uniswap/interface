import { Flex, Text, Tooltip } from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import type { GasFieldTooltipProps } from 'uniswap/src/features/gas/components/NetworkCostEditor/GasFieldTooltip'
import { useTooltipCopy } from 'uniswap/src/features/gas/components/NetworkCostEditor/useGasFieldTooltipCopy'

const TOOLTIP_REST_MS = 20
const TOOLTIP_CLOSE_MS = 100

export function GasFieldTooltip({ tooltipKey }: GasFieldTooltipProps): JSX.Element {
  const { title, body } = useTooltipCopy(tooltipKey)

  return (
    <Tooltip delay={{ close: TOOLTIP_CLOSE_MS, open: 0 }} restMs={TOOLTIP_REST_MS}>
      <Tooltip.Trigger>
        <InfoCircle color="$neutral3" size="$icon.16" />
      </Tooltip.Trigger>
      <Tooltip.Content maxWidth={280}>
        <Flex gap="$spacing4">
          <Text variant="body3">{title}</Text>
          <Text variant="body4" color="$neutral2">
            {body}
          </Text>
        </Flex>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}
