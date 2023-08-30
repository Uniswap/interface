import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

import { SearchBarDropdown } from './SearchBarDropdown'

jest.mock('hooks/useDisableNFTRoutes')

const SearchBarDropdownProps = {
  toggleOpen: () => void 0,
  tokens: [],
  collections: [],
  queryText: '',
  hasInput: false,
  isLoading: false,
}

describe('disable nft on searchbar dropdown', () => {
  it('should render popular nft collections', () => {
    mocked(useDisableNFTRoutes).mockReturnValue(false)
    const { container } = render(<SearchBarDropdown {...SearchBarDropdownProps} />)
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('Popular NFT collections')
  })
  it('should not render popular nft collections', () => {
    mocked(useDisableNFTRoutes).mockReturnValue(true)
    const { container } = render(<SearchBarDropdown {...SearchBarDropdownProps} />)
    expect(container).toMatchSnapshot()
    expect(container).not.toHaveTextContent('Popular NFT collections')
    expect(container).not.toHaveTextContent('NFT')
  })
})
