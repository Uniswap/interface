import { X } from 'ui/src/components/icons/X'
import { TouchableArea } from 'ui/src/components/touchable'
import { IconSizeTokens } from 'ui/src/theme'

export type CloseIconProps = {
  onClose: () => void
  size?: IconSizeTokens
  testId?: string
  role?: 'button' | 'none'
}

// Default styling for a basic close icon with hover. Created this component to be use across platforms in order to unify behavior and styling
export function CloseIconWithHover({
  onClose,
  size = '$icon.24',
  testId,
  role = 'button',
}: CloseIconProps): JSX.Element {
  return (
    <TouchableArea role={role} data-testid={testId} onPress={onClose}>
      <X size={size} color="$neutral2" hoverColor="$neutral2Hovered" />
    </TouchableArea>
  )
}
