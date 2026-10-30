import { type UseSporeColorsReturn } from '@universe/mycelium/theme-hooks-compat'
import { type CSSProperties, useCallback, useSyncExternalStore } from 'react'
import {
  popoverNoop,
  type BaseUIChangeDetails,
  type PopoverDismissInterceptors,
} from 'ui/src/components/popover/popoverContexts'
import { resolvePopoverWebStyle } from 'ui/src/components/popover/popoverStyleResolution'
import {
  POPOVER_CONTENT_BORDER_RADIUS,
  POPOVER_CONTENT_PADDING,
  POPOVER_TRANSITION_DURATION_MS,
} from 'ui/src/components/popover/shared'
import type { PopoverFrameStyleProps, PopoverPresenceStyle, PopoverVia } from 'ui/src/components/popover/types'
import { media } from 'ui/src/theme/media'

/**
 * Web-leg helpers for the rebuilt Popover (INFRA-3318): the Tamagui `View` box
 * reset, the legacy `PopperContentFrame` defaults, presence-style → transition
 * mapping, the legacy Dismissable close-request interceptors, matchMedia-backed
 * media-prop resolution, and the legacy rotated-square arrow geometry. Kept as a
 * platform-neutral module (DOM references are types or guarded runtime lookups) so
 * the web leg and its parts can share it without a Danger platform pair.
 */

/** The box Tamagui's `View` contributed on web, as inline CSS (the compat reset + column flex). */
export const FRAME_BASE_STYLE: CSSProperties = {
  alignItems: 'stretch',
  boxSizing: 'border-box',
  display: 'flex',
  flexBasis: 'auto',
  flexDirection: 'column',
  flexShrink: 0,
  margin: 0,
  minHeight: 0,
  minWidth: 0,
  padding: 0,
  position: 'relative',
}

/**
 * Legacy `PopperContentFrame` styled defaults as inline CSS (`size: '$true'` →
 * padding 8 / radius 0, `$background` → surface1, centered column).
 */
export function contentFrameStyle(colors: UseSporeColorsReturn): CSSProperties {
  return {
    ...FRAME_BASE_STYLE,
    alignItems: 'center',
    backgroundColor: String(colors.background.val),
    borderRadius: POPOVER_CONTENT_BORDER_RADIUS,
    padding: POPOVER_CONTENT_PADDING,
    outline: 'none',
  }
}

export const CONTENT_TRANSITION = `transform ${POPOVER_TRANSITION_DURATION_MS}ms ease-out, opacity ${POPOVER_TRANSITION_DURATION_MS}ms ease-out`

/** Legacy enterStyle/exitStyle presence bag → the hidden-state inline style. */
export function presenceToStyle(presence: PopoverPresenceStyle | undefined): CSSProperties | undefined {
  if (presence === undefined) {
    return undefined
  }
  const transforms: string[] = []
  if (typeof presence.x === 'number' && presence.x !== 0) {
    transforms.push(`translateX(${presence.x}px)`)
  }
  if (typeof presence.y === 'number' && presence.y !== 0) {
    transforms.push(`translateY(${presence.y}px)`)
  }
  if (typeof presence.scale === 'number') {
    transforms.push(`scale(${presence.scale})`)
  }
  if (Array.isArray(presence.transform)) {
    for (const entry of presence.transform) {
      if (typeof entry.translateX === 'number') {
        transforms.push(`translateX(${entry.translateX}px)`)
      }
      if (typeof entry.translateY === 'number') {
        transforms.push(`translateY(${entry.translateY}px)`)
      }
      if (typeof entry.scale === 'number') {
        transforms.push(`scale(${entry.scale})`)
      }
    }
  }
  const style: CSSProperties = {}
  if (transforms.length > 0) {
    style.transform = transforms.join(' ')
  }
  if (typeof presence.opacity === 'number') {
    style.opacity = presence.opacity
  }
  return Object.keys(style).length > 0 ? style : undefined
}

