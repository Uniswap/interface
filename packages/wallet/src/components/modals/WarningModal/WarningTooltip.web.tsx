import { PropsWithChildren } from 'react'
import { Flex, Text, Tooltip } from 'ui/src'
import { WarningTooltipProps } from 'wallet/src/components/modals/WarningModal/WarningTooltipProps'

const TOOLTIP_REST_MS = 20
const TOOLTIP_CLOSE_MS = 100

export function WarningTooltip({
  title,
  text,
  icon,
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
          <Flex row alignItems="center" gap="$spacing8">
            <Flex grow>{icon}</Flex>
            <Flex shrink gap="$spacing4">
              {title && (
                <Text alignSelf="flex-start" variant="body3">
                  {title}
                </Text>
              )}
              <Text color="$neutral2" variant="body3">
                {text}
              </Text>
              <Flex alignSelf="flex-start">{button}</Flex>
            </Flex>
          </Flex>
          <Tooltip.Arrow />
        </Tooltip.Content>
      </Tooltip>
      {triggerPlacement === 'start' && children}
    </Flex>
  )
}
