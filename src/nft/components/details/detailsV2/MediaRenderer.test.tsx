import {
  TEST_AUDIO_NFT_ASSET,
  TEST_EMBEDDED_NFT_ASSET,
  TEST_NFT_ASSET,
  TEST_VIDEO_NFT_ASSET,
} from 'test-utils/nft/fixtures'
import { render } from 'test-utils/render'

import { MediaRenderer } from './MediaRenderer'

describe('Media renderer', () => {
  it('renders image nft correctly', () => {
    const { asFragment } = render(<MediaRenderer asset={TEST_NFT_ASSET} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders an embedded nft correctly', () => {
    const { asFragment } = render(<MediaRenderer asset={TEST_EMBEDDED_NFT_ASSET} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders a video nft correctly', () => {
    const { asFragment } = render(<MediaRenderer asset={TEST_VIDEO_NFT_ASSET} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders an audio nft correctly', () => {
    const { asFragment } = render(<MediaRenderer asset={TEST_AUDIO_NFT_ASSET} />)
    expect(asFragment()).toMatchSnapshot()
  })
})
