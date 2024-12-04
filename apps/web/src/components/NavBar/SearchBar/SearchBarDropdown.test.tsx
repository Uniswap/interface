import { SearchBarDropdown } from 'components/NavBar/SearchBar/SearchBarDropdown'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

jest.mock('hooks/useDisableNFTRoutes')

const SearchBarDropdownProps = {
  toggleOpen: () => void 0,
  tokens: [],
  queryText: '',
  hasInput: false,
  isLoading: false,
}

describe('load popular tokens in searchbar', () => {
  it('should render popular tokens', () => {
    mocked(useDisableNFTRoutes).mockReturnValue(false)
    const { container } = render(<SearchBarDropdown {...SearchBarDropdownProps} />)
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('Popular tokens')
  })
})
