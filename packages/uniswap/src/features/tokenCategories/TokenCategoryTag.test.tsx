import { SharedEventName } from '@uniswap/analytics-events'
import { ElementName, InterfacePageName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TokenCategoryTag } from 'uniswap/src/features/tokenCategories/TokenCategoryTag'
import { TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { mockUniswapContext } from 'uniswap/src/test/render'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
vi.mock('utilities/src/telemetry/trace/TraceContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('utilities/src/telemetry/trace/TraceContext')>()),
  useTrace: () => ({
    page: InterfacePageName.ExplorePage,
    section: SectionName.NavbarSearch,
    element: ElementName.TokensTableRow,
  }),
}))

describe('TokenCategoryTag', () => {
  it('renders the category name', () => {
    const category = tokenCategory({ id: 'stocks', name: 'Stocks', categoryClass: TokenCategoryClass.Asset })
    const { queryByText } = render(<TokenCategoryTag category={category} />)
    expect(queryByText('Stocks')).not.toBeNull()
  })

  it('renders the localized name as-is', () => {
    const category = tokenCategory({ id: 'stocks', name: 'Acciones', categoryClass: TokenCategoryClass.Asset })
    const { queryByText } = render(<TokenCategoryTag category={category} />)
    expect(queryByText('Acciones')).not.toBeNull()
  })

  it('renders a text-only pill (no icon) for any category', () => {
    const category = tokenCategory({ id: 'gaming', name: 'Gaming', categoryClass: TokenCategoryClass.Sector })
    const { queryByText, queryByTestId } = render(<TokenCategoryTag category={category} />)
    expect(queryByText('Gaming')).not.toBeNull()
    expect(queryByTestId('token-category-tag-icon')).toBeNull()
  })

  it('opens the category detail page on press', () => {
    const category = tokenCategory({ id: 'defi', name: 'DeFi', categoryClass: TokenCategoryClass.Sector })
    const { getByText } = render(<TokenCategoryTag category={category} />)
    fireEvent.press(getByText('DeFi'))
    expect(mockUniswapContext.navigateToCategoryDetails).toHaveBeenCalledWith({ categoryId: 'defi' })
  })

  it('logs the press with the enclosing surface and its own element', () => {
    const category = tokenCategory({ id: 'defi', name: 'DeFi', categoryClass: TokenCategoryClass.Sector })
    const { getByText } = render(<TokenCategoryTag category={category} />)
    fireEvent.press(getByText('DeFi'))
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SharedEventName.ELEMENT_CLICKED, {
      page: InterfacePageName.ExplorePage,
      section: SectionName.NavbarSearch,
      element: ElementName.TokenRowCategoryTag,
      category_id: 'defi',
    })
  })
})
