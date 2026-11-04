/**
 * WEB leg of `ButtonFrameCompat` — the rebuilt legacy `CustomButtonFrame`
 * (`styled(XStack, …)` in ui/src, INFRA-3315).
 *
 * Composition, in merge order (later wins, matching Tamagui `defaults <
 * variants < props`):
 *
 *  1. the CLOSED variant surface via `../button-compat/compile`'s
 *     `buttonCompatFrameClassName` — byte-identical to the ButtonCompat frame;
 *  2. the OPEN legacy style-prop surface (`width`, `mt`, `$md`, `hoverStyle`,
 *     …) via the deterministic-emission engine (`./compile`
 *     `buttonFrameOpenEmission`), the same lane FlexCompat renders through —
 *     including the caller's own `className`, which the emission merges last.
 *
 * The element boundary is local rather than `../compat/dom`'s
 * `createCompatComponent` because the frame must forward surfaces that
 * wrapper deliberately owns or omits: `dd-action-name` (Datadog reads the DOM
 * attribute), raw `data-*` passthrough, and the legacy
 * disabled-vs-onDisabledPress tabIndex contract. The event composition below
 * mirrors `ButtonCompat.web.tsx` (`onPress ?? onClick`), not Tamagui's full
 * composed-handler matrix — the legacy `Button`/`IconButton`/`DropdownButton`
 * orchestrators only ever hand the frame one press handler.
 *
 * Interaction states are CSS-scoped on web (`hover:` / `active:` /
 * `focus-visible:` inside the closed cells), so unlike the native leg there
 * is no interaction state in React here.
 */
import { forwardRef, createElement, useMemo, type CSSProperties, type JSX, type Ref } from 'react'
import { buttonCompatFrameClassName, getContrastTextClass } from '../button-compat/compile'
import { cn } from '../cn'
import { mergeCompatStyle } from '../compat/compose'
import { domTestId } from '../compat/dom-test-id'
import { buttonFrameOpenEmission, type ButtonFrameContextValue, type ButtonFrameOpenProps } from './compile'
import { ButtonFrameContextProvider } from './context'
import { getMaybeHexOrRgbColor } from './custom-color'
import type { ButtonFrameCompatProps } from './props'

export type { ButtonFrameCompatProps } from './props'

/** Key families forwarded verbatim to the DOM element. */
function isForwardedVerbatim(key: string): boolean {
  return key.startsWith('data-') || key.startsWith('aria-')
}

/**
 * DOM/behavioral props forwarded by name (the legacy frame surface consumers
 * actually reach for — `tag`/`href` link-buttons included).
 */
const FORWARDED_KEYS = [
  'id',
  'role',
  'title',
  'href',
  'target',
  'rel',
  'download',
  'type',
  'form',
  'name',
  'value',
  'autoFocus',
  'draggable',
  'lang',
  'dir',
] as const

/**
 * RN-flavored handlers must never reach the DOM as attributes; the pairs
 * below are remapped onto their Tamagui-web seams instead (compat/dom's
 * composition, reduced to the pairs the legacy frame actually honored).
 * `onLayout` has no DOM seam here and is dropped (dev consumers of it use
 * FlexCompat's ResizeObserver lane).
 */
const RN_EVENT_KEYS = new Set([
  'onPress',
  'onDisabledPress',
  'onPressIn',
  'onPressOut',
  'onLongPress',
  'onHoverIn',
  'onHoverOut',
  'onLayout',
])

/** DOM event handlers forwarded verbatim (already DOM-named). */
function isDomEventKey(key: string, value: unknown): boolean {
  return key.startsWith('on') && typeof value === 'function' && !RN_EVENT_KEYS.has(key)
}

type AnyHandler = (event: never) => void

/** Chain two handlers on one DOM prop (RN-mapped seam + the caller's raw one). */
function composeHandlers(first: unknown, second: unknown): unknown {
  if (typeof first !== 'function') {
    return second
  }
  if (typeof second !== 'function') {
    return first
  }
  return (event: never): void => {
    ;(first as AnyHandler)(event)
    ;(second as AnyHandler)(event)
  }
}

/** Remap the RN press/hover pairs onto their web seams (mouse + touch, pointer). */
function mapRnHandlers(open: Record<string, unknown>, domProps: Record<string, unknown>): void {
  const pairs: [string, string[]][] = [
    ['onPressIn', ['onMouseDown', 'onTouchStart']],
    ['onPressOut', ['onMouseUp', 'onTouchEnd']],
    ['onHoverIn', ['onPointerEnter']],
    ['onHoverOut', ['onPointerLeave']],
  ]
  for (const [rnKey, domKeys] of pairs) {
    const handler = open[rnKey]
    if (typeof handler !== 'function') {
      continue
    }
    for (const domKey of domKeys) {
      domProps[domKey] = composeHandlers(handler, domProps[domKey])
    }
  }
}

