import { getExposureWeights, resolveExposureColor } from 'uniswap/src/features/earn/EarnExposurePopover'
import { describe, expect, it } from 'vitest'

describe(getExposureWeights, () => {
  it('omits the bar when a USD vector contains an unpriced asset', () => {
    expect(getExposureWeights([{ currencyId: 'usdc' }, { currencyId: 'wbtc', valueUsd: 2_318.26 }])).toBeNull()
  })

  it('prefers complete share data over USD values', () => {
    expect(
      getExposureWeights([
        { currencyId: 'usdc', share: 0.25, valueUsd: 10 },
        { currencyId: 'wbtc', share: 0.75 },
      ]),
    ).toEqual([0.25, 0.75])
  })

  it('uses a complete share distribution while preserving informational rows as unknown', () => {
    expect(
      getExposureWeights([
        { currencyId: 'usdc' },
        { currencyId: 'cbbtc', share: 0.03, valueUsd: 2_000 },
        { currencyId: 'wbtc', share: 0.97, valueUsd: 64_000 },
      ]),
    ).toEqual([null, 0.03, 0.97])
  })

  it('omits the bar when partial shares do not describe the full distribution', () => {
    expect(
      getExposureWeights([
        { currencyId: 'usdc' },
        { currencyId: 'cbbtc', share: 0.03 },
        { currencyId: 'wbtc', share: 0.67 },
      ]),
    ).toBeNull()
  })

  it('omits the bar when no distribution data is available', () => {
    expect(getExposureWeights([{ currencyId: 'usdc' }, { currencyId: 'wbtc' }])).toBeNull()
  })

  it('uses USD values when every asset is priced and shares are unavailable', () => {
    expect(
      getExposureWeights([
        { currencyId: 'usdc', valueUsd: 1_000 },
        { currencyId: 'wbtc', valueUsd: 2_318.26 },
      ]),
    ).toEqual([1_000, 2_318.26])
  })
})

describe(resolveExposureColor, () => {
  it('uses extracted logo colors for raster images', () => {
    expect(
      resolveExposureColor({
        imageUrl: 'https://example.com/token.png',
        extractedColor: '#123456',
        fallbackColor: '#abcdef',
      }),
    ).toBe('#123456')
  })

  it('keeps SVG assets distinct with their indexed fallback colors', () => {
    expect(
      resolveExposureColor({
        imageUrl: 'https://example.com/token.svg',
        extractedColor: '#000000',
        fallbackColor: '#abcdef',
      }),
    ).toBe('#abcdef')
  })
})
