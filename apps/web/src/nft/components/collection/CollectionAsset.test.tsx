import { CollectionAsset } from 'nft/components/collection/CollectionAsset'
import { UniformAspectRatios } from 'nft/types'
import { act } from 'react'
import { TEST_NFT_ASSET } from 'test-utils/nft/fixtures'
import { render } from 'test-utils/render'

describe('NftCard', () => {
  it('renders correctly', async () => {
    // todo: remove once zustand usage has been update such that `shallow` is no longer used
    jest.spyOn(console, 'warn').mockImplementation(jest.fn)
    const result = await act(async () => {
      return render(
        <CollectionAsset
          asset={TEST_NFT_ASSET}
          isMobile={false}
          mediaShouldBePlaying={false}
          setCurrentTokenPlayingMedia={() => undefined}
          uniformAspectRatio={UniformAspectRatios.square}
          setUniformAspectRatio={() => undefined}
          setRenderedHeight={() => undefined}
        />,
      )
    })
    expect(result.asFragment()).toMatchSnapshot()
  })
})
