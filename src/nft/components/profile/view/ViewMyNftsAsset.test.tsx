import { TEST_NFT_WALLET_ASSET } from 'test-utils/nft/fixtures'
import { render } from 'test-utils/render'

import { ViewMyNftsAsset } from './ViewMyNftsAsset'

describe('NftCard', () => {
  it('renders correctly', () => {
    const { asFragment } = render(
      <ViewMyNftsAsset
        asset={TEST_NFT_WALLET_ASSET}
        mediaShouldBePlaying={false}
        setCurrentTokenPlayingMedia={() => undefined}
        hideDetails={false}
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
