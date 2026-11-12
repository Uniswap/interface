/**
 * Responder-level press wiring for the compat layout legs (INFRA-3536):
 * responder-inert without handlers, a11y-silent, and hit-test-identical to
 * the plain RN `View` the legs always mount. This module OWNS the rationale —
 * the legs carry pointers, not copies.
 *
 * Why not RN `Pressable` (measured on Pressability.js / Pressable.js): its
 * claim, `onStartShouldSetResponder: () => !disabled ?? true`, is
 * unconditional and bubble-phase, so even a handler-less Pressable claims
 * touches on descendants — nested inside a TouchableArea it swallows the
 * ancestor's press; its only off switch, `disabled`, folds into
 * `accessibilityState` AFTER the caller's own prop, so inertness would read
 * as "disabled" to screen readers; and `pointerEvents="box-none"` neither
 * stops the bubble-phase claim nor preserves plain-View overlay blocking.
 * Hence: the plain View host (one element type for the component's life — a
 * conditionally-passed handler never remounts the subtree) plus these
 * responder props, attached only while a handler is live.
 *
 * No implicit a11y props either way: legacy Tamagui's native press path sets
 * neither `accessible` nor `focusable` (measured on @tamagui/web's
 * createComponent.native.js + getSplitStyles.native.js), and an implicit
 * `accessible: true` would flatten the subtree into ONE screen-reader
 * element, hiding focusable descendants. `nativeCompatProps`' allow-list is
 * the single owner of `accessible`; call sites opt in as pre-conversion.
 *
 * Dispatch matches Pressability's defaults: grant → onPressIn, long press at
 * 500ms firing onLongPress and cancelling onPress, release → onPressOut then
 * onPress, terminate (responder stolen) → onPressOut only, termination
 * allowed. Press-rect move-cancel too: the grant target is measured
 * (Pressability's grant-time measure) and sliding off the offset-expanded
 * rect fires onPressOut and makes the eventual release a no-op; sliding back
 * in re-fires onPressIn. The long-press timer runs regardless and is gated
 * at fire time on being inside the rect (Pressability's press-in state
 * gate). An unmeasurable grant target (DOM/test hosts) leaves move-cancel
 * inert. A mid-gesture handler detach finishes the gesture eagerly: the
 * pending onPressOut fires with the last live handler set and the timer
 * dies. This hook is also the dispatch path of the RNGH-hosted press targets
 * (TouchableAreaCompat, ButtonCompat, ButtonFrameCompat): their host's own
 * gesture props lose arbitration to outer RNGH gestures and to an enclosing
 * TouchableArea's native button; the responder pipeline does not — TextCompat alone keeps RN Text's built-in
 * pressability. RN's own Pressability stays deliberately unused: it is a
 * private deep import (react-native/Libraries/…) with no types or exports
 * entry, so this module implements the same contract on public API only.
 * Accepted divergence: no delayPressIn/delayPressOut/minPressDuration knobs.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { GestureResponderEvent, MeasureOnSuccessCallback } from 'react-native'
import { useEvent } from 'utilities/src/react/hooks'
import {
  hasNativePressProps,
  nativePressProps,
  type NativePressProps,
  type PressForwardableProps,
} from './native-props'

/** Pressability's DEFAULT_LONG_PRESS_DELAY_MS: onLongPress fires 500ms after grant. */
const LONG_PRESS_DELAY_MS = 500

/** Pressability's DEFAULT_PRESS_RECT_OFFSET: the press stays live this far outside the view. */
const PRESS_RECT_OFFSET = { top: 20, left: 20, right: 20, bottom: 30 }

interface PressRect {
  left: number
  top: number
  right: number
  bottom: number
}

/** A grant target that can report its window frame (RN host components; absent in DOM/test hosts). */
interface MeasurableTarget {
  measure?: (callback: MeasureOnSuccessCallback) => void
}

export interface NativePressResponderProps {
  onStartShouldSetResponder?: (this: void) => boolean
  onResponderGrant?: (this: void, event: GestureResponderEvent) => void
  onResponderMove?: (this: void, event: GestureResponderEvent) => void
  onResponderRelease?: (this: void, event: GestureResponderEvent) => void
  onResponderTerminate?: (this: void, event: GestureResponderEvent) => void
  onResponderTerminationRequest?: (this: void) => boolean
}

