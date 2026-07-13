import { resolveRwaIssuerDisplay } from 'uniswap/src/data/rest/rwa/resolveRwaIssuerDisplay'
import type { ListRwasAssetSource } from 'uniswap/src/data/rest/rwa/types'
import { logger } from 'utilities/src/logger/logger'

const ASSET: Pick<ListRwasAssetSource, 'symbol' | 'name' | 'logoUrl' | 'issuerData'> = {
  symbol: 'GOLD',
  name: 'Gold',
  logoUrl: 'https://example.com/gold.png',
  issuerData: {
    ondo: { name: 'Ondo', symbol: 'oGOLD', logoUrl: 'https://example.com/ondo.png' },
  },
}

describe('resolveRwaIssuerDisplay', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the per-issuer entry when issuerData has the issuer', () => {
    expect(resolveRwaIssuerDisplay({ asset: ASSET, token: { issuer: 'ondo' } })).toEqual({
      name: 'Ondo',
      symbol: 'oGOLD',
      logoUrl: 'https://example.com/ondo.png',
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('falls back to asset-level display for an empty issuer, without logging', () => {
    expect(resolveRwaIssuerDisplay({ asset: { ...ASSET, issuerData: {} }, token: { issuer: '' } })).toEqual({
      name: 'Gold',
      symbol: 'GOLD',
      logoUrl: 'https://example.com/gold.png',
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('falls back to asset-level display for a whitespace-only issuer, without logging', () => {
    expect(resolveRwaIssuerDisplay({ asset: { ...ASSET, issuerData: {} }, token: { issuer: '   ' } })).toEqual({
      name: 'Gold',
      symbol: 'GOLD',
      logoUrl: 'https://example.com/gold.png',
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('returns undefined and logs an error for a non-empty issuer with no issuerData entry', () => {
    expect(
      resolveRwaIssuerDisplay({ asset: { ...ASSET, issuerData: {} }, token: { issuer: 'mystery' } }),
    ).toBeUndefined()
    expect(logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { file: 'resolveRwaIssuerDisplay.ts', function: 'resolveRwaIssuerDisplay' },
        extra: { issuer: 'mystery' },
      }),
    )
  })
})
