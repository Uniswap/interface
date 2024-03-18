import { PropsWithChildren } from 'react'
import { Flex, Text, Tooltip } from 'ui/src'
import { WarningTooltipProps } from 'wallet/src/components/modals/WarningModal/WarningTooltipProps'

const TOOLTIP_REST_MS = 250
const TOOLTIP_CLOSE_MS = 500

export function WarningTooltip({
  title,
  text,
  button,
  trigger,
  triggerPlacement = 'end',
  children,
  placement,
}: PropsWithChildren<WarningTooltipProps>): JSX.Element {
  return (
    <Flex row shrink alignItems="center" gap="$spacing4">
      {triggerPlacement === 'end' && children}
      <Tooltip
        delay={{ close: TOOLTIP_CLOSE_MS, open: 0 }}
        placement={placement}
        restMs={TOOLTIP_REST_MS}>
        <Tooltip.Trigger>{trigger}</Tooltip.Trigger>
        <Tooltip.Content maxWidth="100%" mx="$spacing24">
          <Flex centered gap="$spacing8">
            {title && (
              <Text alignSelf="flex-start" variant="body3">
                {title}
              </Text>
            )}
            <Text color="$neutral2" variant="body4">
              {text}
            </Text>
            <Flex alignSelf="flex-start">{button}</Flex>
          </Flex>
          <Tooltip.Arrow />
        </Tooltip.Content>
      </Tooltip>
      {triggerPlacement === 'start' && children}
    </Flex>
  )
}
