/**
 * Pure mappers from the Tamagui popover positioning vocabulary (placement
 * strings + floating-ui `offset` objects) onto Base UI anchor positioning
 * (`side` / `align` / `sideOffset` / `alignOffset`). Kept pure so the parity
 * suite can pin the coordinate algebra without a browser.
 */

export type PopoverCompatSide = 'top' | 'bottom' | 'left' | 'right'
export type PopoverCompatAlign = 'start' | 'center' | 'end'
export type PopoverCompatPlacement = PopoverCompatSide | `${PopoverCompatSide}-start` | `${PopoverCompatSide}-end`

export interface AnchorPosition {
  side: PopoverCompatSide
  align: PopoverCompatAlign
}

/** Tamagui/floating-ui placement → Base UI side/align. Tamagui's default placement is `bottom` (centered). */
export function mapPlacementToAnchorPosition(placement?: PopoverCompatPlacement): AnchorPosition {
  if (placement === undefined) {
    return { side: 'bottom', align: 'center' }
  }
  const [side, align] = placement.split('-') as [PopoverCompatSide, 'start' | 'end' | undefined]
  return { side, align: align ?? 'center' }
}

/** The floating-ui offset shape the legacy Tamagui Popover accepts. */
export type PopoverCompatOffset = number | { mainAxis?: number; crossAxis?: number }

/**
 * floating-ui `offset({ mainAxis, crossAxis })` → Base UI
 * `sideOffset`/`alignOffset`. The legacy crossAxis is PHYSICAL (positive =
 * right/down); Base UI routes `alignOffset` through floating-ui's
 * `alignmentAxis`, which flips sign for `end` alignment — so the mapper
 * pre-flips to keep the rendered offset physical, matching the legacy
 * behavior byte for byte.
 */
export function mapOffsetToAnchorPosition({
  offset,
  align,
}: {
  offset: PopoverCompatOffset | undefined
  align: PopoverCompatAlign
}): { sideOffset: number; alignOffset: number } {
  if (offset === undefined) {
    return { sideOffset: 0, alignOffset: 0 }
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
