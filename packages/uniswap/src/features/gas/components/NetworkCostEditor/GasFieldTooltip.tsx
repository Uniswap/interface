import { PlatformSplitStubError } from 'utilities/src/errors'

export type GasTooltipKey = 'maxBaseFee' | 'priorityFee' | 'gasLimit'

export interface GasFieldTooltipProps {
  tooltipKey: GasTooltipKey
}

/**
 * Info-icon trigger that shows tooltip copy for a gas-override field.
 * - Mobile: tapping the icon opens a bottom-sheet modal with title + body.
 * - Web/extension: hovering the icon shows a popover with title + body.
 */
export function GasFieldTooltip(_props: GasFieldTooltipProps): JSX.Element {
  throw new PlatformSplitStubError('GasFieldTooltip')
}
