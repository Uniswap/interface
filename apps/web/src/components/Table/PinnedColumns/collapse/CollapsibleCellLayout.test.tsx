import { CollapsibleCellLayout } from '~/components/Table/PinnedColumns/collapse/CollapsibleCellLayout'
import { COLLAPSE_PROGRESS } from '~/components/Table/PinnedColumns/collapse/utils'
import { render, screen } from '~/test-utils/render'

function getLogoWrapper(): HTMLElement {
  const wrapper = screen.getByTestId('logo').parentElement
  if (!wrapper) {
    throw new Error('logo wrapper missing')
  }
  return wrapper
}

describe('CollapsibleCellLayout', () => {
  it('scales a default 32px logo to the 36px collapsed size in place', () => {
    render(
      <CollapsibleCellLayout logo={<div data-testid="logo" />}>
        <span>text</span>
      </CollapsibleCellLayout>,
    )

    const { style } = getLogoWrapper()
    expect(style.transform).toBe(`scale(calc(1 + ${COLLAPSE_PROGRESS} * 0.125))`)
  })

  it('scales the logo from its left edge in a flush cell', () => {
    render(
      <CollapsibleCellLayout flush logo={<div data-testid="logo" />}>
        <span>text</span>
      </CollapsibleCellLayout>,
    )

    expect(getLogoWrapper().style.transformOrigin).toBe('left center')
  })
})
