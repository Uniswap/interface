import { getAccent2, getNeutralContrast, opacify, passesContrast } from 'theme/utils'

describe('opacify', () => {
  it('should return the same color for invalid hex strings', () => {
    expect(opacify(50, 'blue')).toBe('blue')
  })

  it('should throw an error for invalid hex format', () => {
    expect(() => opacify(50, '#12345')).toThrow('provided color #12345 was not in hexadecimal format')
  })

  it('should handle shorthand hex color correctly', () => {
    expect(opacify(50, '#123')).toBe('#11223380')
  })

  it('should handle full hex color correctly', () => {
    expect(opacify(50, '#112233')).toBe('#11223380')
  })

  it('should throw an error for out-of-range opacity values', () => {
    expect(() => opacify(-1, '#123')).toThrow('provided amount should be between 0 and 100')
    expect(() => opacify(101, '#123')).toThrow('provided amount should be between 0 and 100')
  })
})

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
