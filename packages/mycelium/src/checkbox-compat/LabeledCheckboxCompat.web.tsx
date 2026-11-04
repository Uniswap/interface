/**
 * Web leg of `LabeledCheckboxCompat` — the drop-in Tailwind replacement for the
 * legacy Tamagui `ui/src` `LabeledCheckbox`.
 *
 * Structure mirrors legacy: a pressable container (legacy `TouchableArea`)
 * wrapping a centered row (legacy `<Flex row alignItems="center" gap px py>`)
 * holding the checkbox and, when `text` is present, a `grow shrink` label
 * wrapper. The same press handler is attached to BOTH the container and the
 * checkbox, and it calls `preventDefault()` + `stopPropagation()` first, exactly
 * like legacy, so a press on the checkbox does not
 * also fire the container.
 *
 * `onCheckPressed` receives the PRE-TOGGLE state — `checked` as it is at press
 * time, not the next value. Call sites invert it
 * themselves.
 *
 * A11y: the container reproduces legacy's outer interactive role rather than
 * flattening it. Legacy's `TouchableAreaFrame` is `styled(YStack, { tag: 'div',
 * role: 'button' })` and rendered
 * `<div role="button" tabindex="0">` around the inner `role="checkbox"`, so
 * that nested pair — button-wrapping-checkbox, container in the tab order — is
 * what all 15 call sites announce today. A compat primitive's premise is that
 * nothing changes but the import line, so the tree is matched exactly, down to
 * `tabIndex`. Legacy binds no key handler to that container (verified: Enter
 * and Space on the legacy container fire nothing; only the inner `<button
 * role="checkbox">` activates from the keyboard, natively), so none is bound
 * here either — adding one would be a behaviour change, not parity. Whether
 * the nesting should exist at all is a Spore question, and changing it here
 * would change it for every consumer silently.
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

    const checkbox = <CheckboxCompat checked={checked} size={size} variant={variant} onPress={handlePress} />

    return (
      <div
        ref={ref}
        className={containerClasses}
        // Legacy's nested interactive container, tab stop included — see the
        // a11y note in the file header before flattening either.
        role="button"
        style={mergedContainerStyle}
        tabIndex={0}
        onClick={handlePress}
        onMouseEnter={hoverable ? () => setHovered(true) : undefined}
        onMouseLeave={hoverable ? () => setHovered(false) : undefined}
        {...domTestId(testID)}
      >
        <div className={labeledRowClassName({ gap, px, py })} style={labeledRowStyle({ gap, px, py })}>
          {checkboxPosition === 'start' ? checkbox : null}
          {textShape !== 'absent' ? <div className={LABELED_TEXT_WRAPPER_CLASSES}>{label}</div> : null}
          {checkboxPosition === 'end' ? checkbox : null}
        </div>
      </div>
    )
  },
)
