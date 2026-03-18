import { colors } from 'ui/src/theme/color/colors'
import { themes } from 'ui/src/theme/themes'
import {
  getIsTokenFormat,
  getIsValidSporeColor,
  getMaybeHoverColor,
  validateColorValue,
  validColor,
} from 'ui/src/theme/tokens'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// Mock the process.env.NODE_ENV for testing validColor behavior
const originalNodeEnv = process.env.NODE_ENV
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  process.env.NODE_ENV = originalNodeEnv
  vi.restoreAllMocks()
})

describe('tokens utils', () => {
  describe('getIsTokenFormat', () => {
    it('should return true if the value is a token', () => {
      expect(getIsTokenFormat('$statusCritical')).toBe(true)
      expect(getIsTokenFormat('$neutral1')).toBe(true)
    })
  })

  it('should return false if the value does not start with a $', () => {
    expect(getIsTokenFormat('statusCritical')).toBe(false)
    expect(getIsTokenFormat('#FFFFFF')).toBe(false)
    expect(getIsTokenFormat('rgb(255, 255, 255)')).toBe(false)
    expect(getIsTokenFormat('$status Critical')).toBe(true)
    expect(getIsTokenFormat('')).toBe(false)
    expect(getIsTokenFormat('$')).toBe(true)
    expect(getIsTokenFormat('$StatusCritical')).toBe(true)
  })
})

describe('getIsValidSporeColor', () => {
  it('should return true for valid color tokens', () => {
    // Using a known color from the color tokens
    const colorToken = Object.keys(colors)[0]
    expect(getIsValidSporeColor(`$${colorToken}`)).toBe(true)
  })

  it('should return true for valid theme colors', () => {
    // Using a known color from the theme
    const themeToken = Object.keys(themes.light)[0]
    expect(getIsValidSporeColor(`$${themeToken}`)).toBe(true)
  })

  it('should return false for invalid token colors', () => {
    expect(getIsValidSporeColor('$nonExistentColor')).toBe(false)
  })

  it('should return false for non-token format', () => {
    expect(getIsValidSporeColor('statusCritical')).toBe(false)
    expect(getIsValidSporeColor('#FFFFFF')).toBe(false)
  })
})

describe('validateColorValue', () => {
  it('should validate token format colors', () => {
    const colorToken = Object.keys(colors)[0]
    const result = validateColorValue(`$${colorToken}`)
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate hex colors', () => {
    const result = validateColorValue('#FFFFFF')
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate rgb colors', () => {
    const result = validateColorValue('rgb(255, 255, 255)')
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate rgba colors', () => {
    const result = validateColorValue('rgba(255, 255, 255, 0.5)')
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate hsl colors', () => {
    const result = validateColorValue('hsl(0, 100%, 50%)')
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate hsla colors', () => {
    const result = validateColorValue('hsla(0, 100%, 50%, 0.5)')
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate CSS variables', () => {
    const result = validateColorValue('var(--my-color)')
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should invalidate incorrect color formats', () => {
    const result = validateColorValue('invalid-color')
    expect(result.isValid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should handle undefined and null', () => {
    expect(validateColorValue(undefined).isValid).toBe(true)
    expect(validateColorValue(null).isValid).toBe(true)
  })
})

describe('validColor', () => {
  it('should return valid colors unchanged', () => {
    const colorToken = Object.keys(colors)[0]
    expect(validColor(`$${colorToken}`)).toBe(`$${colorToken}`)
    expect(validColor('#FFFFFF')).toBe('#FFFFFF')
    expect(validColor('rgb(255, 255, 255)')).toBe('rgb(255, 255, 255)')
  })

  it('should throw an error for invalid colors in development', () => {
    process.env.NODE_ENV = 'production'
    expect(() => validColor('invalid-color')).not.toThrow()

    process.env.NODE_ENV = 'development'
    expect(() => validColor('invalid-color')).toThrow()
  })
})

describe('getMaybeHoverColor', () => {
  it('should handle token colors that DO have a `Hovered` variant appropriately', () => {
    // For system tokens where both form and hover form exist
    // We'll check the implementation without mocks
    const nonHoveredColor = '$neutral1'
    const result = getMaybeHoverColor(nonHoveredColor)

    // We're checking the implementation works, not specific values
    expect(typeof result).toBe('string')
    expect(result).toBe('$neutral1Hovered')
  })

  it('should handle token colors that DO NOT have a `Hovered` variant appropriately', () => {
    // For system tokens where both form and hover form exist
    // We'll check the implementation without mocks
    const nonHoveredColor = '$surface3Solid'
    const result = getMaybeHoverColor(nonHoveredColor)

    // We're checking the implementation works, not specific values
    expect(typeof result).toBe('string')
    expect(result).toBe('$surface3Solid')
  })

  it('should return non-token colors unchanged', () => {
    expect(getMaybeHoverColor('#FFFFFF')).toBe('#FFFFFF')
    expect(getMaybeHoverColor('rgb(255, 255, 255)')).toBe('rgb(255, 255, 255)')
    expect(getMaybeHoverColor(undefined)).toBe(undefined)
    expect(getMaybeHoverColor(null)).toBe(null)
  })
})
