import { TEST_NFT_ASSET, TEST_SELL_ORDER } from 'test-utils/nft/fixtures'
import { render } from 'test-utils/render'

import { DataPageHeader } from './DataPageHeader'

it('Header loads with asset with no sell orders', () => {
  const { asFragment } = render(<DataPageHeader asset={TEST_NFT_ASSET} />)
  expect(asFragment()).toMatchSnapshot()
})

it('Header loads with asset with a sell order', () => {
  const assetWithOrder = {
    ...TEST_NFT_ASSET,
    sellorders: [TEST_SELL_ORDER],
  }
  const { asFragment } = render(<DataPageHeader asset={assetWithOrder} />)
  expect(asFragment()).toMatchSnapshot()
})
