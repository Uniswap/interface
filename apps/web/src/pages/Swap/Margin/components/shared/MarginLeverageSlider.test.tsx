import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MarginLeverageSlider } from '~/pages/Swap/Margin/components/shared/MarginLeverageSlider'
import { render } from '~/test-utils/render'

function renderSlider(cap: number): ReturnType<typeof vi.fn<(next: number) => void>> {
  const onChange = vi.fn<(next: number) => void>()
  render(<MarginLeverageSlider value={1.5} cap={cap} onChange={onChange} />)
  return onChange
}

describe('MarginLeverageSlider tick labels', () => {
  // Recovered from its track fraction, the 4x tick at cap 5.7 is 1 + (3 / 4.7) * 4.7 = 3.9999999999999996.
  it('passes the exact integer on a fractional cap', () => {
    const onChange = renderSlider(5.7)
    fireEvent.click(screen.getByText('4x'))
    expect(onChange).toHaveBeenLastCalledWith(4)
  })

  it.each([2.3, 5.38, 6.94, 9.46, 11.36, 19.95])('passes Max and every integer tick exactly at cap %s', (cap) => {
    const onChange = renderSlider(cap)
    fireEvent.click(screen.getByText('Max'))
    expect(onChange).toHaveBeenLastCalledWith(cap)
    // Integers that would crowd the Max label are not rendered.
    const marks = Array.from({ length: Math.floor(cap) }, (_, index) => index + 1).filter(
      (mark) => (mark - 1) / (cap - 1) <= 0.9,
    )
    for (const mark of marks) {
      fireEvent.click(screen.getByText(`${mark}x`))
      expect(onChange).toHaveBeenLastCalledWith(mark)
    }
  })
})