/**
 * Enter/exit motion from the legacy presence styles, driven by Base UI's transition
 * status. Transitions stay scoped to transform/opacity so theme-token colors never
 * flash on light/dark toggles (repo animateOnly convention).
 */
export function motionStyle({
  enterStyle,
  exitStyle,
  transitionStatus,
}: {
  enterStyle?: PopoverPresenceStyle
  exitStyle?: PopoverPresenceStyle
  transitionStatus: 'starting' | 'ending' | 'idle' | undefined
}): CSSProperties {
  const enter = presenceToStyle(enterStyle)
  const exit = presenceToStyle(exitStyle)
  if (enter === undefined && exit === undefined) {
    return {}
  }
  const base: CSSProperties = { transition: CONTENT_TRANSITION }
  if (transitionStatus === 'starting') {
    return { ...base, ...(enter ?? exit) }
  }
  if (transitionStatus === 'ending') {
    return { ...base, ...(exit ?? enter) }
  }
  return base
}

/**
 * Run the registered interceptors for one Base UI close request. Returns true when
 * the request must be swallowed (a handler called preventDefault). Events mirror the
 * legacy Dismissable payloads (mycelium popover-compat precedent, INFRA-3021).
 */
export function runDismissInterceptors(
  interceptors: PopoverDismissInterceptors,
  details: BaseUIChangeDetails,
): boolean {
  if (details.reason === 'escape-key' && interceptors.onEscapeKeyDown !== undefined) {
    const original = details.event
    const synthetic = new KeyboardEvent('keydown', {
      key: original instanceof KeyboardEvent ? original.key : 'Escape',
      cancelable: true,
    })
    interceptors.onEscapeKeyDown(synthetic)
    return synthetic.defaultPrevented
  }
  if (
    details.reason === 'outside-press' &&
    (interceptors.onPointerDownOutside !== undefined || interceptors.onInteractOutside !== undefined)
  ) {
    const synthetic = new CustomEvent('dismissable.pointerDownOutside', {
      cancelable: true,
      detail: { originalEvent: details.event },
    }) as CustomEvent<{ originalEvent: PointerEvent }>
    interceptors.onPointerDownOutside?.(synthetic)
    interceptors.onInteractOutside?.(synthetic)
    return synthetic.defaultPrevented
  }
  if (
    details.reason === 'focus-out' &&
    (interceptors.onFocusOutside !== undefined || interceptors.onInteractOutside !== undefined)
  ) {
    const synthetic = new CustomEvent('dismissable.focusOutside', {
      cancelable: true,
      detail: { originalEvent: details.event },
    }) as CustomEvent<{ originalEvent: FocusEvent }>
    interceptors.onFocusOutside?.(synthetic)
    interceptors.onInteractOutside?.(synthetic)
    return synthetic.defaultPrevented
  }
  return false
}

/** Base UI change reason → the legacy `onOpenChange` via argument. */
export function viaFromReason(reason: string | undefined): PopoverVia | undefined {
  if (reason === 'trigger-hover') {
    return 'hover'
  }
  if (reason === 'trigger-press' || reason === 'close-press') {
    return 'press'
  }
  return undefined
}

/** matchMedia subscription for one media query (false on the server and on native). */
export function useMediaQueryMatch(query: string | undefined): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void): (() => void) => {
      if (query === undefined || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return popoverNoop
      }
      const list = window.matchMedia(query)
      list.addEventListener('change', onStoreChange)
      return () => list.removeEventListener('change', onStoreChange)
    },
    [query],
  )
  const getSnapshot = useCallback((): boolean => {
    if (query === undefined || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }
    return window.matchMedia(query).matches
  }, [query])
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export function mediaQueryFor(key: keyof typeof media): string {
  const entry = media[key] as { maxWidth?: number; maxHeight?: number }
  return entry.maxWidth !== undefined ? `(max-width: ${entry.maxWidth}px)` : `(max-height: ${entry.maxHeight}px)`
}

/** The eleven media keys in declaration order (least strong first — later wins, like Tamagui). */
export const MEDIA_KEYS = Object.keys(media) as Array<keyof typeof media>

