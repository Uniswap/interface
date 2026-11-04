/**
 * Native leg of the `ModalCloseIcon` compat (INFRA-3282): the same
 * TouchableArea frame (its real `Pressable` leg) around mycelium's `X` icon.
 *
 * Legacy behavior on device, mirrored deliberately:
 * - never hidden — the legacy media gate is `isWebApp && sm`, and `isWebApp`
 *   is compile-time `false` on this platform split, so no media subscription
 *   is created here;
 * - no hover — the legacy icon factory gates hover handling to web;
 *   `hoverColor` is accepted so the shared prop contract is identical across
 *   legs, and unused exactly as legacy leaves it unused on device.
 */
import { type JSX } from 'react'
import { X } from '../components/icons/X'
import { useSporeColors } from '../theme-hooks-compat'
import { TouchableAreaCompat } from '../touchable-area/TouchableAreaCompat'
import {
  DEFAULT_CLOSE_ICON_COLOR,
  DEFAULT_CLOSE_ICON_ROLE,
  DEFAULT_CLOSE_ICON_SIZE,
  type ModalCloseIconProps,
} from './props'
import { closeIconSizePx, resolveCloseIconColor } from './resolve'

export function ModalCloseIconCompat({
  onClose,
  size = DEFAULT_CLOSE_ICON_SIZE,
  color = DEFAULT_CLOSE_ICON_COLOR,
  testId,
  role = DEFAULT_CLOSE_ICON_ROLE,
}: ModalCloseIconProps): JSX.Element {
  const colors = useSporeColors()
  const px = closeIconSizePx(size)

  return (
    <TouchableAreaCompat role={role} testID={testId} shouldAutomaticallyInjectColors={false} onPress={onClose}>
      <X color={resolveCloseIconColor(color, colors)} size={px} />
    </TouchableAreaCompat>
  )
}
