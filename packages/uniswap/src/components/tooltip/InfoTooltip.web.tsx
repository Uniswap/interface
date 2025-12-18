import { PropsWithChildren } from 'react'
import { Flex, type PopperProps, Text, Tooltip, useMedia } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'
import { isWebPlatform } from 'utilities/src/platform'

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
  enabled = true,
  onOpenChange,
}: PropsWithChildren<InfoTooltipProps>): JSX.Element {
  // On xsmall screens, if tooltip placement is right or left
  // Override b/c the tooltip will overflow off the screen
  const media = useMedia()
  const alignmentsToOverride = ['left', 'right'] as PopperProps['placement'][]

  if (placement && alignmentsToOverride.includes(placement) && media.xs) {
    placement = 'top'
  }

  return (
    <Flex row shrink alignItems="center" gap="$spacing4">
      {triggerPlacement === 'end' && children}
      <Tooltip
        open={enabled ? open : false}
        delay={{ close: TOOLTIP_CLOSE_MS, open: 0 }}
        placement={placement}
        restMs={TOOLTIP_REST_MS}
        onOpenChange={onOpenChange}
      >
        <Tooltip.Trigger>{trigger}</Tooltip.Trigger>
        {text && (
          <Tooltip.Content
            zIndex={zIndexes.overlay}
            pointerEvents="auto"
            maxWidth={maxWidth ?? (isWebPlatform ? 280 : '100%')}
            mx="$spacing24"
          >
            <Flex row alignItems="center" gap="$spacing8">
              {icon && <Flex grow>{icon}</Flex>}
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
        )}
      </Tooltip>
      {triggerPlacement === 'start' && children}
    </Flex>
  )
}
