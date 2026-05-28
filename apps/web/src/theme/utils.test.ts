import { getAccent2, getNeutralContrast, passesContrast } from 'theme/utils'

describe('passesContrast', () => {
  it('should return true for contrasting colors', () => {
    expect(passesContrast('#ffffff', '#000000')).toBe(true)
  })

  it('should return false for non-contrasting colors', () => {
    expect(passesContrast('#ffffff', '#fff')).toBe(false)
  })
})

describe('getNeutralContrast', () => {
  it('should return white for a color that contrasts well with white', () => {
    const darkPurple = '#330033'
    expect(getNeutralContrast(darkPurple)).toBe('#FFFFFF') // Black contrasts well with white
  })

  it('should return black for a color that contrasts well with black', () => {
    const lightYellow = '#ffffaa'
    expect(getNeutralContrast(lightYellow)).toBe('#000000') // White contrasts well with black
  })
})

describe('getAccent2', () => {
  it('should return a mix of two colors', () => {
    const result = getAccent2('#FFFFFF', '#000000')
    expect(result).toMatch(/^#/) // Result should be a hex color
    expect(result).toBe('#1e1e1e') // Result should 12% white & 88% black
  })

  it('should handle same color inputs', () => {
    expect(getAccent2('#f00', '#f00')).toBe('#f00') // Same color inputs should return the same color
  })
})