/** Collect the DOM-forwardable subset of the open prop bag. */
function collectDomForwardedProps(open: Record<string, unknown>): Record<string, unknown> {
  const domProps: Record<string, unknown> = {}
  for (const key of FORWARDED_KEYS) {
    if (key in open) {
      domProps[key] = open[key]
    }
  }
  for (const [key, value] of Object.entries(open)) {
    if (isForwardedVerbatim(key) || isDomEventKey(key, value)) {
      domProps[key] = value
    }
  }
  mapRnHandlers(open, domProps)
  return domProps
}

/** Custom-background inline paint (ButtonCompat.web's getCustomStyle). */
function customBackgroundStyle({
  customBackgroundColor,
  isDisabled,
  primaryColor,
}: {
  customBackgroundColor: string | undefined
  isDisabled: boolean
  primaryColor: string | undefined
}): CSSProperties | undefined {
  if (customBackgroundColor === undefined || isDisabled) {
    return undefined
  }
  return {
    backgroundColor: customBackgroundColor,
    borderColor: customBackgroundColor,
    '--sbtn-custom-outline': primaryColor ?? customBackgroundColor,
  } as CSSProperties
}

export const ButtonFrameCompat = forwardRef<HTMLElement, ButtonFrameCompatProps>(
  function ButtonFrameCompat(props, ref): JSX.Element {
    const {
      size = 'medium',
      variant = 'default',
      emphasis = 'primary',
      fill = true,
      focusScaling = 'default',
      iconPosition = 'before',
      isDisabled = false,
      onDisabledPress,
      'custom-background-color': customBackgroundColorProp,
      'primary-color': primaryColor,
      'dd-action-name': ddActionName,
      backgroundColor,
      onPress,
      onClick,
      disabled,
      tag,
      testID,
      tabIndex,
      style,
      children,
      ...open
    } = props

    // Legacy split (CustomButtonFrame.web.tsx `variant: ':string'`): a concrete
    // hex/rgb background takes the custom-background lane (border + brightness
    // filters + contrast text via context); a THEME TOKEN stays an ordinary
    // style prop and rides the open emission, beating the variant cell in the
    // merge exactly as a Tamagui prop beats a variant style.
    const customBackgroundColor = getMaybeHexOrRgbColor(backgroundColor)
    const tokenBackgroundColor = customBackgroundColor === undefined ? backgroundColor : undefined

    const closedClassName = buttonCompatFrameClassName({
      size,
      iconPosition,
      fill,
      focusScaling,
      variant,
      emphasis,
      disabled: isDisabled,
      onDisabledPress,
      backgroundColor: customBackgroundColor,
    })

    const emission = buttonFrameOpenEmission({
      ...open,
      backgroundColor: tokenBackgroundColor,
    } as ButtonFrameOpenProps)

    // Legacy validates primary-color through getMaybeHexOrRGBColor before it
    // colors the focus outline; anything else (tokens included) is dropped
    // rather than written into a custom property.
    const customStyle = customBackgroundStyle({
      customBackgroundColor,
      isDisabled,
      primaryColor: getMaybeHexOrRgbColor(primaryColor),
    })

    const contextCustomBackground = getMaybeHexOrRgbColor(customBackgroundColorProp) ?? customBackgroundColor

    const ctx: ButtonFrameContextValue = useMemo(
      () => ({
        size,
        variant,
        emphasis,
        isDisabled,
        customBackgroundColor: contextCustomBackground,
        customTextClass: contextCustomBackground ? getContrastTextClass(contextCustomBackground) : undefined,
      }),
      [size, variant, emphasis, isDisabled, contextCustomBackground],
    )

    const interactiveWhileDisabled = Boolean(onDisabledPress)
    const blocked = (disabled ?? (isDisabled && !interactiveWhileDisabled)) === true
    const pressHandler = onPress ?? onClick

    const domProps = collectDomForwardedProps(open as Record<string, unknown>)

    const element = tag ?? 'button'

    return createElement(
      ButtonFrameContextProvider,
      { value: ctx },
      createElement(
        element,
        {
          ...domProps,
          ref: ref as Ref<HTMLElement>,
          ...(element === 'button' ? { type: (open as { type?: string }).type ?? 'button' } : undefined),
          className: cn(closedClassName, emission.className),
          style: mergeCompatStyle(mergeCompatStyle(emission.style, customStyle), style),
          disabled: element === 'button' ? blocked : undefined,
          // Legacy: the isDisabled variant sets aria-disabled only when
          // onDisabledPress is absent (interactive-while-disabled renders {});
          // a caller's own aria-disabled (already in domProps) must survive
          // the not-disabled case rather than be wiped by an explicit
          // undefined after the spread.
          'aria-disabled':
            isDisabled && !interactiveWhileDisabled ? true : (open as Record<string, unknown>)['aria-disabled'],
          tabIndex: tabIndex ?? (isDisabled && !interactiveWhileDisabled ? -1 : undefined),
          // Tamagui web dispatches onLongPress together with onPress on click.
          onClick: blocked ? undefined : composeHandlers(pressHandler, (open as { onLongPress?: unknown }).onLongPress),
          'dd-action-name': ddActionName,
          ...domTestId(testID),
        },
        children,
      ),
    )
  },
)
