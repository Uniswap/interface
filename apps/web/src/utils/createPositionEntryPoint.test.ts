import { EntryPointKind, parseEntryPoint } from '~/utils/createPositionEntryPoint'

describe('createPositionEntryPoint', () => {
  describe('parseEntryPoint', () => {
    it('recognizes a hook detail origin and preserves its query parameters', () => {
      const entryPoint = '/explore/hooks/base/0x1111111111111111111111111111111111111111?network=all'
      expect(parseEntryPoint(entryPoint)).toEqual({ kind: EntryPointKind.HookDetails, to: entryPoint })
    })

    it.each([
      '/explore/hooks',
      '/explore/hooks/base',
      '/explore/hooks/base/not-an-address',
      '/explore/hooks/base/0xgggggggggggggggggggggggggggggggggggggggg',
      '/explore/hooks/base/0x0000000000000000000000000000000000000000',
      '/explore/hooks/unknown/0x1111111111111111111111111111111111111111',
      '/explore/hooks/base/0x1111111111111111111111111111111111111111/extra',
      '//example.com/explore/hooks/base/0x1111111111111111111111111111111111111111',
      '/explore/hooks/base/../0x1111111111111111111111111111111111111111',
    ])('rejects an invalid hook detail origin: %s', (entryPoint) => {
      expect(parseEntryPoint(entryPoint)).toEqual({ kind: EntryPointKind.None, to: null })
    })

    it('should parse valid Portfolio Pools entry points', () => {
      expect(parseEntryPoint('/portfolio/pools')).toEqual({
        kind: EntryPointKind.PortfolioPools,
        to: '/portfolio/pools',
      })
      expect(parseEntryPoint('/portfolio/0x1234567890123456789012345678901234567890/pools')).toEqual({
        kind: EntryPointKind.PortfolioPools,
        to: '/portfolio/0x1234567890123456789012345678901234567890/pools',
      })
    })

    it('should ignore Portfolio Pools entry points with invalid address segments', () => {
      expect(parseEntryPoint('/portfolio/not-an-address/pools')).toEqual({
        kind: EntryPointKind.None,
        to: null,
      })
    })

    it('should require a pool detail segment for Explore pool detail entry points', () => {
      expect(parseEntryPoint('/explore/pools/1/0x123')).toEqual({
        kind: EntryPointKind.ExplorePoolDetail,
        to: '/explore/pools/1/0x123',
      })
      expect(parseEntryPoint('/explore/pools/')).toEqual({
        kind: EntryPointKind.None,
        to: null,
      })
    })
  })
})
