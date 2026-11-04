/**
 * Native leg of the rotation wrappers' platform-resolved pieces. See the web
 * leg's header for why the split lives on this module rather than on per-icon
 * `.native.tsx` twins.
 *
 * Export set pinned against the base leg by `__tests__/platform-legs.test.tsx`.
 */
import { I18nManager } from 'react-native'

/** RN's layout-direction flag. */
export function isRTL(): boolean {
  return I18nManager.isRTL
}

/** Empty on device: RN has no CSS transitions, so the classes would only be a silent uniwind class-map miss. */
export const ROTATE_TRANSITION_CLASS = ''
