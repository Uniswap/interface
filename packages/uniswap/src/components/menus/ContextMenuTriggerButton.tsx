import { isWebPlatform } from '@universe/environment'
import { TouchableArea } from '@universe/mycelium'
import { MoreHorizontal } from '@universe/mycelium/icons/MoreHorizontal'
import { iconSizes } from '@universe/mycelium/tokens'

// Press feedback here is instant: the migrated TouchableArea exposes no animation knob and
// emits no transition, so the pressed-opacity change it still applies cannot be eased.
const triggerButtonProps = {
  centered: true,
  height: iconSizes.icon28,
  width: iconSizes.icon28,
  borderRadius: '$rounded12',
  hoverStyle: { backgroundColor: '$surface3' },
} as const

/**
 * Web uses TouchableArea for hover feedback.
 * Native uses Flex so the parent ContextMenu owns press handling —
 * nested TouchableAreas on native swallow taps before the outer trigger fires.
 */
export function ContextMenuTriggerButton(): JSX.Element {
  const icon = <MoreHorizontal size={iconSizes.icon16} color="$neutral2" />

  if (isWebPlatform) {
    return <TouchableArea {...triggerButtonProps}>{icon}</TouchableArea>
  }

  return icon
}