/** The layout legs' press wiring: responder props while a handler is live, nothing otherwise. */
export function useNativePressResponder(props: PressForwardableProps): NativePressResponderProps {
  const pressProps = nativePressProps(props)
  const live = hasNativePressProps(pressProps)

  const latest = useRef<NativePressProps>(pressProps)
  const lastLivePressOut = useRef<NativePressProps['onPressOut']>(undefined)
  // Intentional latest-ref pattern: one callback identity across renders,
  // always dispatching the committed render's (gated) handlers. Written in a
  // layout effect rather than render (concurrent React may discard or replay
  // a render pass) — never stale, since responder callbacks and the passive
  // detach effect below only ever run after layout effects.
  useLayoutEffect(() => {
    latest.current = pressProps
    if (live) {
      lastLivePressOut.current = pressProps.onPressOut
    }
  })

  // In-flight gesture state, for the detach-while-granted cleanup and the
  // finished-gesture dispatch guard.
  const granted = useRef(false)
  const grantEvent = useRef<GestureResponderEvent | undefined>(undefined)
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const longPressFired = useRef(false)
  // Press-rect move-cancel state: the window-space rect (measured on grant,
  // expanded by Pressability's press-rect offset) and whether the touch is
  // currently inside it. An unmeasurable target (DOM/test hosts) leaves the
  // rect undefined and move-cancel inert.
  const pressRect = useRef<PressRect | undefined>(undefined)
  const insidePressRect = useRef(true)

  const cancelLongPress = useCallback((): void => {
    if (longPressTimeout.current !== undefined) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = undefined
    }
  }, [])

  /** Shared end-of-gesture bookkeeping for release, terminate, and detach. */
  const settleGesture = useCallback((): void => {
    cancelLongPress()
    granted.current = false
    grantEvent.current = undefined
    pressRect.current = undefined
  }, [cancelLongPress])

  // Detach while granted: the wiring is leaving the host with this commit,
  // so finish the gesture eagerly — pending onPressOut (from the last live
  // handler set) fires and the timer dies.
  useEffect(() => {
    if (live || !granted.current) {
      return
    }
    const event = grantEvent.current
    const inside = insidePressRect.current
    settleGesture()
    // A slide-off already dispatched the pending onPressOut.
    if (event !== undefined && inside) {
      lastLivePressOut.current?.(event)
    }
    lastLivePressOut.current = undefined
  }, [live, settleGesture])

  // The timer must not outlive the component.
  useEffect(() => cancelLongPress, [cancelLongPress])

  const onStartShouldSetResponder = useCallback((): boolean => hasNativePressProps(latest.current), [])

  const onResponderGrant = useCallback((event: GestureResponderEvent): void => {
    longPressFired.current = false
    granted.current = true
    pressRect.current = undefined
    insidePressRect.current = true
    // Measure the grant target for press-rect move-cancel (Pressability does
    // the same on grant). Optional: DOM/test hosts have no measure.
    ;(event.currentTarget as unknown as MeasurableTarget | undefined)?.measure?.(
      // oxlint-disable-next-line max-params -- RN NativeMethods.measure's fixed callback signature
      (_x, _y, width, height, pageX, pageY) => {
        pressRect.current = {
          left: pageX - PRESS_RECT_OFFSET.left,
          top: pageY - PRESS_RECT_OFFSET.top,
          right: pageX + width + PRESS_RECT_OFFSET.right,
          bottom: pageY + height + PRESS_RECT_OFFSET.bottom,
        }
      },
    )
    // React reuses the synthetic event after the handler returns; the timer
    // and the detach-while-granted cleanup need it later.
    event.persist()
    grantEvent.current = event
    latest.current.onPressIn?.(event)
    // Armed unconditionally and gated at FIRE time, like Pressability: an
    // onLongPress attached mid-gesture is honoured, one removed never fires,
    // and a touch outside the press rect when the timer lands fires nothing
    // (Pressability's press-in state gate).
    longPressTimeout.current = setTimeout(() => {
      longPressTimeout.current = undefined
      const handler = latest.current.onLongPress
      if (handler && insidePressRect.current) {
        longPressFired.current = true
        handler(event)
      }
    }, LONG_PRESS_DELAY_MS)
  }, [])

  // Press-rect move-cancel (Pressability parity): sliding off the measured
  // rect fires onPressOut and disarms the press; sliding back in re-fires
  // onPressIn. The long-press timer keeps running and is gated at fire time.
  const onResponderMove = useCallback((event: GestureResponderEvent): void => {
    const rect = pressRect.current
    if (!granted.current || rect === undefined) {
      return
    }
    const native = event.nativeEvent as GestureResponderEvent['nativeEvent'] | undefined
    const touch = native?.touches !== undefined && native.touches.length > 0 ? native.touches[0] : native
    if (touch === undefined || typeof touch.pageX !== 'number' || typeof touch.pageY !== 'number') {
      return
    }
    const inside =
      touch.pageX >= rect.left && touch.pageX <= rect.right && touch.pageY >= rect.top && touch.pageY <= rect.bottom
    if (inside === insidePressRect.current) {
      return
    }
    insidePressRect.current = inside
    if (inside) {
      latest.current.onPressIn?.(event)
    } else {
      latest.current.onPressOut?.(event)
    }
  }, [])

  const onResponderRelease = useCallback(
    (event: GestureResponderEvent): void => {
      // Already settled (mid-gesture detach finished it) — never double-dispatch.
      if (!granted.current) {
        return
      }
      const suppressed = longPressFired.current
      // Slid off the press rect: onPressOut already fired on exit, and a
      // release outside never activates (Pressability parity).
      const inside = insidePressRect.current
      settleGesture()
      if (!inside) {
        return
      }
      const { onPress, onPressOut } = latest.current
      onPressOut?.(event)
      if (!suppressed) {
        onPress?.(event)
      }
    },
    [settleGesture],
  )

  const onResponderTerminate = useCallback(
    (event: GestureResponderEvent): void => {
      if (!granted.current) {
        return
      }
      const inside = insidePressRect.current
      settleGesture()
      if (inside) {
        latest.current.onPressOut?.(event)
      }
    },
    [settleGesture],
  )

  const onResponderTerminationRequest = useCallback((): boolean => true, [])

  if (!live) {
    return {}
  }

  return {
    onStartShouldSetResponder,
    onResponderGrant,
    onResponderMove,
    onResponderRelease,
    onResponderTerminate,
    onResponderTerminationRequest,
  }
}

