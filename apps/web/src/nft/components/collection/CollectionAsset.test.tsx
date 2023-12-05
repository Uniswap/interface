import { UniformAspectRatios } from 'nft/types'
import { TEST_NFT_ASSET } from 'test-utils/nft/fixtures'
import { render } from 'test-utils/render'

import { CollectionAsset } from './CollectionAsset'

describe('NftCard', () => {
  it('renders correctly', () => {
    // todo: remove once zustand usage has been update such that `shallow` is no longer used
    jest.spyOn(console, 'warn').mockImplementation(jest.fn)
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
