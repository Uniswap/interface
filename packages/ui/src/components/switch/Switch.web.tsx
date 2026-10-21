import { type CSSProperties, type FocusEvent, useEffect, useState } from 'react'
import { Check } from 'ui/src/components/icons'
import {
  SWITCH_THUMB_HEIGHT,
  SWITCH_THUMB_PADDING,
  SWITCH_TRACK_HEIGHT,
  SWITCH_TRACK_WIDTH,
} from 'ui/src/components/switch/shared'
import type { SwitchProps } from 'ui/src/components/switch/types'
import { type UseSporeColorsReturn, useSporeColors } from 'ui/src/hooks/useSporeColors'
import { spacing } from 'ui/src/theme'

// Same endpoints the native leg interpolates between: thumb rests at the left
// padding edge and travels to the right padding edge.
const THUMB_TRAVEL = SWITCH_TRACK_WIDTH - SWITCH_THUMB_HEIGHT - SWITCH_THUMB_PADDING * 2

// Legacy hover/press affordance: the thumb pill stretches to 28px and, when
// checked, shifts left so its right edge stays pinned.
const ACTIVE_THUMB_WIDTH = 28
const ACTIVE_THUMB_SHIFT = -4
const ACTIVE_ICON_SHIFT = -2

const OUTER_RING_DISTANCE = -6
const INNER_RING_DISTANCE = -5

// Transcribed from the legacy Tamagui animation presets: '80ms-ease-in-out' on
// track/thumb color+transform, '100ms' on the check icon reveal.
const TRACK_TRANSITION = 'background-color 80ms ease-in-out'
const THUMB_TRANSITION = 'transform 80ms ease-in-out, background-color 80ms ease-in-out'
const FAKE_THUMB_TRANSITION = 'width 80ms ease-in-out, transform 80ms ease-in-out, background-color 80ms ease-in-out'
const ICON_TRANSITION = 'opacity 100ms ease-in-out, transform 100ms ease-in-out'

function resolveColorOverride(value: string, colors: UseSporeColorsReturn): string {
  if (value.startsWith('$')) {
    const token = value.slice(1)
    if (token in colors) {
      return colors[token as keyof UseSporeColorsReturn].val
    }
  }
  return value
}

