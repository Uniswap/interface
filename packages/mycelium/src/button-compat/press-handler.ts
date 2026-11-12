/**
 * The ONE press-handler type for both ButtonCompat legs (INFRA-3261).
 *
 * The base stub type-re-exports the WEB leg, and `tsc` has no
 * platform-extension resolution — so whatever the web leg types `onPress` as is
 * what EVERY consumer typechecks against, mobile included. When that type was
 * the DOM `MouseEventHandler<HTMLButtonElement>`, a shared file could write
 * `onPress={(e) => e.preventDefault()}`, typecheck green, and throw on device:
 * the native leg then dispatched RNGH's `PressableEvent`, which has no
 * `preventDefault`. It now dispatches RN's `GestureResponderEvent`.
 *
 * So the handler's event is the UNION of what the two legs actually dispatch,
 * behind the same bivariance hack `../touchable-area/props.ts` uses for its
 * press family. The union keeps shared code honest — a handler with an
 * INFERRED event parameter may only touch members present on both events
 * (`preventDefault`/`stopPropagation` now are; DOM-only members like `clientX`
 * stay a compile error). The bivariance keeps
 * the fix zero-cost for existing call sites — a handler explicitly annotated
 * with one platform's event type (the web `MouseEventHandler` idiom) stays
 * assignable, exactly as it is for TouchableAreaCompat's legacy RN-typed
 * handlers.
 *
 * Types only: the RN import is type-only, so this file is safe for any graph
 * to resolve (the `./native-props` precedent).
 */
import type { MouseEvent } from 'react'
import type { GestureResponderEvent } from 'react-native'

/**
 * Bivariant handler type: keeps parameter typing bivariant (like method
 * syntax) so handlers annotated against one leg's event type stay assignable
 * (`../touchable-area/props.ts` convention).
 */
type BivariantHandler<E> = { bivarianceHack(this: void, event: E): void }['bivarianceHack']

/** The native leg dispatches through the RN responder (../compat/native-pressability.ts). */
export type NativeButtonPressEvent = GestureResponderEvent

/** What the web leg's `<button>` dispatches to the press handler. */
export type WebButtonPressEvent = MouseEvent<HTMLButtonElement>

export type ButtonPressHandler = BivariantHandler<WebButtonPressEvent | NativeButtonPressEvent>
