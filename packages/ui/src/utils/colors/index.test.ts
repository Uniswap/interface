import { colorsLight } from 'ui/src/theme'
import { isGrayColor, passesContrast } from 'ui/src/utils/colors'
import { describe, expect, it } from 'vitest'

describe('isGrayColor', () => {
  it('should return true for gray hex colors', () => {
    expect(isGrayColor('#808080')).toBe(true)
    expect(isGrayColor('#aaaaaa')).toBe(true)
    expect(isGrayColor('#555555')).toBe(true)
  })

  it('should return true for gray rgb colors', () => {
    expect(isGrayColor('rgb(128, 128, 128)')).toBe(true)
    expect(isGrayColor('rgb(170, 170, 170)')).toBe(true)
    expect(isGrayColor('rgb(85, 85, 85)')).toBe(true)
  })

  it('should return false for non-gray colors', () => {
    expect(isGrayColor('#FF0000')).toBe(false)
    expect(isGrayColor('#00FF00')).toBe(false)
    expect(isGrayColor('#0000FF')).toBe(false)
    expect(isGrayColor('rgb(255, 0, 0)')).toBe(false)
  })

  it('should return false for invalid colors', () => {
    expect(isGrayColor(undefined)).toBe(false)
    expect(isGrayColor(null)).toBe(false)
    expect(isGrayColor('')).toBe(false)
    expect(isGrayColor('#abc')).toBe(false)
    expect(isGrayColor('invalid')).toBe(false)
  })

  it('should return false for almost gray colors', () => {
    expect(isGrayColor('#778899')).toBe(false)
    expect(isGrayColor('rgb(128, 130, 140)')).toBe(false)
  })
})

describe('passesContrast', () => {
  const backgroundHex = colorsLight.white
  const contrastThreshold = 1.95

  it('should return false for empty colors', () => {
    expect(passesContrast({ color: '', backgroundColor: backgroundHex, contrastThreshold })).toBe(false)
  })

  it('should return false for pure black', () => {
    expect(passesContrast({ color: '#000000', backgroundColor: backgroundHex, contrastThreshold })).toBe(false)
  })

  it('should return false for pure white', () => {
    expect(passesContrast({ color: '#FFFFFF', backgroundColor: backgroundHex, contrastThreshold })).toBe(false)
  })
})
