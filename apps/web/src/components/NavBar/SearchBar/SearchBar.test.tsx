import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { TestID } from '@universe/test'
import { SearchBar } from '~/components/NavBar/SearchBar'
import { mocked } from '~/test-utils/mocked'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return {
    ...actual,
    useMedia: vi.fn(),
  }
})

vi.mock('~/components/NavBar/SearchBar/SearchModal', () => ({
  SearchModal: () => null,
}))

// Scoped queries instead of a blanket `matches: visible`: only the search-bar visibility
// breakpoint should track `visible`, not every media query in the render tree.
// The dark-scheme leg stays true because the committed snapshot was recorded under it.
const SEARCH_BAR_VISIBLE_QUERY = '(min-width: 1560px)'
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

function mockSearchBarVisible(visible: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: (query === SEARCH_BAR_VISIBLE_QUERY && visible) || query === DARK_SCHEME_QUERY,
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

  it.each([true, false])('uses the Uniswap placeholder when auction search enabled is %s', (isEnabled) => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.AuctionSearch && isEnabled)

    render(<SearchBar />)

    expect(screen.getByText('Search Uniswap')).toBeInTheDocument()
  })
})
