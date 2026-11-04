/**
 * Native leg of `CheckboxCompat` — React Native `Pressable` + `View` on uniwind
 * classNames, following the shipped `TouchableAreaCompat.native.tsx` and
 * `SegmentedControl.native.tsx` precedents.
 *
 * SUBSTRATE DECISION (INFRA-3233): plain `react-native`, no checkbox library.
 * A checkbox's behavior is a boolean, a press handler, and
 * `accessibilityRole="checkbox"` + `accessibilityState={{ checked }}`, which
 * `Pressable` provides directly — not worth a dependency on the mobile bundle.
 *
 * CHECK GLYPH DECISION: a bordered, rotated `View`. Decided when mycelium's
 * icons were web-only; since INFRA-3508 mycelium icons have a real native leg
 * (`createIcon.native.tsx`, react-native-svg as an optional peer), so
 * redrawing this glyph with a real icon is available follow-up work. Fidelity
 * tradeoff versus legacy (which renders the `react-native-svg` two-line
 * stroke check): square stroke ends instead of round caps, and a flat 2px
 * stroke where legacy's is proportional (`strokeWidth: 5` in a 48 viewBox),
 * so the tick reads slightly heavier at `$icon.16`.
 *
 * Hover/focus/press: hover and focus are React state (uniwind resolves neither
 * `hover:` nor `group-hover:` on native — the miss is silent), matching what
 * `SegmentedControl.native.tsx` already ships and what legacy does with its own
 * state. `pressed` is deliberately NOT tracked: legacy drives it from DOM
 * `onMouseDown`/`onMouseUp`, which never fire under
 * React Native, so legacy's pressed glyph enlargement does not exist on device
 * today. Adding it would be a visual change on device, outside this issue.
 */
import * as React from 'react'
import { Pressable, View, type GestureResponderEvent, type ViewStyle } from 'react-native'
import { cn } from '../cn'
import {
  checkboxBoxClassName,
  checkboxFocusRingClassName,
  checkboxIndicatorClassName,
  checkGlyphClassName,
  HOVER_DOT_CLASSES,
  type CheckboxFrameState,
} from './compile'
import type { CheckboxCompatProps } from './props'
import {
  checkGlyphGeometry,
  checkGlyphPx,
  DEFAULT_CHECKBOX_SIZE,
  DEFAULT_CHECKBOX_VARIANT,
  flattenStyleProp,
  hoverDotPx,
  resolveCheckboxSizes,
  shouldShowHoverDot,
  shouldShowIndicator,
} from './resolve'

/** Legacy tracks `isPressed` from DOM mouse events, which RN never fires. */
const NATIVE_PRESSED = false

export const CheckboxCompat = React.forwardRef<View, CheckboxCompatProps>(function CheckboxCompat(props, ref) {
  const {
    checked,
    size = DEFAULT_CHECKBOX_SIZE,
    variant = DEFAULT_CHECKBOX_VARIANT,
    disabled = false,
    testID,
    id,
    onPress,
    onCheckedChange,
    className,
    style,
  } = props

  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)

  const sizes = resolveCheckboxSizes(size)
  const frame: CheckboxFrameState = { size, variant, checked, disabled, hovered, focused }

  const handlePress = React.useCallback(
    (event: GestureResponderEvent): void => {
      if (disabled) {
        return
      }
      onPress?.(event)
      onCheckedChange?.(!checked)
    },
    [checked, disabled, onCheckedChange, onPress],
  )

  const glyphPx = checkGlyphPx(sizes, NATIVE_PRESSED)
  const glyph = checkGlyphGeometry(glyphPx)
  const dotPx = hoverDotPx(sizes, NATIVE_PRESSED)

  return (
    <View className={checkboxFocusRingClassName(frame)}>
      <Pressable
        ref={ref}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled: disabled || undefined }}
        disabled={disabled}
        // `id` is the one of the four Tamagui form/focus props legacy honours on
        // device; `name`/`value`/`required` are web-only there — see
        // `CheckboxCompatProps`.
        id={id}
        // Legacy always derives pointerEvents from `disabled`
        // and overrides any caller value; RN honours the prop form, and the
        // class form ships in the same className for web parity.
        pointerEvents={disabled ? 'none' : 'auto'}
        testID={testID}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={handlePress}
        style={flattenStyleProp(style) as ViewStyle}
        className={cn(checkboxBoxClassName(frame), className)}
      >
        {shouldShowIndicator(checked) ? (
          <View className={checkboxIndicatorClassName(frame)}>
            <View className={checkGlyphClassName(frame)} style={glyph} />
          </View>
        ) : null}
        {shouldShowHoverDot({ checked, hovered, disabled }) ? (
          <View className={HOVER_DOT_CLASSES} style={{ width: dotPx, height: dotPx }} />
        ) : null}
      </Pressable>
    </View>
  )
})
