/**
 * Web leg of `LabeledCheckboxCompat` — the drop-in Tailwind replacement for the
 * legacy Tamagui `ui/src` `LabeledCheckbox`.
 *
 * Structure mirrors legacy: a pressable container (legacy `TouchableArea`)
 * wrapping a centered row (legacy `<Flex row alignItems="center" gap px py>`)
 * holding the checkbox and, when `text` is present, a `grow shrink` label
 * wrapper. The press handler sits on the checkbox and calls `preventDefault()` +
 * `stopPropagation()` first, like legacy.
 *
 * `onCheckPressed` receives the PRE-TOGGLE state — `checked` as it is at press
 * time, not the next value. Call sites invert it
 * themselves.
 *
 * A11y: the checkbox is the one control. Its `text`, string or element, names
 * it through `aria-labelledby`. The row is a `<label>` around the checkbox and
 * its text, so a click anywhere on it clicks the checkbox: a larger mouse target
 * with no handler, role or tab stop of its own. Legacy's `role="button"` wrapper
 * bound no key handler, so it only added a dead tab stop and a button that nested
 * the checkbox (axe nested-interactive, button-name). Keyboard users reach and
 * toggle the checkbox itself, natively, with Space.
 */
// oxlint-disable react/forbid-elements -- the compat components ARE the raw DOM
// boundary. FlexCompat is deliberately not used here: it has no native leg yet
// (INFRA-3229 is in flight), and both legs must share one structure.
import * as React from 'react'
import { cn } from '../cn'
import { domTestId } from '../compat/dom-test-id'
import { warnDroppedRegisteredStyle, warnUnsupportedWebStyleKeys } from '../compat/web-diagnostics'
import { CheckboxCompat } from './CheckboxCompat'
import {
  LABELED_CONTAINER_CLASSES,
  LABELED_TEXT_CLASSES,
  LABELED_TEXT_WRAPPER_CLASSES,
  labeledRowClassName,
  labeledRowStyle,
} from './compile'
import type { LabeledCheckboxCompatProps } from './props'
import {
  DEFAULT_CHECKBOX_POSITION,
  DEFAULT_CHECKBOX_SIZE,
  DEFAULT_LABELED_GAP,
  DEFAULT_LABELED_PX,
  flattenStyleProp,
  labeledTextShape,
  resolveHoverStyle,
} from './resolve'

export const LabeledCheckboxCompat = React.forwardRef<HTMLDivElement, LabeledCheckboxCompatProps>(
  function LabeledCheckboxCompat(props, ref) {
    const {
      checked,
      checkboxPosition = DEFAULT_CHECKBOX_POSITION,
      text,
      variant,
      size = DEFAULT_CHECKBOX_SIZE,
      gap = DEFAULT_LABELED_GAP,
      px = DEFAULT_LABELED_PX,
      py,
      hoverStyle,
      containerStyle,
      onCheckPressed,
      testID,
      className,
    } = props

    // Legacy `hoverable={!!hoverStyle}`: hover styling is opt-in.
    const hoverable = hoverStyle !== undefined
    const [hovered, setHovered] = React.useState(false)
    const textId = React.useId()

    const handlePress = React.useCallback(
      (event: { preventDefault: () => void; stopPropagation: () => void }): void => {
        event.preventDefault()
        event.stopPropagation()
        onCheckPressed?.(checked)
      },
      [checked, onCheckPressed],
    )

    const textShape = labeledTextShape(text)
    const label =
      textShape === 'string' ? <span className={LABELED_TEXT_CLASSES}>{text as string}</span> : (text ?? null)

    const containerClasses = cn(LABELED_CONTAINER_CLASSES, className)
    const resolvedHoverStyle = resolveHoverStyle(hoverStyle)
    // This pair flattens through its own `flattenStyleProp`, not
    // `mergeCompatStyle`, so the web dev warnings are wired here — the web leg
    // only (the native leg shares the flatten; RN-only keys are valid there
    // and it drops registered ids exactly like RN's own flatten).
    warnDroppedRegisteredStyle(containerStyle)
    const flatContainerStyle = flattenStyleProp(containerStyle) as React.CSSProperties
    warnUnsupportedWebStyleKeys(flatContainerStyle)
    const mergedContainerStyle: React.CSSProperties = {
      ...flatContainerStyle,
      ...(hoverable && hovered ? (resolvedHoverStyle as React.CSSProperties) : undefined),
    }

    const checkbox = (
      <CheckboxCompat
        aria-labelledby={textShape === 'absent' ? undefined : textId}
        checked={checked}
        size={size}
        variant={variant}
        onPress={handlePress}
      />
    )

    return (
      <div
        ref={ref}
        className={containerClasses}
        style={mergedContainerStyle}
        onMouseEnter={hoverable ? () => setHovered(true) : undefined}
        onMouseLeave={hoverable ? () => setHovered(false) : undefined}
        {...domTestId(testID)}
      >
        <label className={labeledRowClassName({ gap, px, py })} style={labeledRowStyle({ gap, px, py })}>
          {checkboxPosition === 'start' ? checkbox : null}
          {textShape !== 'absent' ? (
            <span id={textId} className={LABELED_TEXT_WRAPPER_CLASSES}>
              {label}
            </span>
          ) : null}
          {checkboxPosition === 'end' ? checkbox : null}
        </label>
      </div>
    )
  },
)
