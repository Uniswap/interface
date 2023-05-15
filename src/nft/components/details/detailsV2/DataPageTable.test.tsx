import { TEST_NFT_ASSET, TEST_OFFER, TEST_SELL_ORDER } from 'test-utils/nft/fixtures'
import { render } from 'test-utils/render'

import { ListingsTableContent } from './ListingsTableContent'
import { OffersTableContent } from './OffersTableContent'

it('data page offers table content loads with a given asset', () => {
  const assetWithOffer = {
    ...TEST_NFT_ASSET,
    offers: [TEST_OFFER],
  }
  const { asFragment } = render(<OffersTableContent asset={assetWithOffer} />)
  expect(asFragment()).toMatchSnapshot()
})

it('data page listings table content loads with a given asset', () => {
  const assetWithOrder = {
    ...TEST_NFT_ASSET,
    sellorders: [TEST_SELL_ORDER],
  }
  const { asFragment } = render(<ListingsTableContent asset={assetWithOrder} />)
  expect(asFragment()).toMatchSnapshot()
})
