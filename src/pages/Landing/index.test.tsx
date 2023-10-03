import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import store from 'state'
import { setOriginCountry } from 'state/user/reducer'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

import Landing from '.'

jest.mock('hooks/useDisableNFTRoutes')

describe('disable nft on landing page', () => {
  beforeAll(() => {
    store.dispatch(setOriginCountry('US'))
  })

  it('renders nft information and card', () => {
    mocked(useDisableNFTRoutes).mockReturnValue(false)
    const { container } = render(<Landing />)
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('NFTs')
    expect(container).toHaveTextContent('Trade crypto and NFTs with confidence')
    expect(container).toHaveTextContent('Buy, sell, and explore tokens and NFTs')
    expect(container).toHaveTextContent('Trade NFTs')
    expect(container).toHaveTextContent('Explore NFTs')
    expect(container).toHaveTextContent('Buy and sell NFTs across marketplaces to find more listings at better prices.')
  })

  it('does not render nft information and card', () => {
    mocked(useDisableNFTRoutes).mockReturnValue(true)
    const { container } = render(<Landing />)
    expect(container).toMatchSnapshot()
    expect(container).not.toHaveTextContent('NFTs')
    expect(container).not.toHaveTextContent('NFT')
    expect(container).toHaveTextContent('Trade crypto with confidence')
    expect(container).toHaveTextContent('Buy, sell, and explore tokens')
    expect(container).not.toHaveTextContent('Trade NFTs')
    expect(container).not.toHaveTextContent('Explore NFTs')
    expect(container).not.toHaveTextContent(
      'Buy and sell NFTs across marketplaces to find more listings at better prices.'
    )
  })
})
