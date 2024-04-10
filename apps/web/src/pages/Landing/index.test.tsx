import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

import { useNewLandingPage } from 'featureFlags/flags/landingPageV2'
import Landing from '.'

jest.mock('hooks/useDisableNFTRoutes')
jest.mock('featureFlags/flags/landingPageV2')

describe('disable nft on landing page', () => {
  it('renders nft information and card', () => {
    mocked(useDisableNFTRoutes).mockReturnValue(false)
    mocked(useNewLandingPage).mockReturnValue(false)
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
    mocked(useNewLandingPage).mockReturnValue(false)
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

describe('Uniswap wallet app download link', () => {
  it('renders onelink app download', () => {
    mocked(useNewLandingPage).mockReturnValue(false)
    const { container } = render(<Landing />)
    expect(container.innerHTML.includes('https://uniswapwallet.onelink.me/8q3y/79gveilz')).toBeTruthy()
  })
})
