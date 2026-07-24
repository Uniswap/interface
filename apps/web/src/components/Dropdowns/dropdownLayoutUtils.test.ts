import { getDropdownAvailableSpace, getDropdownVerticalLayout } from '~/components/Dropdowns/dropdownLayoutUtils'

describe(getDropdownAvailableSpace, () => {
  it('reserves the trigger gap and matching viewport edge inset on both sides', () => {
    expect(
      getDropdownAvailableSpace({
        dropdownOffset: 10,
        triggerRect: { top: 100, bottom: 140 },
        viewportHeight: 500,
      }),
    ).toEqual({
      spaceAbove: 80,
      spaceBelow: 340,
    })
  })

  it('subtracts topInset from space above, but not from space below', () => {
    expect(
      getDropdownAvailableSpace({
        dropdownOffset: 10,
        triggerRect: { top: 100, bottom: 140 },
        viewportHeight: 500,
        topInset: 72,
      }),
    ).toEqual({
      spaceAbove: 8,
      spaceBelow: 340,
    })
  })

  it('measures space below against the scrollable document, not the visible viewport slice, when documentHeight is provided', () => {
    // A short viewport (400px) leaves little room below the trigger, but the page has plenty more
    // content further down that scrolling would reveal.
    expect(
      getDropdownAvailableSpace({
        dropdownOffset: 10,
        triggerRect: { top: 100, bottom: 140 },
        viewportHeight: 400,
        documentHeight: 3000,
        scrollY: 200,
      }),
    ).toEqual({
      spaceAbove: 80,
      spaceBelow: 2640, // 3000 - (140 + 200) - 10 - 10
    })
  })
})

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

  it('opens downward when the dropdown fits below even if there is more space above', () => {
    expect(
      getDropdownVerticalLayout({
        allowFlip: true,
        dropdownHeight: 120,
        spaceAbove: 320,
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

  it('opens downward with scroll when space above is limited', () => {
    expect(
      getDropdownVerticalLayout({
        allowFlip: true,
        dropdownHeight: 320,
        spaceAbove: 80,
        spaceBelow: 240,
      }),
    ).toEqual({ dropdownMaxHeight: 240, flipVertical: false })
  })

  it('opens in the direction with more space when neither side fits the full dropdown', () => {
    expect(
      getDropdownVerticalLayout({
        allowFlip: true,
        dropdownHeight: 320,
        spaceAbove: 150,
        spaceBelow: 100,
      }),
    ).toEqual({ dropdownMaxHeight: 150, flipVertical: true })
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
