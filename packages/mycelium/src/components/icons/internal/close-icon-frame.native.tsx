/** Native leg of `CloseIconWithHover`: a TouchableArea (no hover on device) with token colours. */
import type { ReactElement } from 'react'
import { TouchableAreaCompat as TouchableArea } from '../../../touchable-area/TouchableAreaCompat'
import type { CloseIconProps } from '../CloseIconWithHover'
import { X } from '../X'

export function CloseIconFrame({
  onClose,
  size,
  color = '$neutral2',
  testId,
  role,
  'aria-label': ariaLabel,
}: CloseIconProps): ReactElement {
  return (
    <TouchableArea role={role} aria-label={ariaLabel} testID={testId} onPress={onClose}>
      <X size={size} color={color} />
    </TouchableArea>
  )
}
