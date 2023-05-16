import { TEST_NFT_ASSET } from 'test-utils/nft/fixtures'
import { render } from 'test-utils/render'

import { DataPage } from './DataPage'

it('data page loads with header showing', () => {
  const { asFragment } = render(<DataPage asset={TEST_NFT_ASSET} showDataHeader={true} />)
  expect(asFragment()).toMatchSnapshot()
})

it('data page loads without header showing', () => {
  const { asFragment } = render(<DataPage asset={TEST_NFT_ASSET} showDataHeader={false} />)
  expect(asFragment()).toMatchSnapshot()
})