export function Switch({
  checked: checkedProp,
  onCheckedChange: onCheckedChangeProp,
  defaultChecked,
  disabled,
  variant,
  disabledStyle,
  backgroundColor,
  id,
  testID,
  pointerEvents,
  'aria-label': ariaLabel,
}: SwitchProps): JSX.Element {
  const [checked, setChecked] = useState<boolean>(checkedProp ?? defaultChecked ?? false)
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [focusVisible, setFocusVisible] = useState(false)

  const colors = useSporeColors()
  const isBranded = variant === 'branded'

  useEffect(() => {
    if (checkedProp !== undefined) {
      setChecked(checkedProp)
    }
  }, [checkedProp])

  function handleClick(): void {
    if (disabled) {
      return
    }
    const next = !checked
    // Uncontrolled (checked prop undefined): own the state. Controlled: the
    // checked prop updates from the outside via the effect above.
    if (checkedProp === undefined) {
      setChecked(next)
    }
    onCheckedChangeProp?.(next)
  }

  function handleFocus(event: FocusEvent<HTMLButtonElement>): void {
    // Match the legacy focus-visible-only ring: pointer focus draws nothing.
    try {
      setFocusVisible(event.currentTarget.matches(':focus-visible'))
    } catch {
      setFocusVisible(true)
    }
  }

  function handleBlur(): void {
    setFocusVisible(false)
    setPressed(false)
  }

  const isDisabledStyling = disabled && !checked
  // Legacy split the two affordances: the track recolor was scoped to CSS :hover only,
  // while the thumb stretch reacted to $group-item-hover OR press — so a hoverless touch
  // tap stretches the thumb without recoloring the track.
  const isTrackHovered = hovered && !disabled
  const isThumbStretched = hovered || pressed

  const trackColor = ((): string => {
    if (isTrackHovered) {
      if (isBranded) {
        return checked ? colors.accent1Hovered.val : colors.neutral3Hovered.val
      }
      return checked ? colors.accent3Hovered.val : colors.neutral3Hovered.val
    }
    if (backgroundColor) {
      return resolveColorOverride(backgroundColor, colors)
    }
    if (isDisabledStyling) {
      return colors.surface3.val
    }
    if (isBranded) {
      return checked ? colors.accent1.val : colors.neutral3.val
    }
    return checked ? colors.accent3.val : colors.neutral3.val
  })()

  const thumbColor = ((): string => {
    if (isDisabledStyling) {
      return colors.neutral3.val
    }
    if (checked) {
      return isBranded ? colors.white.val : colors.surface1.val
    }
    return colors.white.val
  })()

  const iconColor = ((): string => {
    if (isDisabledStyling) {
      return colors.white.val
    }
    return isBranded ? colors.accent1.val : colors.neutral1.val
  })()

  const focusRingColor = checked && isBranded ? colors.accent1Hovered.val : colors.neutral3Hovered.val

  const trackStyle: CSSProperties = {
    // button reset — all styling is inline, no classes
    appearance: 'none',
    WebkitAppearance: 'none',
    border: 'none',
    margin: 0,
    outline: 'none',
    font: 'inherit',
    position: 'relative',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    // A definite cross-size, not just a floor: with only min-height the track has no
    // resolved height, so a flex row's default align-items: stretch grows it to the
    // row's text height (a two-line label made the toggle enormous).
    height: SWITCH_TRACK_HEIGHT,
    width: SWITCH_TRACK_WIDTH,
    minHeight: SWITCH_TRACK_HEIGHT,
    minWidth: SWITCH_TRACK_WIDTH,
    flexShrink: 0,
    padding: SWITCH_THUMB_PADDING,
    borderRadius: 9999,
    backgroundColor: trackColor,
    cursor: disabled ? undefined : 'pointer',
    pointerEvents: disabled || pointerEvents === 'none' ? 'none' : 'auto',
    transition: TRACK_TRANSITION,
    ...(disabled && checked ? { opacity: 0.6 } : undefined),
    ...(disabled ? disabledStyle : undefined),
  }

  const thumbStyle: CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SWITCH_THUMB_HEIGHT,
    width: SWITCH_THUMB_HEIGHT,
    borderRadius: 9999,
    backgroundColor: thumbColor,
    transform: `translateX(${checked ? THUMB_TRAVEL : 0}px)`,
    transition: THUMB_TRANSITION,
  }

  const iconContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: checked ? 1 : 0,
    transform: `translateX(${isThumbStretched && checked ? ACTIVE_ICON_SHIFT : 0}px)`,
    transition: ICON_TRANSITION,
  }

  // Fake thumb behind the real one: animating its width (instead of the real
  // thumb's) keeps the check icon centered while the pill stretches.
  const fakeThumbStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: -2,
    boxSizing: 'border-box',
    minHeight: SWITCH_THUMB_HEIGHT,
    width: isThumbStretched ? ACTIVE_THUMB_WIDTH : SWITCH_THUMB_HEIGHT,
    borderRadius: 9999,
    backgroundColor: thumbColor,
    transform: `translateX(${isThumbStretched && checked ? ACTIVE_THUMB_SHIFT : 0}px)`,
    transition: FAKE_THUMB_TRANSITION,
  }

  const outerRingStyle: CSSProperties = {
    position: 'absolute',
    top: OUTER_RING_DISTANCE,
    right: OUTER_RING_DISTANCE,
    bottom: OUTER_RING_DISTANCE,
    left: OUTER_RING_DISTANCE,
    zIndex: -2,
    borderRadius: 9999,
    borderStyle: 'solid',
    borderWidth: spacing.spacing1,
    borderColor: focusVisible ? focusRingColor : 'transparent',
    pointerEvents: 'none',
  }

  const innerRingStyle: CSSProperties = {
    position: 'absolute',
    top: INNER_RING_DISTANCE,
    right: INNER_RING_DISTANCE,
    bottom: INNER_RING_DISTANCE,
    left: INNER_RING_DISTANCE,
    zIndex: -1,
    borderRadius: 9999,
    borderStyle: 'solid',
    borderWidth: spacing.spacing2,
    borderColor: focusVisible ? colors.surface1.val : 'transparent',
    pointerEvents: 'none',
  }

  return (
    // Native button: space/enter fire click, so keyboard toggling comes for free.
    <button
      aria-checked={checked}
      aria-disabled={disabled}
      // Transcribed from the legacy implementation, which set aria-selected alongside aria-checked.
      aria-selected={checked}
      aria-label={ariaLabel}
      data-testid={testID}
      id={id}
      role="switch"
      style={trackStyle}
      type="button"
      onBlur={handleBlur}
      onClick={handleClick}
      onFocus={handleFocus}
      onMouseEnter={(): void => setHovered(true)}
      onMouseLeave={(): void => {
        setHovered(false)
        setPressed(false)
      }}
      onPointerDown={(): void => setPressed(true)}
      onPointerUp={(): void => setPressed(false)}
    >
      <span style={thumbStyle}>
        <span style={iconContainerStyle}>
          <Check color={iconColor} size={14} />
        </span>
        <span style={fakeThumbStyle} />
      </span>

      {/* focus ring outer */}
      <span style={outerRingStyle} />
      {/* focus ring inner */}
      <span style={innerRingStyle} />
    </button>
  )
}
