import { SearchBar } from 'components/NavBar/SearchBar'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'
import { useMedia } from 'ui/src'

jest.mock('tamagui', () => ({
  ...jest.requireActual('tamagui'),
  useMedia: jest.fn(),
}))

describe('disable nft on searchbar', () => {
  beforeEach(() => {
    mocked(useMedia).mockReturnValue({
      xxs: false,
      xs: false,
      sm: false,
      md: false,
      lg: false,
      xl: false,
      xxl: true,
      xxxl: true,
      short: false,
      midHeight: false,
    })
  })

  it('should render searchbar on larger screen', () => {
    const { container } = render(<SearchBar />)
    expect(container).toMatchSnapshot()
    const input = screen.getByTestId('nav-search-input')
    expect(input).toBeInTheDocument()
  })
})
