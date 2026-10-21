import { render } from '@testing-library/react'
import { MobileBottomBar } from '~/components/NavBar/MobileBottomBar/MobileBottomBar'

// Expected values are independent literals, deliberately not derived from MOBILE_BAR_MAX_HEIGHT or
// MWEB_BOTTOM_INSET, so a silent change to either fails here.
const INSET = 'var(--mweb-bottom-inset, 0px)'

function renderBar(hide: boolean): HTMLElement {
  const { container } = render(
    <MobileBottomBar hide={hide} testID="bar">
      <span>cta</span>
    </MobileBottomBar>,
  )
  return container.querySelector('[data-testid="bar"]') as HTMLElement
}

describe('MobileBottomBar', () => {
  it('grows its bottom padding and height cap by the mWeb bottom inset while shown', () => {
    const bar = renderBar(false)
    expect(bar.classList.contains('pb-[var(--c-pb)]')).toBe(true)
    expect(bar.style.getPropertyValue('--c-pb')).toBe(`calc(12px + ${INSET})`)
    expect(bar.classList.contains('max-h-[var(--c-max-h)]')).toBe(true)
    expect(bar.style.getPropertyValue('--c-max-h')).toBe(`calc(100px + ${INSET})`)
    expect(bar.classList.contains('bottom-[0px]')).toBe(true)
  })

  it('translates fully out of view, inset included, while hidden', () => {
    const bar = renderBar(true)
    expect(bar.classList.contains('bottom-[var(--c-bottom)]')).toBe(true)
    expect(bar.style.getPropertyValue('--c-bottom')).toBe(`calc(-100px - ${INSET})`)
  })
})
