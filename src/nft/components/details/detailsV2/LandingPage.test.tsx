import { TEST_NFT_ASSET, TEST_NFT_COLLECTION_INFO_FOR_ASSET } from 'test-utils/nft/fixtures'
import { render } from 'test-utils/render'

import { LandingPage } from './LandingPage'

beforeEach(() => {
  // IntersectionObserver isn't available in test environment
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  })
  window.IntersectionObserver = mockIntersectionObserver
})

describe('LandingPage', () => {
  const mockSetShowDataHeader = jest.fn()
  it('renders it correctly', () => {
    const { asFragment } = render(
      <LandingPage
        asset={TEST_NFT_ASSET}
        collection={TEST_NFT_COLLECTION_INFO_FOR_ASSET}
        setShowDataHeader={mockSetShowDataHeader}
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
