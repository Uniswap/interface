import { getCategoryPileLogos } from 'uniswap/src/features/tokenCategories/getCategoryPileLogos'
import { poolCategory, poolCategoryTopPool } from 'uniswap/src/test/fixtures/poolCategory'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'

// Three products from one issuer share a logo; the groups are what distinguish them.
const topTokens = [
  { chainId: 1, address: '0x1', symbol: 'NVDAon', logoUrl: 'https://logos.test/robinhood.png' },
  { chainId: 1, address: '0x2', symbol: 'SPCXon', logoUrl: 'https://logos.test/robinhood.png' },
]
const topGroups = [
  { id: 'nvda', displayName: 'Nvidia', ticker: 'NVDA', logoUrl: 'https://logos.test/nvda.png' },
  { id: 'spcx', displayName: 'SpaceX', ticker: 'SPCX', logoUrl: 'https://logos.test/spcx.png' },
]

describe(getCategoryPileLogos, () => {
  it('piles the top groups over the top tokens when served', () => {
    expect(getCategoryPileLogos(tokenCategory({ grouped: true, topTokens, topGroups }))).toEqual([
      { key: 'nvda', name: 'Nvidia', symbol: 'NVDA', logoUrl: 'https://logos.test/nvda.png' },
      { key: 'spcx', name: 'SpaceX', symbol: 'SPCX', logoUrl: 'https://logos.test/spcx.png' },
    ])
  })

  it('piles the top tokens when the category has no groups', () => {
    expect(getCategoryPileLogos(tokenCategory({ topTokens }))).toEqual([
      { key: '1-0x1', name: 'NVDAon', symbol: 'NVDAon', logoUrl: 'https://logos.test/robinhood.png' },
      { key: '1-0x2', name: 'SPCXon', symbol: 'SPCXon', logoUrl: 'https://logos.test/robinhood.png' },
    ])
  })

  it('is empty when the category has neither', () => {
    expect(getCategoryPileLogos(tokenCategory())).toEqual([])
  })

  it('piles each top pool as a pair, in pool order', () => {
    const topPools = [
      poolCategoryTopPool({
        chainId: 1,
        poolId: '0xa',
        token0Symbol: 'ETH',
        token0LogoUrl: 'https://logos.test/eth.png',
        token1Symbol: 'USDC',
        token1LogoUrl: 'https://logos.test/usdc.png',
      }),
      poolCategoryTopPool({
        chainId: 8453,
        poolId: '0xb',
        token0Symbol: 'ETH',
        token0LogoUrl: 'https://logos.test/eth.png',
        token1Symbol: 'WBTC',
        token1LogoUrl: 'https://logos.test/wbtc.png',
      }),
    ]
    expect(getCategoryPileLogos(poolCategory({ topPools }))).toEqual([
      {
        key: '1-0xa',
        token0: { key: 'ETH', name: 'ETH', symbol: 'ETH', logoUrl: 'https://logos.test/eth.png' },
        token1: { key: 'USDC', name: 'USDC', symbol: 'USDC', logoUrl: 'https://logos.test/usdc.png' },
      },
      {
        key: '8453-0xb',
        token0: { key: 'ETH', name: 'ETH', symbol: 'ETH', logoUrl: 'https://logos.test/eth.png' },
        token1: { key: 'WBTC', name: 'WBTC', symbol: 'WBTC', logoUrl: 'https://logos.test/wbtc.png' },
      },
    ])
  })
})
