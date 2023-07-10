import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { useIsMobile, useIsTablet } from 'nft/hooks'
import { useIsNavSearchInputVisible } from 'nft/hooks/useIsNavSearchInputVisible'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

import { SearchBar } from './SearchBar'

jest.mock('hooks/useDisableNFTRoutes')
jest.mock('nft/hooks')
jest.mock('nft/hooks/useIsNavSearchInputVisible')

describe('disable nft on searchbar', () => {
  beforeEach(() => {
    mocked(useIsMobile).mockReturnValue(false)
    mocked(useIsTablet).mockReturnValue(false)
    mocked(useIsNavSearchInputVisible).mockReturnValue(true)
  })

  it('should render text with nfts', () => {
    mocked(useDisableNFTRoutes).mockReturnValue(false)
    const { container } = render(<SearchBar />)
    expect(container).toMatchSnapshot()
    expect(screen.queryByPlaceholderText('Search tokens and NFT collections')).toBeVisible()
  })
  it('should render text without nfts', () => {
    mocked(useDisableNFTRoutes).mockReturnValue(true)
    const { container } = render(<SearchBar />)
    expect(container).toMatchSnapshot()
    expect(screen.queryByPlaceholderText('Search tokens')).toBeVisible()
  })
})
