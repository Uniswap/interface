import { TouchableArea } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { iconSizes } from 'ui/src/theme'

/**
 * Standard icon button used as the trigger for context menus.
 * Provides consistent sizing, hover background, and animation across all context menu triggers.
 */
export function ContextMenuTriggerButton(): JSX.Element {
  return (
    <TouchableArea
      centered
      height={iconSizes.icon28}
      width={iconSizes.icon28}
      borderRadius="$rounded12"
      hoverStyle={{ backgroundColor: '$surface3' }}
      animation="fast"
      animateOnly={['transform', 'opacity']}
    >
      <MoreHorizontal size={iconSizes.icon16} color="$neutral2" />
    </TouchableArea>
  )
}