/**
 * Resolve the `$<mediaKey>` style-override props against live matchMedia state,
 * merged least-strong-first over the base bag (the legacy Tamagui precedence).
 */
export function useMediaStyleOverrides(colors: UseSporeColorsReturn, props: Record<string, unknown>): CSSProperties {
  const matches = MEDIA_KEYS.map((key) =>
    // oxlint-disable-next-line rules-of-hooks -- MEDIA_KEYS is a module constant; hook count is stable
    useMediaQueryMatch(props[`$${key}`] === undefined ? undefined : mediaQueryFor(key)),
  )
  let merged: CSSProperties = {}
  MEDIA_KEYS.forEach((key, index) => {
    const override = props[`$${key}`] as PopoverFrameStyleProps | undefined
    if (override !== undefined && matches[index] === true) {
      merged = { ...merged, ...resolvePopoverWebStyle(colors, override) }
    }
  })
  return merged
}

/** Split the `$<mediaKey>` overrides out of a Content-style prop bag. */
export function splitMediaProps(bag: Record<string, unknown>): {
  styleProps: PopoverFrameStyleProps
  mediaProps: Record<string, unknown>
} {
  const styleProps: Record<string, unknown> = {}
  const mediaProps: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(bag)) {
    if (key.startsWith('$') && key !== '$platform-web') {
      mediaProps[key] = value
    } else {
      styleProps[key] = value
    }
  }
  return { styleProps: styleProps as PopoverFrameStyleProps, mediaProps }
}

export type ArrowSide = 'top' | 'bottom' | 'left' | 'right'

export function arrowSideOf(sideValue: string): ArrowSide {
  switch (sideValue) {
    case 'top':
    case 'bottom':
    case 'left':
    case 'right':
      return sideValue
    case 'inline-start':
      return 'left'
    case 'inline-end':
      return 'right'
    default:
      return 'bottom'
  }
}

/**
 * The legacy rotated-square arrow geometry, two elements like the Tamagui
 * `PopperArrow`: an overflow-hidden clip window along the popup edge plus an inner
 * rotated square carrying background/border with the border on its two OUTER edges
 * only — so the tip merges with the popup body as one continuous shape.
 */
export function arrowWindowStyle({
  side,
  size,
  borderWidth,
}: {
  side: ArrowSide
  size: number
  borderWidth: number
}): CSSProperties {
  const long = size * 2
  const deep = size + borderWidth
  const geometry: Record<ArrowSide, CSSProperties> = {
    top: { bottom: -size, height: deep, width: long },
    bottom: { top: -size, height: deep, width: long },
    left: { right: -size, height: long, width: deep },
    right: { left: -size, height: long, width: deep },
  }
  return { overflow: 'hidden', pointerEvents: 'none', ...geometry[side] }
}

export function arrowInnerStyle({
  side,
  size,
  borderWidth,
  backgroundColor,
  borderColor,
}: {
  side: ArrowSide
  size: number
  borderWidth: number
  backgroundColor: string
  borderColor: string
}): CSSProperties {
  const centered = size / 2
  const overlap = -(centered - borderWidth)
  const geometry: Record<ArrowSide, CSSProperties> = {
    top: { top: overlap, left: centered, borderRightWidth: borderWidth, borderBottomWidth: borderWidth },
    bottom: { top: centered, left: centered, borderTopWidth: borderWidth, borderLeftWidth: borderWidth },
    left: { top: centered, left: overlap, borderTopWidth: borderWidth, borderRightWidth: borderWidth },
    right: { top: centered, left: centered, borderBottomWidth: borderWidth, borderLeftWidth: borderWidth },
  }
  return {
    backgroundColor,
    borderColor,
    borderStyle: 'solid',
    borderWidth: 0,
    boxSizing: 'border-box',
    height: size,
    position: 'absolute',
    transform: 'rotate(45deg)',
    width: size,
    ...geometry[side],
  }
}
