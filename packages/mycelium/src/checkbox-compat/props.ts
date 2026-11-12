/**
 * The prop contract for the checkbox compat pair (INFRA-3233), transcribed
 * from the two legacy Tamagui surfaces it replaced in `ui/src`:
 *
 * - `CheckboxCompatProps`        ← legacy `Checkbox`
 *   (`{ variant, checked, size } & Omit<TamaguiCheckboxProps, 'size'>`)
 * - `LabeledCheckboxCompatProps` ← legacy `LabeledCheckbox`
 *
 * The legacy bare `Checkbox` reaches most of its real call-site surface through
 * the `Omit<TamaguiCheckboxProps, 'size'>` spread rather than its declared
 * shape — `onPress`, `onCheckedChange`, `disabled`, `borderColor`,
 * `pointerEvents` and `testID` all arrive that way. Those are declared
 * EXPLICITLY here so the contract is readable and typechecked instead of
 * inherited from a Tamagui type.
 *
 * Token-shaped props stay token-shaped. `size`, `borderColor`, `checkedColor`,
 * `gap`, `px` and `py` all keep accepting their `"$token"` string forms: this
 * contract is public API, and narrowing a token prop to a scalar is exactly
 * the INFRA-3232 regression (`FlexCompatProps.borderWidth: number` rejecting
 * `borderWidth="$spacing1"` at `apps/mobile/src/features/send/SendTokenForm.tsx:364`).
 *
 * Shared across both platform legs — no `react-native` value import (the
 * type-only `StyleProp`/`ViewStyle` import is what mycelium/CLAUDE.md:9
 * sanctions for shared files) and no DOM types on the cross-platform props.
 */
import type * as React from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { ColorValue, SpaceValue } from '../compat/props'

/** Legacy `CheckboxSizeTokens` — verbatim, all three tokens. */
export type CheckboxCompatSizeToken = '$icon.16' | '$icon.18' | '$icon.20'

/**
 * Legacy `SporeComponentVariant` (`ui/src/components/types.ts:1`). Deliberately
 * NOT the unrelated `'default' | 'neutral'` union of the pre-existing web-only
 * `components/checkbox.tsx` — that component is a different API and is left
 * alone (INFRA-3233).
 */
export type CheckboxCompatVariant = 'branded' | 'default'

export type CheckboxPosition = 'start' | 'end'

/**
 * The structural intersection of a DOM `MouseEvent` and an RN
 * `GestureResponderEvent`: both carry `preventDefault` and `stopPropagation`,
 * which is all the legacy handler bodies use.
 */
export interface CheckboxCompatPressEvent {
  preventDefault: () => void
  stopPropagation: () => void
}

/**
 * Bivariant handler type (the `touchable-area/props.ts:90` idiom): keeps
 * parameter typing bivariant like method syntax, so the nullary handlers the
 * real call sites pass (`onPress={toggleDoNotShowAgain}`) and handlers written
 * against the legacy RN event types both stay assignable.
 */
type BivariantHandler<E> = { bivarianceHack(this: void, event: E): void }['bivarianceHack']

export type CheckboxCompatPressHandler = BivariantHandler<CheckboxCompatPressEvent>

/** Legacy `pointerEvents` (an RN prop reaching Checkbox through the Tamagui spread). */
export type CheckboxCompatPointerEvents = 'auto' | 'none' | 'box-none' | 'box-only'

/**
 * Legacy `containerStyle?: StyleProp<ViewStyle | React.CSSProperties>`
 * — reproduced verbatim so every existing call site
 * (`containerStyle={{ flex: 1 }}`) keeps typechecking on both platforms.
 */
export type CheckboxCompatStyleProp = StyleProp<ViewStyle | React.CSSProperties>

/**
 * Legacy `hoverStyle?: FlexProps`. The two real call
 * sites pass plain style objects (`{ opacity: 0.8, backgroundColor: 'unset' }`
 * — `apps/web/src/features/Liquidity/PositionsHeader.tsx:124`,
 * `positionsFilters.tsx:51`), so the value domain here is scalar CSS/RN style
 * values passed verbatim into the inline-style lane. `$`-token VALUES are not
 * resolved: they fail fast at render (see `resolveHoverStyle`) rather than
 * silently painting a raw `"$neutral2"` string, matching the FlexCompat
 * unmappable-token convention. The prop SHAPE is not narrowed — any object
 * literal of scalars is accepted.
 */
export type CheckboxCompatHoverStyle = Readonly<Record<string, string | number | boolean | undefined>>

