import { ViewMyNftsAsset } from 'nft/components/profile/view/ViewMyNftsAsset'
import { TEST_NFT_WALLET_ASSET } from 'test-utils/nft/fixtures'
import { act, render } from 'test-utils/render'

describe('NftCard', () => {
  it('renders correctly', async () => {
    // todo: remove once zustand usage has been update such that `shallow` is no longer used
    jest.spyOn(console, 'warn').mockImplementation(jest.fn)
    const result = await act(() => {
      return render(
        <ViewMyNftsAsset
          asset={TEST_NFT_WALLET_ASSET}
          mediaShouldBePlaying={false}
          setCurrentTokenPlayingMedia={() => undefined}
          hideDetails={false}
        />,
      )
    })
    expect(result.asFragment()).toMatchSnapshot()
  })
})
