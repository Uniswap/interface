import { describe, expect, it } from 'vitest'
import { buildImportV2PositionsHref } from '~/utils/importV2PositionsRoute'

describe('buildImportV2PositionsHref', () => {
  it('returns the bare path when no entryPoint is provided', () => {
    expect(buildImportV2PositionsHref()).toBe('/pools/v2/find')
  })

  it('returns the bare path when entryPoint is undefined', () => {
    expect(buildImportV2PositionsHref({ entryPoint: undefined })).toBe('/pools/v2/find')
  })

  it('appends entryPoint as a URL-encoded query param when provided', () => {
    expect(buildImportV2PositionsHref({ entryPoint: '/portfolio/pools' })).toBe(
      '/pools/v2/find?entryPoint=%2Fportfolio%2Fpools',
    )
  })

  it('URL-encodes entryPoint values that include an external-wallet address', () => {
    expect(
      buildImportV2PositionsHref({ entryPoint: '/portfolio/0x0000000000000000000000000000000000000001/pools' }),
    ).toBe('/pools/v2/find?entryPoint=%2Fportfolio%2F0x0000000000000000000000000000000000000001%2Fpools')
  })
})
