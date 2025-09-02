import { routes } from 'pages/RouteDefinitions'
import { getExploreTitle } from 'pages/getExploreTitle'
import { getAddLiquidityPageTitle, getPositionPageDescription, getPositionPageTitle } from 'pages/getPositionPageTitle'
import { paths } from 'pages/paths'
import React from 'react'

// Mock the actual components since they're not needed to test route definitions.
vi.mock('pages/Swap', () => ({
  default: () => React.createElement(React.Fragment),
}))

describe('Paths', () => {
  it('should have every path in the app RouteDefinitions', () => {
    const appPaths: string[] = routes.map((routeDef) => routeDef.path)
    appPaths.forEach((path) => {
      // We don't want to expose these fallback routes to the Cloudflare function.
      if (path === '*' || path === '/not-found') {
        return
      }
      expect(paths).toContain(path)
    })
  })
})

describe('getExploreTitle', () => {
  it('should return the correct title for /explore', () => {
    expect(getExploreTitle('/explore')).toBe('Explore top tokens on Ethereum on JuiceSwap')
  })

  it('should return the correct title for /explore/ethereum', () => {
    expect(getExploreTitle('/explore/ethereum')).toBe('Explore top tokens on Ethereum on JuiceSwap')
  })

  it('should return the correct title for /explore/polygon', () => {
    expect(getExploreTitle('/explore/polygon')).toBe('Explore top tokens on Polygon on JuiceSwap')
  })

  it('should return the correct title for /explore/tokens', () => {
    expect(getExploreTitle('/explore/tokens')).toBe('Explore top tokens on Ethereum on JuiceSwap')
  })

  it('should return the correct title for /explore/pools', () => {
    expect(getExploreTitle('/explore/pools')).toBe('Explore top pools on Ethereum on JuiceSwap')
  })

  it('should return the correct title for /explore/transactions', () => {
    expect(getExploreTitle('/explore/transactions')).toBe('Explore top transactions on Ethereum on JuiceSwap')
  })

  it('should return the correct title for /explore/tokens/ethereum', () => {
    expect(getExploreTitle('/explore/tokens/ethereum')).toBe('Explore top tokens on Ethereum on JuiceSwap')
  })

  it('should return the correct title for /explore/pools/ethereum', () => {
    expect(getExploreTitle('/explore/pools/ethereum')).toBe('Explore top pools on Ethereum on JuiceSwap')
  })

  it('should return the correct title for /explore/transactions/ethereum', () => {
    expect(getExploreTitle('/explore/transactions/ethereum')).toBe('Explore top transactions on Ethereum on JuiceSwap')
  })

  it('should return the correct title for /explore/tokens/optimism', () => {
    expect(getExploreTitle('/explore/tokens/optimism')).toBe('Explore top tokens on Optimism on JuiceSwap')
  })

  it('should return the correct title for /explore/pools/optimism', () => {
    expect(getExploreTitle('/explore/pools/optimism')).toBe('Explore top pools on Optimism on JuiceSwap')
  })

  it('should return the correct title for /explore/transactions/optimism', () => {
    expect(getExploreTitle('/explore/transactions/optimism')).toBe('Explore top transactions on Optimism on JuiceSwap')
  })
})

describe('positionPage static titles and descriptions', () => {
  it('should return the correct title & description for v3 positions page', () => {
    const v3PositionsPageUrl = '/positions/v3/optimism/512372'
    expect(getPositionPageTitle(v3PositionsPageUrl)).toBe('Manage pool liquidity (v3) on JuiceSwap')
    expect(getPositionPageDescription(v3PositionsPageUrl)).toBe(
      'View your active v3 liquidity positions. Add new positions.',
    )
  })

  it('should return the correct title for Add Liquidity pages', () => {
    expect(getAddLiquidityPageTitle('/add')).toBe('Add liquidity to pools on JuiceSwap')
  })
})
