//import { useAtomValue } from 'jotai/utils'
import { render } from 'test-utils/render'

import { SearchBarDropdown } from './SearchBarDropdown'

//jest.mock('jotai/utils')

const SearchBarDropdownProps = {
  toggleOpen: () => {},
  tokens: [],
  collections: [],
  queryText: '',
  hasInput: false,
  isLoading: false,
}

describe('disable nft on searchbar dropdown', () => {
  it('should render popular nft collections', () => {
    //render SearchBarDropdown with props defined in SearchBarDropdownProps
    const { container } = render(<SearchBarDropdown {...SearchBarDropdownProps} />)
    expect(container).toMatchSnapshot()
  })
  it('should not render popular nft collections', () => {
    //mocked(useAtomValue).mockReturnValue(true)
    const { container } = render(<SearchBarDropdown {...SearchBarDropdownProps} />)
    expect(container).toMatchSnapshot()
  })
})
