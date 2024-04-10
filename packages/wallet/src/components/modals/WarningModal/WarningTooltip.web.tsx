import { PropsWithChildren } from 'react'
import { Flex, Text, Tooltip } from 'ui/src'
import { WarningTooltipProps } from 'wallet/src/components/modals/WarningModal/WarningTooltipProps'

const TOOLTIP_REST_MS = 250
const TOOLTIP_CLOSE_MS = 500

export function WarningTooltip({
  text,
  button,
  icon,
  children,
  placement,
}: PropsWithChildren<WarningTooltipProps>): JSX.Element {
  return (
    <Flex row shrink alignItems="center" gap="$spacing4">
      {children}
      <Tooltip
        delay={{ close: TOOLTIP_CLOSE_MS, open: 0 }}
        placement={placement}
        restMs={TOOLTIP_REST_MS}>
        <Tooltip.Trigger>{icon}</Tooltip.Trigger>
        <Tooltip.Content maxWidth="100%" mx="$spacing24">
          <Flex centered gap="$spacing8">
            <Text color="$neutral2" variant="body4">
              {text}
            </Text>
            <Flex alignSelf="flex-start">{button}</Flex>
          </Flex>
          <Tooltip.Arrow />
        </Tooltip.Content>
      </Tooltip>
    </Flex>
  )
}
