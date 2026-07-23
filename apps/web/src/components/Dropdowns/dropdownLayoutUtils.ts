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
  const flipVertical = !!allowFlip && (forceFlipUp || (dropdownHeight > spaceBelow && spaceAbove > spaceBelow))

  return {
    dropdownMaxHeight: Math.max(0, flipVertical ? spaceAbove : spaceBelow),
    flipVertical,
  }
}
