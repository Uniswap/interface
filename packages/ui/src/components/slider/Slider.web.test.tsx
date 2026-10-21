import { fireEvent, render } from '@testing-library/react'
import { Slider } from 'ui/src/components/slider/Slider'
import { describe, expect, it, vi } from 'vitest'

// jsdom returns a 0-width rect, so pointer-geometry can't be exercised here; the keyboard path and the
// exposed slider semantics are what these pin. Visual/drag behaviour is covered by the margin suite.
describe('Slider (web)', () => {
  it('exposes the slider role and aria value bounds', () => {
    const { getByRole } = render(<Slider value={2} min={1} max={5} onChange={vi.fn()} ariaLabel="Leverage" />)
    const slider = getByRole('slider')
    expect(slider.getAttribute('aria-valuemin')).toBe('1')
    expect(slider.getAttribute('aria-valuemax')).toBe('5')
    expect(slider.getAttribute('aria-valuenow')).toBe('2')
    expect(slider.getAttribute('aria-label')).toBe('Leverage')
  })

  it('nudges by `step` on arrow keys and clamps to [min, max]', () => {
    const onChange = vi.fn()
    const { getByRole, rerender } = render(<Slider value={2} min={1} max={5} step={0.1} onChange={onChange} />)
    const slider = getByRole('slider')
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(expect.closeTo(2.1, 5))
    fireEvent.keyDown(slider, { key: 'ArrowDown' })
    expect(onChange).toHaveBeenLastCalledWith(expect.closeTo(1.9, 5))
    rerender(<Slider value={5} min={1} max={5} step={0.1} onChange={onChange} />)
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(5)
  })

  it('ignores keys and is not focusable when disabled', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<Slider value={2} min={1} max={5} onChange={onChange} disabled />)
    const slider = getByRole('slider')
    expect(slider.getAttribute('tabindex')).toBe('-1')
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
