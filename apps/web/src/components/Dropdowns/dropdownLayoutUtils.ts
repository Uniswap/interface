export function getDropdownAvailableSpace({
  triggerRect,
  dropdownOffset,
  viewportHeight = window.innerHeight,
  topInset = 0,
  documentHeight,
  scrollY = 0,
}: {
  triggerRect: Pick<DOMRect, 'top' | 'bottom'>
  dropdownOffset: number
  viewportHeight?: number
  // Height of chrome (e.g. the sticky app header) that overlaps the top of the viewport once scrolled
  topInset?: number
  // Total scrollable document height. Pass this for dropdowns positioned in normal document flow, where
  // the page can scroll to reveal space below the trigger — otherwise spaceBelow is capped at the
  // currently visible viewport slice and flips up even though scrolling down a little would fit it.
  // Omit for viewport-fixed dropdowns, which can't be revealed by scrolling the page.
  documentHeight?: number
  scrollY?: number
}): { spaceAbove: number; spaceBelow: number } {
  const viewportEdgeInset = dropdownOffset
  const spaceBelow =
    documentHeight === undefined
      ? viewportHeight - triggerRect.bottom - dropdownOffset - viewportEdgeInset
      : documentHeight - (triggerRect.bottom + scrollY) - dropdownOffset - viewportEdgeInset

  return {
    spaceAbove: triggerRect.top - dropdownOffset - viewportEdgeInset - topInset,
    spaceBelow,
  }
}

export function getDropdownVerticalLayout({
  allowFlip,
  dropdownHeight,
  forceFlipUp,
  spaceAbove,
  spaceBelow,
}: {
  allowFlip?: boolean
  dropdownHeight: number
  forceFlipUp?: boolean
  spaceAbove: number
  spaceBelow: number
}): { dropdownMaxHeight: number; flipVertical: boolean } {
  if (forceFlipUp) {
    return {
      dropdownMaxHeight: Math.max(0, spaceAbove),
      flipVertical: true,
    }
  }

  if (!allowFlip) {
    return {
      dropdownMaxHeight: Math.max(0, spaceBelow),
      flipVertical: false,
    }
  }

  const fitsBelow = dropdownHeight <= spaceBelow
  if (fitsBelow) {
    return {
      dropdownMaxHeight: Math.max(0, spaceBelow),
      flipVertical: false,
    }
  }

  const fitsAbove = dropdownHeight <= spaceAbove
  if (fitsAbove && spaceAbove > spaceBelow) {
    return {
      dropdownMaxHeight: Math.max(0, spaceAbove),
      flipVertical: true,
    }
  }

  const flipVertical = spaceAbove > spaceBelow

  return {
    dropdownMaxHeight: Math.max(0, flipVertical ? spaceAbove : spaceBelow),
    flipVertical,
  }
}
