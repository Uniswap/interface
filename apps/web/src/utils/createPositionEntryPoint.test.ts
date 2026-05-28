import { EntryPointKind, parseEntryPoint } from '~/utils/createPositionEntryPoint'

describe('createPositionEntryPoint', () => {
  describe('parseEntryPoint', () => {
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
