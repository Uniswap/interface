import { ChainId, WETH9 } from '@uniswap/sdk-core'

import { getDefaultTokensTitle } from './getDefaultTokensTitle'
import { getExploreTitle } from './getExploreTitle'
import { paths } from './paths'
import { routes } from './RouteDefinitions'

describe('Paths', () => {
  it('should have every path in the app RouteDefinitions', () => {
    const appPaths: string[] = routes.map((routeDef) => routeDef.path)
    appPaths.forEach((path) => {
      // We don't want to expose these fallback routes to the Cloudflare function.
      if (path === '*' || path === '/not-found') return
      expect(paths).toContain(path)
    })
  })
})

describe('getExploreTitle', () => {
  it('should return the correct title for /explore', () => {
    expect(getExploreTitle('/explore')).toBe('Explore top tokens on Ethereum on Uniswap')
  })

  it('should return the correct title for /explore/ethereum', () => {
    expect(getExploreTitle('/explore/ethereum')).toBe('Explore top tokens on Ethereum on Uniswap')
  })

  it('should return the correct title for /explore/polygon', () => {
    expect(getExploreTitle('/explore/polygon')).toBe('Explore top tokens on Polygon on Uniswap')
  })

  it('should return the correct title for /explore/tokens', () => {
    expect(getExploreTitle('/explore/tokens')).toBe('Explore top tokens on Ethereum on Uniswap')
  })

  it('should return the correct title for /explore/pools', () => {
    expect(getExploreTitle('/explore/pools')).toBe('Explore top pools on Ethereum on Uniswap')
  })

  it('should return the correct title for /explore/transactions', () => {
    expect(getExploreTitle('/explore/transactions')).toBe('Explore top transactions on Ethereum on Uniswap')
  })

  it('should return the correct title for /explore/tokens/ethereum', () => {
    expect(getExploreTitle('/explore/tokens/ethereum')).toBe('Explore top tokens on Ethereum on Uniswap')
  })

  it('should return the correct title for /explore/pools/ethereum', () => {
    expect(getExploreTitle('/explore/pools/ethereum')).toBe('Explore top pools on Ethereum on Uniswap')
  })

  it('should return the correct title for /explore/transactions/ethereum', () => {
    expect(getExploreTitle('/explore/transactions/ethereum')).toBe('Explore top transactions on Ethereum on Uniswap')
  })

  it('should return the correct title for /explore/tokens/optimism', () => {
    expect(getExploreTitle('/explore/tokens/optimism')).toBe('Explore top tokens on Optimism on Uniswap')
  })

  it('should return the correct title for /explore/pools/optimism', () => {
    expect(getExploreTitle('/explore/pools/optimism')).toBe('Explore top pools on Optimism on Uniswap')
  })

  it('should return the correct title for /explore/transactions/optimism', () => {
    expect(getExploreTitle('/explore/transactions/optimism')).toBe('Explore top transactions on Optimism on Uniswap')
  })
})

describe('getDefaultTokensTitle', () => {
  it('should return the correct title for /tokens', () => {
    expect(getDefaultTokensTitle('/tokens')).toBe('Explore top tokens on Ethereum on Uniswap')
  })

  it('should return the correct title for /tokens/ethereum', () => {
    expect(getDefaultTokensTitle('/tokens/ethereum')).toBe('Explore top tokens on Ethereum on Uniswap')
  })

  it('should return the correct title for /tokens/optimism', () => {
    expect(getDefaultTokensTitle('/tokens/optimism')).toBe('Explore top tokens on Optimism on Uniswap')
  })

  it('should return the correct title for /tokens/ethereum/<weth address>', () => {
    expect(getDefaultTokensTitle(`/tokens/ethereum/${WETH9[ChainId.MAINNET].address}`)).toBe(
      'Explore top tokens on Ethereum on Uniswap'
    )
  })
})