type AccessibilityAction = { name: string; label?: string }

export interface NativeActivateActionInput {
  /** The press handler a screen-reader activation should run; absent (or detached) means nothing is added. */
  onPress?: (event: GestureResponderEvent) => void
  /** The caller's own actions and handler, merged rather than replaced. */
  accessibilityActions?: ReadonlyArray<AccessibilityAction>
  onAccessibilityAction?: (event: unknown) => void
}

export interface NativeActivateActionProps {
  accessibilityActions?: ReadonlyArray<AccessibilityAction>
  onAccessibilityAction?: (event: unknown) => void
}

const ACTIVATE: AccessibilityAction = { name: 'activate' }

/**
 * Screen-reader activation for the RNGH-hosted press targets (TouchableArea,
 * Button, ButtonFrame) — NOT the layout legs, which stay a11y-silent (header).
 *
 * Their host is RNGH's native button, which is natively clickable: TalkBack's
 * double-tap lands on its `performClick`, which activates RNGH's own gesture,
 * not the responder wiring above — so a responder-dispatched press would never
 * run. Declaring `activate` makes RN's accessibility delegate claim that click
 * (dispatching `onAccessibilityAction` without calling `performClick`), so it
 * runs the press handler exactly once. A normal tap never produces an
 * accessibility action. A caller that declares `activate` itself owns it.
 */
export function useNativeActivateAction({
  onPress,
  accessibilityActions,
  onAccessibilityAction,
}: NativeActivateActionInput): NativeActivateActionProps {
  const live = onPress !== undefined && !(accessibilityActions ?? []).some((action) => action.name === ACTIVATE.name)

  const actions = useMemo(() => [...(accessibilityActions ?? []), ACTIVATE], [accessibilityActions])

  const handleAccessibilityAction = useEvent((event: unknown): void => {
    const actionName = (event as { nativeEvent?: { actionName?: string } } | undefined)?.nativeEvent?.actionName
    if (actionName === ACTIVATE.name && onPress) {
      onPress(event as GestureResponderEvent)
      return
    }
    onAccessibilityAction?.(event)
  })

  if (!live) {
    return {}
  }

  return { accessibilityActions: actions, onAccessibilityAction: handleAccessibilityAction }
}
