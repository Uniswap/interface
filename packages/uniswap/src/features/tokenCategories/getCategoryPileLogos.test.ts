import { getCategoryPileLogos } from 'uniswap/src/features/tokenCategories/getCategoryPileLogos'
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
})
