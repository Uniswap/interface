import { opacifyRaw } from 'ui/src/theme/color/utils'
import { computeCharsSizes } from 'uniswap/src/components/AnimatedNumber/utils/computeCharsSizes'
import { getAnimatedNumberCharKey } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberCharKey'
import { getAnimatedNumberVariantMetrics } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberVariantMetrics'
import {
  CUSTOM_COLOR_FADED_DECIMAL_OPACITY,
  getCharBaseColor,
  getCharDisplayColor,
  getFadedDecimalColor,
} from 'uniswap/src/components/AnimatedNumber/utils/getCharDisplayColor'
import { longestCommonPrefix } from 'uniswap/src/components/AnimatedNumber/utils/longestCommonPrefix'
import { splitFormattedValue } from 'uniswap/src/components/AnimatedNumber/utils/splitFormattedValue'
import { splitValueIntoChars } from 'uniswap/src/components/AnimatedNumber/utils/splitValueIntoChars'

describe(getFadedDecimalColor, () => {
  it('returns faded decimal color when fading without a custom color', () => {
    expect(
      getFadedDecimalColor({
        shouldFadeDecimals: true,
        baseColor: '#0f0',
        fadedDecimalColor: '#222',
        hasCustomColor: false,
      }),
    ).toBe('#222')
  })

  it('returns reduced-opacity base color when fading with a custom color', () => {
    expect(
      getFadedDecimalColor({
        shouldFadeDecimals: true,
        baseColor: '#00ff00',
        fadedDecimalColor: '#222',
        hasCustomColor: true,
      }),
    ).toBe(opacifyRaw(CUSTOM_COLOR_FADED_DECIMAL_OPACITY, '#00ff00'))
  })
})

describe(getCharDisplayColor, () => {
  const neutral1 = '#111'
  const fadedDecimal = '#222'

  it('returns neutral1 for whole part', () => {
    expect(
      getCharDisplayColor({
        index: 0,
        chars: ['1', '.', '0'],
        decimalSeparator: '.',
        shouldFadeDecimals: true,
        commonPrefixLength: 0,
        neutral1Color: neutral1,
        fadedDecimalColor: fadedDecimal,
      }),
    ).toBe(neutral1)
  })

  it('returns faded decimal color for decimal part when shouldFadeDecimals', () => {
    expect(
      getCharDisplayColor({
        index: 2,
        chars: ['1', '.', '0'],
        decimalSeparator: '.',
        shouldFadeDecimals: true,
        commonPrefixLength: 0,
        neutral1Color: neutral1,
        fadedDecimalColor: fadedDecimal,
      }),
    ).toBe(fadedDecimal)
  })

  it('returns nextColor for changed suffix indices', () => {
    expect(
      getCharDisplayColor({
        index: 2,
        chars: ['1', '.', '0'],
        decimalSeparator: '.',
        shouldFadeDecimals: false,
        commonPrefixLength: 2,
        nextColor: '#0f0',
        neutral1Color: neutral1,
        fadedDecimalColor: fadedDecimal,
      }),
    ).toBe('#0f0')
  })
})

describe(getCharBaseColor, () => {
  it('matches getCharDisplayColor without nextColor', () => {
    const params = {
      index: 1,
      chars: ['$', '1'],
      decimalSeparator: '.',
      shouldFadeDecimals: false,
      neutral1Color: '#111',
      fadedDecimalColor: '#222',
    }
    expect(getCharBaseColor(params)).toBe(getCharDisplayColor({ ...params, commonPrefixLength: 0 }))
  })
})

describe(getAnimatedNumberCharKey, () => {
  it('uses sign key for first index', () => {
    expect(getAnimatedNumberCharKey({ index: 0, charsLength: 5, signColor: 'red' })).toBe('$_sign_red')
  })

  it('uses number key for other indices', () => {
    expect(getAnimatedNumberCharKey({ index: 2, charsLength: 5, signColor: 'red' })).toBe('$_number_3')
  })
})

describe(getAnimatedNumberVariantMetrics, () => {
  it('scales digit widths from heading1 baseline', () => {
    const metrics = getAnimatedNumberVariantMetrics('$heading2')
    expect(metrics.digitHeight).toBe(metrics.variantFont.lineHeight)
    expect(metrics.numberWidthArrayScaled.length).toBe(10)
    expect(metrics.maxDigitWidthScaled).toBe(Math.max(...metrics.numberWidthArrayScaled))
  })
})

describe(splitValueIntoChars, () => {
  it('returns empty array when value is undefined', () => {
    expect(splitValueIntoChars(undefined)).toEqual([])
  })

  it('splits value into characters', () => {
    expect(splitValueIntoChars('$12')).toEqual(['$', '1', '2'])
  })
})

describe(longestCommonPrefix, () => {
  it('returns shared prefix length', () => {
    expect(longestCommonPrefix('$1,234.00', '$1,235.00')).toBe('$1,23')
  })

  it('returns only shared prefix when digits differ', () => {
    expect(longestCommonPrefix('$9.00', '$8.00')).toBe('$')
  })
})

describe(splitFormattedValue, () => {
  it('returns empty parts when value is undefined', () => {
    expect(splitFormattedValue(undefined, '.')).toEqual({ wholePart: '', decimalPart: '' })
  })

  it('splits on decimal separator and prefixes decimal part with separator', () => {
    expect(splitFormattedValue('1,234.56', '.')).toEqual({ wholePart: '1,234', decimalPart: '.56' })
  })

  it('handles no fractional part', () => {
    expect(splitFormattedValue('99', '.')).toEqual({ wholePart: '99', decimalPart: '' })
  })

  it('handles comma as decimal separator', () => {
    expect(splitFormattedValue('1.234,56', ',')).toEqual({ wholePart: '1.234', decimalPart: ',56' })
  })
})

describe(computeCharsSizes, () => {
  const widths = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
  const space = 2

  it('returns zeros for characters without digit or whitespace advance', () => {
    expect(computeCharsSizes({ chars: ['$', '1'], digitWidths: widths, spaceSize: space })).toEqual([0, 12])
  })

  it('accumulates digit and space widths', () => {
    expect(computeCharsSizes({ chars: ['1', '2'], digitWidths: widths, spaceSize: space })).toEqual([12, 24])
  })

  it('treats space character as spacing only', () => {
    expect(computeCharsSizes({ chars: ['1', ' ', '2'], digitWidths: widths, spaceSize: space })).toEqual([12, 14, 26])
  })
})
