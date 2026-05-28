import { colorsLight } from 'ui/src/theme'
import { AdjustmentType, adjustColorVariant, findNearestThemeColor, getColorDiffScore } from 'uniswap/src/utils/colors'

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
    expect(findNearestThemeColor(colorsLight.statusSuccess)).toEqual('greenBase')
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