/**
 * The bare-checkbox contract. `checked` is required exactly like legacy
 * — not optional, and never Radix's `'indeterminate'`.
 */
// TODO(INFRA-4589): there's no aria-label or aria-labelledby prop, so the checkbox can only be named by a web
// <label htmlFor>, and not at all on native.
export interface CheckboxCompatProps {
  /** Required, like legacy. */
  checked: boolean
  /** Icon-size token; each of the three resolves to its OWN size (INFRA-3233). */
  size?: CheckboxCompatSizeToken
  variant?: CheckboxCompatVariant
  disabled?: boolean
  /**
   * ACCEPTED AND IGNORED, exactly like legacy. It reaches legacy only through
   * the `Omit<TamaguiCheckboxProps, 'size'>` spread, and legacy spreads
   * `{...rest}` FIRST and then re-declares `borderColor`
   * itself — later JSX props win, so the caller's value never paints.
   * Two call sites pass `borderColor="$neutral2"`
   * (`LowNativeBalanceModal.tsx:51`, `BridgingModal.tsx:75`); in the unchecked
   * state the derived value is already `$neutral2` (identical), and in the
   * checked state legacy paints the accent regardless. Honouring the prop here
   * would therefore CHANGE the rendering of both call sites, so the no-op is
   * reproduced deliberately. Pinned by `CheckboxCompat.test.tsx`.
   */
  borderColor?: ColorValue
  /**
   * ACCEPTED AND IGNORED, for the same `{...rest}`-then-redeclare reason:
   * legacy always derives
   * `pointerEvents = disabled ? 'none' : 'auto'`. `AccountSelectPopover.tsx:106`
   * passes `pointerEvents="none"` alongside `disabled`, which the derived value
   * already produces.
   */
  pointerEvents?: CheckboxCompatPointerEvents
  /** Legacy RN testID (`RemovePasskeyModal.tsx:293`); `data-testid` on web. */
  testID?: string
  /**
   * Honoured on BOTH legs, because legacy honours it on both. Tamagui's
   * `useCheckbox` never destructures `id`, so it survives into `checkboxProps`
   * and is spread onto the frame on every platform: legacy web emits
   * `id="…"` on the `<button>`, and legacy native puts it on its single RN host.
   * The residue the compat cannot reproduce is legacy's extra native
   * `registerFocusable(props.id, …)` call — Tamagui-internal focus
   * plumbing that mycelium may not import.
   */
  id?: string
  /**
   * WEB-ONLY, exactly like legacy — NOT an oversight on the native leg.
   * `useCheckbox` destructures `name`/`value`/`required` out of the props it
   * forwards and re-emits them only behind `isWeb`: `value` onto the button
   * and `name`/`required` onto a hidden `BubbleInput`
   * that is itself gated on `isFormControl`, which is hard-coded `false` off web. Rendering the legacy `Checkbox` under
   * `TAMAGUI_TARGET=native` confirmed it: the RN host carries `id` and nothing
   * else of the three.
   *
   * So giving `required` a native `aria-required` would be an accessibility
   * IMPROVEMENT over legacy on device, not parity — the same trap as putting
   * `accessibilityRole="button"` on the native container, which legacy's own
   * native leg also omitted. Out of scope for a
   * migration shim. The web/native asymmetry is ledgered and pinned on both legs
   * instead; no call site passes any of the three (27 legacy JSX elements across
   * 25 files, zero hits).
   */
  name?: string
  /** Web-only, like legacy — see `name`. */
  value?: string
  /** Web-only, like legacy — see `name`. */
  required?: boolean
  /** Legacy press handler (5 call sites); receives the platform press event. */
  onPress?: CheckboxCompatPressHandler | null
  /** Legacy Tamagui/Radix change handler (4 call sites); receives the NEXT checked state. */
  onCheckedChange?: BivariantHandler<boolean> | null
  className?: string
  style?: CheckboxCompatStyleProp
}

/**
 * The labeled-checkbox contract — a CLOSED object type, exactly like legacy
 * (`LabeledCheckboxProps` does not spread the Tamagui surface).
 */
