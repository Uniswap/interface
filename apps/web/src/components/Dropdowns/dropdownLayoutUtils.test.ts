import { getDropdownVerticalLayout } from '~/components/Dropdowns/dropdownLayoutUtils'

describe(getDropdownVerticalLayout, () => {
  it('uses the space below the trigger when the dropdown fits', () => {
    expect(
      getDropdownVerticalLayout({
        allowFlip: true,
        dropdownHeight: 120,
        spaceAbove: 80,
        spaceBelow: 240,
      }),
    ).toEqual({ dropdownMaxHeight: 240, flipVertical: false })
  })

  it('flips above the trigger when there is more available space above', () => {
    expect(
      getDropdownVerticalLayout({
        allowFlip: true,
        dropdownHeight: 240,
        spaceAbove: 320,
        spaceBelow: 120,
      }),
    ).toEqual({ dropdownMaxHeight: 320, flipVertical: true })
  })

  it('forces the dropdown above the trigger when requested', () => {
    expect(
      getDropdownVerticalLayout({
        allowFlip: true,
        dropdownHeight: 120,
        forceFlipUp: true,
        spaceAbove: 200,
        spaceBelow: 400,
      }),
    ).toEqual({ dropdownMaxHeight: 200, flipVertical: true })
  })

  it('clamps negative available space to zero', () => {
    expect(
      getDropdownVerticalLayout({
        allowFlip: false,
        dropdownHeight: 120,
        spaceAbove: 80,
        spaceBelow: -20,
      }),
    ).toEqual({ dropdownMaxHeight: 0, flipVertical: false })
  })
})
