/**
 * Web leg of `CheckboxCompat` — the drop-in Tailwind replacement for the legacy
 * Tamagui `ui/src` `Checkbox`.
 *
 * Structure is the legacy structure: an outer focus-ring frame wrapping the
 * control, the control containing an Indicator square (when checked) and an
 * absolutely-positioned hover dot (when unchecked + hovered). Hover, focus and
 * press live in React state exactly as legacy did it (driven
 * by DOM mouse/focus handlers) — not in `hover:` /
 * `focus-visible:` variants, which do not resolve on native and would make the
 * two legs behave differently.
 *
 * The check glyph is mycelium's own `Check` icon, whose SVG geometry is
 * byte-identical to the legacy `ui/src` `Check` (same two lines in the same
 * 48 viewBox), so the web glyph is exact legacy parity. The native leg cannot
 * use it — see `CheckboxCompat.native.tsx`.
 */
// oxlint-disable react/forbid-elements -- the compat components ARE the raw DOM
// boundary. FlexCompat is deliberately not used here: it has no native leg yet
// (INFRA-3229 is in flight), and both legs must share one structure.
import * as React from 'react'
import { cn } from '../cn'
import { domTestId } from '../compat/dom-test-id'
import { warnDroppedRegisteredStyle, warnUnsupportedWebStyleKeys } from '../compat/web-diagnostics'
import { Check } from '../components/icons/Check'
import {
  checkboxBoxClassName,
  checkboxFocusRingClassName,
  checkboxIndicatorClassName,
  checkGlyphColorToken,
  HOVER_DOT_CLASSES,
  type CheckboxFrameState,
} from './compile'
import type { CheckboxCompatProps } from './props'
import {
  checkGlyphPx,
  DEFAULT_CHECKBOX_SIZE,
  DEFAULT_CHECKBOX_VARIANT,
  flattenStyleProp,
  hoverDotPx,
  resolveCheckboxSizes,
  shouldShowHoverDot,
  shouldShowIndicator,
} from './resolve'

export const CheckboxCompat = React.forwardRef<HTMLButtonElement, CheckboxCompatProps>(
  function CheckboxCompat(props, ref) {
    const {
      checked,
      size = DEFAULT_CHECKBOX_SIZE,
      variant = DEFAULT_CHECKBOX_VARIANT,
      disabled = false,
      testID,
      id,
      name,
      value,
      required,
      onPress,
      onCheckedChange,
      className,
      style,
    } = props

    const [hovered, setHovered] = React.useState(false)
    const [focused, setFocused] = React.useState(false)
    const [pressed, setPressed] = React.useState(false)

    const sizes = resolveCheckboxSizes(size)
    const frame: CheckboxFrameState = { size, variant, checked, disabled, hovered, focused }

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>): void => {
        if (disabled) {
          return
        }
        onPress?.(event)
        onCheckedChange?.(!checked)
      },
      [checked, disabled, onCheckedChange, onPress],
    )

    const glyphPx = checkGlyphPx(sizes, pressed)
    const dotPx = hoverDotPx(sizes, pressed)

    // This pair flattens through its own `flattenStyleProp`, not
    // `mergeCompatStyle`, so the web dev warnings are wired here — the web leg
    // only. They must never move into the shared flatten: the native leg
    // flattens through it too, where RN-only keys are valid and dropping a
    // registered id is what RN's own flatten does.
    warnDroppedRegisteredStyle(style)
    const flatStyle = flattenStyleProp(style) as React.CSSProperties
    warnUnsupportedWebStyleKeys(flatStyle)

    return (
      <div className={checkboxFocusRingClassName(frame)}>
        <button
          ref={ref}
          aria-checked={checked}
          aria-disabled={disabled || undefined}
          // `required` is not a <button> attribute; the ARIA form is the web
          // equivalent of the legacy Tamagui/Radix `required` prop.
          aria-required={required || undefined}
          className={cn(checkboxBoxClassName(frame), className)}
          disabled={disabled}
          id={id}
          name={name}
          role="checkbox"
          style={flatStyle}
          type="button"
          value={value}
          onBlur={() => setFocused(false)}
          onClick={handleClick}
          onFocus={() => setFocused(true)}
          onMouseDown={() => setPressed(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false)
            setPressed(false)
          }}
          onMouseUp={() => setPressed(false)}
          {...domTestId(testID)}
        >
          {shouldShowIndicator(checked) ? (
            <span className={checkboxIndicatorClassName(frame)}>
              <Check color={checkGlyphColorToken(frame)} size={glyphPx} />
            </span>
          ) : null}
          {shouldShowHoverDot({ checked, hovered, disabled }) ? (
            <span className={HOVER_DOT_CLASSES} style={{ width: dotPx, height: dotPx }} />
          ) : null}
        </button>
      </div>
    )
  },
)
