import { Markets } from 'nft/types'

import { getMarketplaceIcon } from './asset'

describe('Marketplace icons', () => {
  it('all of marketplaces returns a reactnode', () => {
    Object.keys(Markets).forEach((marketplace) => {
      expect(getMarketplaceIcon(marketplace)).toBeDefined()
    })
  })
})
