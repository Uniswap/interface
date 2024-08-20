import { colorsLight, opacify } from 'ui/src/theme'
import {
  AdjustmentType,
  adjustColorVariant,
  findNearestThemeColor,
  getColorDiffScore,
  hexToRGB,
} from 'uniswap/src/utils/colors'

it('returns an hex color with opacity', () => {
  expect(opacify(10, '#000000')).toEqual('#0000001a')
})

it('ignores color when not an hex', () => {
  expect(opacify(10, '000000')).toEqual('000000')
})

it('throws when color is not valid', () => {
  expect(() => opacify(10, '#000')).toThrow()
  expect(() => opacify(10, '#00000000')).toThrow()
})

it('throws when amount is not valid', () => {
  expect(() => opacify(-1, '#000000')).toThrow()
  expect(() => opacify(120, '#000000')).toThrow()
})

describe('adjustColorVariant', () => {
  it('handles undefined', () => {
    expect(adjustColorVariant(undefined, AdjustmentType.Lighten)).toEqual(undefined)
  })

  it('lightens color', () => {
    expect(adjustColorVariant('bluePastel', AdjustmentType.Lighten)).toEqual('blueLight')
  })

  it('darkens color', () => {
    expect(adjustColorVariant('blueVibrant', AdjustmentType.Darken)).toEqual('blueDark')
  })
})

describe('findNearestThemeColor', () => {
  it('Finds correct theme color for color in theme', () => {
    expect(findNearestThemeColor(colorsLight.accent1)).toEqual('pinkBase')
  })
})

describe('getColorDiffScore', () => {
  it('returns 1 for same color', () => {
    expect(getColorDiffScore('#000000', '#000000')).toEqual(1)
  })
  it('returns max for opposite color', () => {
    expect(getColorDiffScore('#000000', '#ffffff')).toEqual(442.6729559300637)
  })
})

describe('hexToRGB', () => {
  it('converts hex to rgb', () => {
    expect(hexToRGB('#000000')).toEqual({ b: 0, g: 0, r: 0 })
  })
})
