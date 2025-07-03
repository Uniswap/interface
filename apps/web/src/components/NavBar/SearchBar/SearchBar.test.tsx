import { SearchBar } from 'components/NavBar/SearchBar'
import mockMediaSize from 'test-utils/mockMediaSize'
import { render, screen } from 'test-utils/render'

vi.mock('tamagui', async () => {
  const actual = await vi.importActual('tamagui')
  return {
    ...actual,
    useMedia: vi.fn(),
  }
})

vi.mock('uniswap/src/components/modals/ScrollLock', () => ({
  useUpdateScrollLock: vi.fn(),
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
