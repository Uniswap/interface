import { buildCreatePositionHref } from '~/utils/createPositionRoute'

describe('createPositionRoute', () => {
  describe('buildCreatePositionHref', () => {
    it('should build legacy create-position routes with protocol versions', () => {
      expect(
        buildCreatePositionHref({
          entryPoint: '/portfolio/pools',
          isAddLiquidityRevampEnabled: false,
          protocolVersion: 'v3',
        }),
      ).toBe('/positions/create/v3?entryPoint=%2Fportfolio%2Fpools')
    })

    it('should build revamp create-position routes without protocol versions', () => {
      expect(
        buildCreatePositionHref({
          entryPoint: '/portfolio/pools',
          isAddLiquidityRevampEnabled: true,
          protocolVersion: 'v3',
        }),
      ).toBe('/positions/add?entryPoint=%2Fportfolio%2Fpools')
    })
  })
})
