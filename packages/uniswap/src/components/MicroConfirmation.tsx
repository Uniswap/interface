import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { isWebApp } from 'utilities/src/platform'

type MicroConfirmationProps = {
  /** Intended to be a micro toast/tooltip, text should not be more than 4 words */
  text: string
  /** Overrides the default tooltip hover behavior; controls whether the tooltip should be displayed */
  showTooltip: boolean
  trigger: JSX.Element
  icon?: JSX.Element
}

/** A tiny little confirmation notification that triggers after some action.

- On web, this is a tooltip that only displays when show=true (not on hover)
- On mobile/extension, this is a micro notification toast
 */
export function MicroConfirmation({ text, showTooltip, trigger, icon }: MicroConfirmationProps): JSX.Element | null {
  if (isWebApp) {
    return <InfoTooltip icon={icon} open={showTooltip} trigger={trigger} text={text} />
  }
  // Not the greatest pattern, but callsite handles showing/hiding notification via dispatch(pushNotification(...))
  // There is an existing `CopiedNotification` set up in packages/wallet that handles the mobile/extension micro toast UI
  return trigger
}
