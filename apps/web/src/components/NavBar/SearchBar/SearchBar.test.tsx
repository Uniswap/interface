import { SearchBar } from 'components/NavBar/SearchBar'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
// eslint-disable-next-line no-restricted-imports
import { t } from 'i18next'
import { useIsNavSearchInputVisible } from 'nft/hooks/useIsNavSearchInputVisible'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

jest.mock('hooks/screenSize/useScreenSize')
jest.mock('nft/hooks/useIsNavSearchInputVisible')

describe('disable nft on searchbar', () => {
  beforeEach(() => {
    mocked(useScreenSize).mockReturnValue({
      xs: true,
      sm: true,
      md: true,
      lg: true,
      xl: false,
      xxl: false,
      xxxl: false,
      navSearchInputVisible: false,
      navDropdownMobileDrawer: true,
    })
    mocked(useIsNavSearchInputVisible).mockReturnValue(true)
  })

  it('should render text without nfts', () => {
    const { container } = render(<SearchBar />)
    expect(container).toMatchSnapshot()
    expect(screen.queryByPlaceholderText(t('tokens.selector.search.placeholder'))).toBeVisible()
  })
})
