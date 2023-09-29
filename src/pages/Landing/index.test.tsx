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

  it('renders the correct information in the uk', () => {
    store.dispatch(setOriginCountry('GB'))
    mocked(useDisableNFTRoutes).mockReturnValue(false)
    const { container } = render(<Landing />)
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('NFTs')
    expect(container).toHaveTextContent('Go direct to DeFi with Uniswap')
    expect(container).toHaveTextContent('Swap and explore tokens and NFTs')
    expect(container).not.toHaveTextContent('Trade crypto and NFTs with confidence')
    expect(container).not.toHaveTextContent('Buy, sell, and explore tokens and NFTs')
    expect(container).toHaveTextContent('Trade NFTs')
    expect(container).toHaveTextContent('Explore NFTs')
    expect(container).toHaveTextContent('Buy and sell NFTs across marketplaces to find more listings at better prices.')
    expect(container).toHaveTextContent('Explore tokens on Ethereum, Polygon, Optimism and more.')
    expect(container).toHaveTextContent('Discover Tokens')
    expect(container).not.toHaveTextContent('Buy, sell, and explore tokens on Ethereum, Polygon, Optimism, and more.')
    expect(container).not.toHaveTextContent('Trade Tokens')
    expect(container).not.toHaveTextContent('Buy crypto')
    expect(container).not.toHaveTextContent('Buy crypto with your credit card or bank account at the best rates.')
  })

  it('renders the correct information when getting origin country', () => {
    store.dispatch(setOriginCountry(undefined))
    mocked(useDisableNFTRoutes).mockReturnValue(false)
    const { container } = render(<Landing />)
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('NFTs')
    expect(container).not.toHaveTextContent('Go direct to DeFi with Uniswap')
    expect(container).not.toHaveTextContent('Swap and explore tokens and NFTs')
    expect(container).not.toHaveTextContent('Trade crypto and NFTs with confidence')
    expect(container).not.toHaveTextContent('Buy, sell, and explore tokens and NFTs')
    expect(container).toHaveTextContent('Trade NFTs')
    expect(container).toHaveTextContent('Explore NFTs')
    expect(container).toHaveTextContent('Buy and sell NFTs across marketplaces to find more listings at better prices.')
    expect(container).not.toHaveTextContent('Explore tokens on Ethereum, Polygon, Optimism and more.')
    expect(container).not.toHaveTextContent('Discover Tokens')
    expect(container).not.toHaveTextContent('Buy, sell, and explore tokens on Ethereum, Polygon, Optimism, and more.')
    expect(container).not.toHaveTextContent('Trade Tokens')
    expect(container).not.toHaveTextContent('Buy crypto')
    expect(container).not.toHaveTextContent('Buy crypto with your credit card or bank account at the best rates.')
  })
})