export interface LabeledCheckboxCompatProps {
  /** Defaults to `'$icon.20'`, like legacy. */
  size?: CheckboxCompatSizeToken
  /** Defaults to `'start'`, like legacy. */
  checkboxPosition?: CheckboxPosition
  /** Required, like legacy. */
  checked: boolean
  /**
   * A plain string (auto-wrapped in a label), or an element rendered as-is.
   * All four real shapes are supported: string (6 call sites), a `<Text>`
   * element (8), a `<Flex>` element (2), and absent (1).
   */
  text?: string | React.JSX.Element
  /**
   * ACCEPTED AND IGNORED, exactly like legacy: it
   * declared `checkedColor` but never destructured it, so it had no effect
   * there either. Three call sites pass it (`CompatibleAddressModal.tsx:66`,
   * `TokenWarningModal.tsx`, `BackupSpeedBumpModal.tsx`). Reproducing the
   * no-op is deliberate — making it work would be a visual behavior change
   * outside INFRA-3233. Pinned by `LabeledCheckboxCompat.test.tsx`.
   */
  checkedColor?: ColorValue
  variant?: CheckboxCompatVariant
  /** Defaults to `'$spacing12'`, like legacy. Tokens (incl. `'$none'`) → literal class; numbers → inline style. */
  gap?: SpaceValue
  /** Defaults to `'$spacing4'`, like legacy. */
  px?: SpaceValue
  /** No default, like legacy. */
  py?: SpaceValue
  /** Applied while hovered; also opts the container into hover tracking (legacy `hoverable={!!hoverStyle}`). */
  hoverStyle?: CheckboxCompatHoverStyle
  containerStyle?: CheckboxCompatStyleProp
  /**
   * Receives the PRE-TOGGLE state — the value of `checked` at press time, not
   * the next value (legacy passed `checked`
   * straight through). Call sites invert it themselves. Pinned by a test:
   * it is a silent inversion otherwise.
   */
  onCheckPressed?: (currentState: boolean) => void
  testID?: string
  className?: string
}

/* ── Compile-time census of the array-admitting style props ───────────────── */

/**
 * The keys of `P` whose declared type accepts an array. That is the exact
 * hazard class: React DOM iterates an array's numeric keys, finds no CSS
 * property by those names and emits NO style attribute at all, while React
 * Native flattens the same value — so any array-admitting prop handed straight
 * to a leg makes the two legs disagree, silently and with no warning.
 * `flattenStyleProp` (`resolve.ts`) is the shared fix; the census below is what
 * keeps "every prop that needs it" a CHECKED list instead of a remembered one.
 *
 * Deliberately shape-based rather than a check for `CheckboxCompatStyleProp`:
 * a prop declared `ViewStyle | ViewStyle[]` carries the identical hazard
 * without naming that alias, and would slip past a name-based test.
 */
type ArrayAdmittingKeys<P> = { [K in keyof P]-?: [] extends NonNullable<P[K]> ? K : never }[keyof P]

type Exactly<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

/** Compiles only for `true`; a census mismatch fails here with TS2344. */
type Expect<T extends true> = T

/**
 * If either of these stops compiling you have added or widened a prop so that
 * it now admits an array. Route it through `flattenStyleProp` on BOTH platform
 * legs, pin it with a web+native array test, and then add its name here. Do not
 * "fix" this by relaxing the expected union — the union is the point.
 */
export type CheckboxCompatArrayStylePropCensus = Expect<Exactly<ArrayAdmittingKeys<CheckboxCompatProps>, 'style'>>
export type LabeledCheckboxCompatArrayStylePropCensus = Expect<
  Exactly<ArrayAdmittingKeys<LabeledCheckboxCompatProps>, 'containerStyle'>
>

/**
 * Pins the ELEMENT TYPE of the style lane, which the array census above does
 * not cover: that one asks "which props admit an array", this one asks "what
 * may be inside one".
 *
 * Why it is a pin and not a signature: `flattenStyleProp` returns
 * `Record<string, unknown>`, and the four call sites narrow that to their own
 * platform type (`as ViewStyle` on native, `as React.CSSProperties` on web).
 * That narrowing is unchecked BY CONSTRUCTION and no return type can fix it —
 * this alias is a single union spanning both platforms, shared verbatim by both
 * legs, so nothing at a call site can tell the legs apart. Giving the function
 * a per-leg typed return would mean two implementations, which is precisely the
 * divergence `flattenStyleProp` exists to prevent (see its doc comment). The
 * casts are the price of the single definition; this census is the backstop
 * bought in exchange.
 *
 * So: widening this alias silently widens what those four casts absorb. If this
 * stops compiling, that is what happened. Audit all four call sites for the new
 * member before updating the expectation — do not just re-sync it.
 */
export type CheckboxCompatStylePropElementCensus = Expect<
  Exactly<CheckboxCompatStyleProp, StyleProp<ViewStyle | React.CSSProperties>>
>
