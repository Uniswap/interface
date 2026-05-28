import { SearchBar } from 'components/NavBar/SearchBar'
import mockMediaSize from 'test-utils/mockMediaSize'
import { render, screen } from 'test-utils/render'

jest.mock('tamagui', () => ({
  ...jest.requireActual('tamagui'),
  useMedia: jest.fn(),
}))

describe('disable nft on searchbar', () => {
  beforeEach(() => {
    mockMediaSize('xxl')
  })

  it('should render searchbar on larger screen', () => {
    const { container } = render(<SearchBar />)
    expect(container).toMatchSnapshot()
    const input = screen.getByTestId('nav-search-input')
    expect(input).toBeInTheDocument()
  })
})
