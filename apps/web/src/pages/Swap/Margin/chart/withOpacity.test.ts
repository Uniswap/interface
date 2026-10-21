import { opacify } from 'ui/src/theme'
import { describe, expect, it } from 'vitest'
import { withOpacity } from '~/pages/Swap/Margin/chart/withOpacity'

describe('withOpacity', () => {
  it('sets the alpha channel on rgba colors (opacify would return them unchanged)', () => {
    // Spore light neutral2 — the stale-mark dim case (STALE_MARK_OPACITY = 0.5).
    expect(withOpacity({ amount: 50, color: 'rgba(19, 19, 19, 0.63)' })).toBe('rgba(19, 19, 19, 0.5)')
    // Spore dark neutral3 — the gridline case (opacify(8, ...)).
    expect(withOpacity({ amount: 8, color: 'rgba(255, 255, 255, 0.38)' })).toBe('rgba(255, 255, 255, 0.08)')
  })

  it('handles rgba with no spaces after commas', () => {
    expect(withOpacity({ amount: 40, color: 'rgba(19,19,19,0.63)' })).toBe('rgba(19, 19, 19, 0.4)')
  })

  it('delegates hex colors to opacify', () => {
    expect(withOpacity({ amount: 50, color: '#131313' })).toBe(opacify(50, '#131313'))
    expect(withOpacity({ amount: 50, color: '#131313' })).toBe('#13131380')
    // #hex8 (alpha already present): opacify replaces the alpha suffix.
    expect(withOpacity({ amount: 50, color: '#131313FF' })).toBe(opacify(50, '#131313FF'))
  })

  it('delegates rgb( colors to opacify', () => {
    expect(withOpacity({ amount: 50, color: 'rgb(19, 19, 19)' })).toBe(opacify(50, 'rgb(19, 19, 19)'))
    expect(withOpacity({ amount: 50, color: 'rgb(19, 19, 19)' })).toBe('rgba(19, 19, 19, 0.50)')
  })
})
