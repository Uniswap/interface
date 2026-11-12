import type { Insets, ViewStyle } from 'react-native'

/**
 * RN's responder hit-test (Android TouchTargetHelper) reads hitSlop only from RN's
 * own views, never RNGH's gesture-only `hitSlop`, so a responder-dispatched Button
 * gets its slop from an invisible absolutely-positioned child that extends past the
 * frame. It adds tap area without taking part in layout. iOS still needs `hitSlop` on
 * the RNGH host too: its hitTest returns nil outside the host's own hit rect before
 * descending to children, so the slop child alone is unreachable there.
 */
export function hitSlopAreaStyle(hitSlop: number | Insets | null | undefined): ViewStyle | undefined {
  if (hitSlop === null || hitSlop === undefined) {
    return undefined
  }
  const insets =
    typeof hitSlop === 'number' ? { top: hitSlop, left: hitSlop, bottom: hitSlop, right: hitSlop } : hitSlop
  return {
    position: 'absolute',
    top: -(insets.top ?? 0),
    left: -(insets.left ?? 0),
    bottom: -(insets.bottom ?? 0),
    right: -(insets.right ?? 0),
  }
}
