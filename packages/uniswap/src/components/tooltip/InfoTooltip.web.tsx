import { PropsWithChildren } from 'react'
import { Flex, Text, Tooltip, isWeb } from 'ui/src'
import { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'

const TOOLTIP_REST_MS = 20
const TOOLTIP_CLOSE_MS = 100

export function InfoTooltip({
  title,
  text,
  icon,
  button,
  trigger,
  triggerPlacement = 'end',
  children,
  maxWidth,
  placement,
  open,
}: PropsWithChildren<InfoTooltipProps>): JSX.Element {
  return (
    <Flex row shrink alignItems="center" gap="$spacing4">
      {triggerPlacement === 'end' && children}
      <Tooltip
        {...(open !== undefined && { open })}
        delay={{ close: TOOLTIP_CLOSE_MS, open: 0 }}
        placement={placement}
        restMs={TOOLTIP_REST_MS}
      >
        <Tooltip.Trigger>{trigger}</Tooltip.Trigger>
        <Tooltip.Content maxWidth={maxWidth ?? (isWeb ? 280 : '100%')} mx="$spacing24">
          <Flex row alignItems="center" gap="$spacing8">
            <Flex grow>{icon}</Flex>
            <Flex shrink gap="$spacing4">
              {title && (
                <Text alignSelf="flex-start" variant="body4">
                  {title}
                </Text>
              )}
              <Text color="$neutral2" variant="body4">
                {text}
              </Text>
              {button && (
                <Flex alignSelf="flex-start" width="100%">
                  {button}
                </Flex>
              )}
            </Flex>
          </Flex>
          <Tooltip.Arrow />
        </Tooltip.Content>
      </Tooltip>
      {triggerPlacement === 'start' && children}
    </Flex>
  )
}
