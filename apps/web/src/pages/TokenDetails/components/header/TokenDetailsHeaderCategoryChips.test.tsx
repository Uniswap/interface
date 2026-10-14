import userEvent from '@testing-library/user-event'
import { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { TestID } from '@universe/test'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { TokenDetailsHeaderCategoryChips } from '~/pages/TokenDetails/components/header/TokenDetailsHeaderCategoryChips'
import type { TDPStoreState } from '~/pages/TokenDetails/context/createTDPStore'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
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

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: vi.fn(),
}))

const TDP_PATHNAME = '/explore/tokens/ethereum/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
const TDP_SEARCH = '?chain=base'
const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

const TOKEN_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'

function mockTokenSymbol(symbol: string | undefined): void {
  mocked(useTDPStore).mockImplementation((selector: (state: TDPStoreState) => unknown) =>
    selector({
      currency: symbol ? { symbol } : undefined,
      address: TOKEN_ADDRESS,
      currencyChainId: UniverseChainId.Mainnet,
    } as unknown as TDPStoreState),
  )
}

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
    mockTokenSymbol('WBTC')
    window.history.pushState({}, '', `${TDP_PATHNAME}${TDP_SEARCH}`)
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

  it('logs the chip click and navigates to the category details page with this token as the entry point', async () => {
    renderInHost()

    await userEvent.click(screen.getByText(SECOND.name))

    expect(mocked(sendAnalyticsEvent).mock.calls[0]?.[1]).toEqual({
      element: ElementName.TDPCollectionsChip,
      category_id: SECOND.id,
      category_index: 1,
      token_address: TOKEN_ADDRESS,
      chain_id: UniverseChainId.Mainnet,
      tags_rendered_count: CATEGORIES.length,
    })
    expect(mockNavigate).toHaveBeenCalledWith(`/explore/category/${SECOND.id}`, {
      state: { from: `${TDP_PATHNAME}${TDP_SEARCH}`, fromLabel: 'WBTC' },
    })
  })

  it('reads the entry point at click time so a chain switch after render is honored', async () => {
    renderInHost()
    const switchedPathname = '/explore/tokens/base/0x0555e30da8f98308edb960aa94c0db47230d2b9c'
    window.history.replaceState(window.history.state, '', switchedPathname)

    await userEvent.click(screen.getByText(SECOND.name))

    expect(mockNavigate).toHaveBeenCalledWith(`/explore/category/${SECOND.id}`, {
      state: { from: switchedPathname, fromLabel: 'WBTC' },
    })
  })

  it('navigates without an entry point while the token symbol is unknown', async () => {
    mockTokenSymbol(undefined)
    renderInHost()

    await userEvent.click(screen.getByText(SECOND.name))

    expect(mockNavigate).toHaveBeenCalledWith(`/explore/category/${SECOND.id}`, { state: undefined })
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
