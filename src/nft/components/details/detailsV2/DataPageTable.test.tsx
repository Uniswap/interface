import { TEST_NFT_ASSET } from 'test-utils/nft/fixtures'
import { render } from 'test-utils/render'

import { ListingsTableContent } from './ListingsTableContent'
import { OffersTableContent } from './OffersTableContent'

it('data page offers table content loads with a given asset', () => {
  const { asFragment } = render(<OffersTableContent asset={TEST_NFT_ASSET} />)
  expect(asFragment()).toMatchSnapshot()
})

it('data page listings table content loads with a given asset', () => {
  const { asFragment } = render(<ListingsTableContent asset={TEST_NFT_ASSET} />)
  expect(asFragment()).toMatchSnapshot()
})
