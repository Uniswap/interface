import { SPACE_TOKEN_PX } from '@universe/mycelium/compat'
import { spacing } from '@universe/mycelium/tokens'
import type {
  PopoverHoverableProps,
  PopoverOffset,
  PopoverPlacement,
  PopoverPlacementSide,
  PopoverProps,
} from 'ui/src/components/popover/types'

/**
 * Platform-neutral constants and pure positioning/timing mappers for the rebuilt
 * Popover (INFRA-3318). The defaults transcribe the legacy Tamagui artifacts
 * (`@tamagui/popover` 1.136.1 `Popover.js`/`Popover.native.js` +
 * `@tamagui/popper` `PopperContentFrame`/`PopperArrow`); the placement/offset
 * mappers port the parity-pinned coordinate algebra from mycelium's
 * popover-compat (packages/mycelium/src/popover-compat/position.ts, INFRA-3021)
 * so both rebuilds agree.
 */

/**
 * Legacy `PopperContentFrame` styled defaults (non-headless variant):
 * `size: '$true'` → padding `space.true` (8) + borderRadius `radius.true` (0),
 * `backgroundColor: '$background'` (surface1), `alignItems: 'center'`.
 */
export const POPOVER_CONTENT_PADDING = spacing.spacing8
export const POPOVER_CONTENT_BORDER_RADIUS = 0

/** Legacy enter/exit transition approximation of the Tamagui `simple`/`fast` drivers. */
export const POPOVER_TRANSITION_DURATION_MS = 150

export type PopoverAlign = 'start' | 'center' | 'end'

export interface PopoverAnchorPosition {
  side: PopoverPlacementSide
  align: PopoverAlign
}

/** Tamagui/floating-ui placement → side/align pair. The legacy popper default placement is `bottom` (centered). */
export function mapPlacementToAnchorPosition(placement?: PopoverPlacement): PopoverAnchorPosition {
  if (placement === undefined) {
    return { side: 'bottom', align: 'center' }
  }
  const [side, align] = placement.split('-') as [PopoverPlacementSide, 'start' | 'end' | undefined]
  return { side, align: align ?? 'center' }
}

/**
 * floating-ui `offset({ mainAxis, crossAxis })` → positioner `sideOffset`/`alignOffset`.
 * The legacy crossAxis is PHYSICAL (positive = right/down); the positioner routes
 * `alignOffset` through floating-ui's `alignmentAxis`, which flips sign for `end`
 * alignment — so the mapper pre-flips to keep the rendered offset physical, matching
 * the legacy behavior byte for byte.
 *
 * When `offset` is omitted the legacy popper fell back to the REGISTERED ARROW SIZE
 * (`offset ?? arrowSize`, 0 without an arrow) — callers pass that in.
 */
export function mapOffsetToAnchorPosition({
  offset,
  align,
  arrowSize = 0,
}: {
  offset: PopoverOffset | undefined
  align: PopoverAlign
  arrowSize?: number
}): { sideOffset: number; alignOffset: number } {
  if (offset === undefined) {
    return { sideOffset: arrowSize, alignOffset: 0 }
  }
  if (typeof offset === 'number') {
    return { sideOffset: offset, alignOffset: 0 }
  }
  const crossAxis = offset.crossAxis ?? 0
  return {
    sideOffset: offset.mainAxis ?? 0,
    alignOffset: align === 'end' ? -crossAxis : crossAxis,
  }
}

/**
 * Legacy `stayInFrame` → viewport-clamp padding. The Tamagui popper mapped
 * `stayInFrame` to floating-ui `shift(...)`, whose default `padding` is 0 — so
 * boolean/empty forms clamp flush against the viewport edge. Base UI's Positioner
 * defaults `collisionPadding` to 5, which rested edge-clamped popovers 5px further
 * from the edge than legacy; always emit an explicit value so that default never
 * applies.
 */
export function resolveCollisionPadding(
  stayInFrame: PopoverProps['stayInFrame'],
): number | Partial<Record<PopoverPlacementSide, number>> {
  return typeof stayInFrame === 'object' && stayInFrame.padding !== undefined ? stayInFrame.padding : 0
}

/**
 * Native lowering of the same `stayInFrame` clamp padding: the floating-overlay
 * geometry engine clamps every edge by ONE number (`viewportPadding`), so the
 * uniform legacy forms map directly and a per-side padding object (expressible
 * by the legacy floating-ui `shift`; no live consumer passes one) lowers to its
 * largest side — every requested edge keeps at least its asked-for clearance.
 */
