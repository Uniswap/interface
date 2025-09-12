import { Tooltip as TamaguiTooltip, TooltipProps, withStaticProperties } from 'tamagui'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type { TooltipProps } from 'tamagui'

type TriggerProps = React.ComponentProps<typeof TamaguiTooltip.Trigger>
export type TooltipContentProps = React.ComponentProps<typeof TamaguiTooltip.Content> & {
  animationDirection?: 'left' | 'right' | 'top' | 'bottom'
}
type ArrowProps = React.ComponentProps<typeof TamaguiTooltip.Arrow>

export const Tooltip = withStaticProperties(
  (_props: TooltipProps) => {
    throw new PlatformSplitStubError('Tooltip')
  },
  {
    Trigger: (_props: TriggerProps) => {
      throw new PlatformSplitStubError('Tooltip.Trigger')
    },
    Content: (_props: TooltipContentProps) => {
      throw new PlatformSplitStubError('Tooltip.Content')
    },
    Arrow: (_props: ArrowProps) => {
      throw new PlatformSplitStubError('Tooltip.Arrow')
    },
  },
)
