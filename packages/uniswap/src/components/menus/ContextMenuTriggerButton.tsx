import { isWebPlatform } from '@universe/environment'
import { TouchableArea } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { iconSizes } from 'ui/src/theme'

const triggerButtonProps = {
  centered: true,
  height: iconSizes.icon28,
  width: iconSizes.icon28,
  borderRadius: '$rounded12',
  hoverStyle: { backgroundColor: '$surface3' },
  animation: 'fast',
  animateOnly: ['transform', 'opacity'] as string[],
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
