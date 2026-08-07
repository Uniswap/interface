import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { SearchBar } from '~/components/NavBar/SearchBar'
import { mocked } from '~/test-utils/mocked'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { render, screen } from '~/test-utils/render'

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

function mockSearchBarVisible(visible: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: visible,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList,
  )
}

describe('disable nft on searchbar', () => {
  beforeEach(() => {
    mockMediaSize('xxxl')
    mockSearchBarVisible(true)
  })

  it('should render searchbar on larger screen', () => {
    const { container } = render(<SearchBar />)
    expect(container).toMatchSnapshot()
    const input = screen.getByTestId(TestID.NavSearchInput)
    expect(input).toBeInTheDocument()
  })

  it('includes auctions in the placeholder when auction search is enabled', () => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.AuctionSearch)

    render(<SearchBar />)

    expect(screen.getByText('Search tokens, pools, wallets and auctions')).toBeInTheDocument()
  })

  it('keeps the existing placeholder when auction search is disabled', () => {
    render(<SearchBar />)

    expect(screen.getByText('Search tokens, pools, and wallets')).toBeInTheDocument()
  })
})
