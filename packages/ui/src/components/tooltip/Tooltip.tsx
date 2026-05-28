import { Tooltip as TamaguiTooltip, TooltipProps, withStaticProperties } from 'tamagui'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type { TooltipProps } from 'tamagui'

type TriggerProps = React.ComponentProps<typeof TamaguiTooltip.Trigger>
export type TooltipContentProps = Omit<React.ComponentProps<typeof TamaguiTooltip.Content>, 'zIndex'> & {
  animationDirection?: 'left' | 'right' | 'top' | 'bottom'
  /**
   * Escape hatch for the stacking layer. When omitted, Tooltip.Content reads
   * EffectiveModalOrSheetZIndexContext and renders one layer above its closest
   * modal/sheet/popover ancestor (floor: `zIndexes.tooltip`).
   */
  zIndex?: React.ComponentProps<typeof TamaguiTooltip.Content>['zIndex']
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
