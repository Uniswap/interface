import { SearchBar } from 'components/NavBar/SearchBar'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { useIsNavSearchInputVisible } from 'nft/hooks/useIsNavSearchInputVisible'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'
import { useTranslation } from 'uniswap/src/i18n'

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
    const { t } = useTranslation()
    expect(screen.queryByPlaceholderText(t('tokens.selector.search.placeholder'))).toBeVisible()
  })
})
