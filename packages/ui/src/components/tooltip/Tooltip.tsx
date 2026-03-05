import { Tooltip as TamaguiTooltip, TooltipProps, withStaticProperties } from 'tamagui'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type { TooltipProps } from 'tamagui'

type TriggerProps = React.ComponentProps<typeof TamaguiTooltip.Trigger>
export type TooltipContentProps = Omit<React.ComponentProps<typeof TamaguiTooltip.Content>, 'zIndex'> & {
  animationDirection?: 'left' | 'right' | 'top' | 'bottom'
  // zIndex is required to properly display components
  zIndex: NonNullable<React.ComponentProps<typeof TamaguiTooltip.Content>['zIndex']>
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
