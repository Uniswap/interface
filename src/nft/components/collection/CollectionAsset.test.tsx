import { UniformAspectRatios } from 'nft/types'
import { TEST_NFT_ASSET } from 'test-utils/nft/fixtures'
import { render } from 'test-utils/render'

import { CollectionAsset } from './CollectionAsset'

describe('NftCard', () => {
  it('renders correctly', () => {
    const { asFragment } = render(
      <CollectionAsset
        asset={TEST_NFT_ASSET}
        isMobile={false}
        mediaShouldBePlaying={false}
        setCurrentTokenPlayingMedia={() => undefined}
        uniformAspectRatio={UniformAspectRatios.square}
        setUniformAspectRatio={() => undefined}
        setRenderedHeight={() => undefined}
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
