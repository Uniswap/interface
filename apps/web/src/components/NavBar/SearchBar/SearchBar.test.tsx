import { SearchBar } from 'components/NavBar/SearchBar'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { useTranslation } from 'i18n/useTranslation'
import { useIsNavSearchInputVisible } from 'nft/hooks/useIsNavSearchInputVisible'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

jest.mock('hooks/useDisableNFTRoutes')
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

  it('should render text with nfts', () => {
    mocked(useDisableNFTRoutes).mockReturnValue(false)
    const { container } = render(<SearchBar />)
    expect(container).toMatchSnapshot()
    const { t } = useTranslation()
    expect(screen.queryByPlaceholderText(t('common.searchTokensNFT'))).toBeVisible()
  })
  it('should render text without nfts', () => {
    mocked(useDisableNFTRoutes).mockReturnValue(true)
    const { container } = render(<SearchBar />)
    expect(container).toMatchSnapshot()
    const { t } = useTranslation()
    expect(screen.queryByPlaceholderText(t('common.searchTokens'))).toBeVisible()
  })
})
