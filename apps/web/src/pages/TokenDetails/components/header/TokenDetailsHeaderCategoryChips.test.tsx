import userEvent from '@testing-library/user-event'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { TestID } from '@universe/test'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { TokenDetailsHeaderCategoryChips } from '~/pages/TokenDetails/components/header/TokenDetailsHeaderCategoryChips'
import { useTDPTokenCategories } from '~/pages/TokenDetails/hooks/useTDPTokenCategories'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/hooks/useTDPTokenCategories', () => ({
  useTDPTokenCategories: vi.fn(),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

const FIRST = tokenCategory({ id: 'trending', name: 'Trending' })
const SECOND = tokenCategory({ id: 'stablecoins', name: 'Stablecoins' })
const THIRD = tokenCategory({ id: 'defi', name: 'DeFi' })
const CATEGORIES = [FIRST, SECOND, THIRD]

const HOST = 'chips-host'
function renderInHost(): HTMLElement {
  render(
    <div data-testid={HOST}>
      <TokenDetailsHeaderCategoryChips />
    </div>,
  )
  return screen.getByTestId(HOST)
}

describe('TokenDetailsHeaderCategoryChips', () => {
  beforeEach(() => {
    mocked(useIsTokenCategoriesEnabled).mockReturnValue(true)
    mocked(useTDPTokenCategories).mockReturnValue({ categories: CATEGORIES, isLoading: false })
  })

  it('renders one chip per category in the given order', () => {
    renderInHost()

    expect(screen.getByTestId(TestID.TokenDetailsCollections)).toHaveTextContent(
      CATEGORIES.map((category) => category.name).join(''),
    )
  })

  it('renders each chip as a link so modifier clicks open the category details page natively', () => {
    renderInHost()

    expect(screen.getByText(SECOND.name).closest('a')).toHaveAttribute('href', `/explore/category/${SECOND.id}`)
  })

  it('logs the chip click and navigates to the category details page', async () => {
    renderInHost()

    await userEvent.click(screen.getByText(SECOND.name))

    expect(mocked(sendAnalyticsEvent).mock.calls[0]?.[1]).toEqual({
      element: ElementName.TDPCollectionsChip,
      category_id: SECOND.id,
      category_index: 1,
    })
    expect(mockNavigate).toHaveBeenCalledWith(`/explore/category/${SECOND.id}`)
  })

  it('renders nothing when the token categories flag is off', () => {
    mocked(useIsTokenCategoriesEnabled).mockReturnValue(false)

    expect(renderInHost()).toBeEmptyDOMElement()
  })

  it('renders nothing for a token with no categories', () => {
    mocked(useTDPTokenCategories).mockReturnValue({ categories: [], isLoading: false })

    expect(renderInHost()).toBeEmptyDOMElement()
  })

  it('reserves the row with a skeleton while categories are still resolving', () => {
    mocked(useTDPTokenCategories).mockReturnValue({ categories: [], isLoading: true })

    renderInHost()

    expect(screen.getByTestId(TestID.TokenDetailsCollections)).toBeInTheDocument()
    expect(screen.queryByText(FIRST.name)).not.toBeInTheDocument()
  })
})