export function resolveNativeViewportPadding(stayInFrame: PopoverProps['stayInFrame']): number {
  const clampPadding = resolveCollisionPadding(stayInFrame)
  if (typeof clampPadding === 'number') {
    return clampPadding
  }
  const sides = Object.values(clampPadding).filter((value): value is number => typeof value === 'number')
  return sides.length > 0 ? Math.max(...sides) : 0
}

/**
 * Map the legacy `hoverable` prop onto hover-open timing. Legacy semantics
 * (floating-ui `useHover`): open after the pointer rests `restMs` when
 * `delay.open` is 0, else after `delay.open`; close after `delay.close`.
 * The rebuilt web leg has one fixed open delay, so `restMs` stands in for a
 * zero open delay (the same ledgered approximation as the Tooltip rebuild).
 */
export function mapHoverableToDelays(hoverable: PopoverHoverableProps | undefined): {
  openOnHover: boolean
  openDelayMs: number
  closeDelayMs: number
} {
  if (hoverable === undefined || hoverable === false) {
    return { openOnHover: false, openDelayMs: 0, closeDelayMs: 0 }
  }
  if (hoverable === true) {
    return { openOnHover: true, openDelayMs: 0, closeDelayMs: 0 }
  }
  const delay = hoverable.delay
  const openDelay = typeof delay === 'number' ? delay : (delay?.open ?? 0)
  const closeDelay = typeof delay === 'number' ? delay : (delay?.close ?? 0)
  const restMs = hoverable.restMs ?? 0
  return {
    openOnHover: true,
    openDelayMs: openDelay > 0 ? openDelay : restMs,
    closeDelayMs: closeDelay,
  }
}

/**
 * The space-token scale the legacy `getSpace` walked, sorted ascending by value
 * (ties keep insertion order — spacing, then padding, then gap, then `true`),
 * exactly like `stepTokenUpOrDown` in @tamagui/get-token.
 */
const { $true, ...NAMED_SPACE_TOKEN_PX } = SPACE_TOKEN_PX
const SPACE_SCALE: Array<[string, number]> = Object.entries({ ...NAMED_SPACE_TOKEN_PX, $true })
  .map(([token, px]): [string, number] => [token.slice(1), px])
  .sort((a, b) => a[1] - b[1])

/**
 * Legacy `PopperArrow` size algebra (`getSpace(sizeProp ?? context.size, { shift: -2,
 * bounds: [2] })` → `stepTokenUpOrDown` in @tamagui/get-token 1.136.1): numbers pass
 * through; token strings are found in the value-sorted space scale and step two down
 * (`$true` steps one extra — its duplicate-value special case). An UNSET size was NOT
 * routed through `$true`: the legacy Popper has no default `size`, so the lookup was
 * `indexOf(undefined)` = -1 and the clamp landed on the bounds floor (index 2). The two
 * inputs therefore intentionally resolve to DIFFERENT values, exactly like the shipped
 * artifact: bare `<Popover.Arrow />` → 2px (the legacy near-invisible tip),
 * `size="$true"` → 8px, `size="$spacing12"` → 8px. All three are pinned by the parity
 * suite — do NOT unify the `undefined` and `'true'` branches; that would resize every
 * live bare-arrow consumer (device captures pin the 2px tip).
 */
export function resolveArrowSize(size: number | string | undefined): number {
  if (typeof size === 'number') {
    return Math.max(0, size)
  }
  const min = 2
  const max = SPACE_SCALE.length - 1
  let index: number
  if (size === undefined) {
    // Legacy unset path: `indexOf(undefined)` = -1 plus shift -2, clamped to the
    // bounds floor — NOT the `'true'` token walk, which lands 3 steps higher (8px).
    index = Math.min(max, Math.max(min, -1 - 2))
  } else {
    const key = size.startsWith('$') ? size.slice(1) : size
    const currentIndex = SPACE_SCALE.findIndex(([name]) => name === key)
    // `$true` shifts one extra step, like the legacy stepTokenUpOrDown.
    const shift = key === 'true' ? -3 : -2
    index = Math.min(max, Math.max(min, currentIndex + shift))
  }
  const entry = SPACE_SCALE[index]
  return Math.max(0, entry?.[1] ?? spacing.spacing8)
}
