import { Markets } from 'nft/types'
import { getMarketplaceIcon } from 'nft/utils/asset'

describe('Marketplace icons', () => {
  it('all of marketplaces returns an icon', () => {
    Object.keys(Markets).forEach((marketplace) => {
      expect(getMarketplaceIcon(marketplace)).not.toBeNull()
    })
  })
})
