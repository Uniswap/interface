import { getContrastPassingTextColor } from 'ui/src/utils/colors/getContrastPassingTextColor'
import { describe, expect, it, vi } from 'vitest'

// Mocking the colorsLight object
vi.mock('ui/src/theme', () => ({
  colorsLight: {
    white: '#FFFFFF',
  },
}))

describe('getContrastPassingTextColor', () => {
  it('should return $white for a dark background color', () => {
    const backgroundColor = '#000000' // Black
    const result = getContrastPassingTextColor(backgroundColor)
    expect(result).toBe('$white')
  })

  it('should return $black for a light background color', () => {
    const backgroundColor = '#FFFFFF' // White
    const result = getContrastPassingTextColor(backgroundColor)
    expect(result).toBe('$black')
  })

  it('should return $white for a color with sufficient contrast', () => {
    const backgroundColor = '#333333' // Dark gray
    const result = getContrastPassingTextColor(backgroundColor)
    expect(result).toBe('$white')
  })

  it('should return $black for a color with insufficient contrast', () => {
    const backgroundColor = '#CCCCCC' // Light gray
    const result = getContrastPassingTextColor(backgroundColor)
    expect(result).toBe('$black')
  })
})
