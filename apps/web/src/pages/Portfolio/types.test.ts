import { isPortfolioTab, PortfolioTab } from '~/pages/Portfolio/types'

describe('PortfolioTab', () => {
  it('should have correct enum values', () => {
    expect(PortfolioTab.Overview).toBe('overview')
    expect(PortfolioTab.Tokens).toBe('tokens')
    expect(PortfolioTab.Defi).toBe('defi')
    expect(PortfolioTab.Nfts).toBe('nfts')
    expect(PortfolioTab.Activity).toBe('activity')
  })
})

describe('isPortfolioTab', () => {
  it('should return true for valid portfolio tabs', () => {
    expect(isPortfolioTab('overview')).toBe(true)
    expect(isPortfolioTab('tokens')).toBe(true)
    expect(isPortfolioTab('defi')).toBe(true)
    expect(isPortfolioTab('nfts')).toBe(true)
    expect(isPortfolioTab('activity')).toBe(true)
  })

  it('should return false for invalid portfolio tabs', () => {
    expect(isPortfolioTab('invalid')).toBe(false)
    expect(isPortfolioTab('')).toBe(false)
    expect(isPortfolioTab(undefined)).toBe(false)
  })
})
