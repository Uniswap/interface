import { TEST_NFT_ASSET, TEST_NFT_COLLECTION_INFO_FOR_ASSET } from 'test-utils/nft/fixtures'
import { render } from 'test-utils/render'

import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('renders it correctly', () => {
    const { asFragment } = render(
      <LandingPage asset={TEST_NFT_ASSET} collection={TEST_NFT_COLLECTION_INFO_FOR_ASSET} />
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
