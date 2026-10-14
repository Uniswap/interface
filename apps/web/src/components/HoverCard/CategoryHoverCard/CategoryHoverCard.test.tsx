import { SharedEventName } from '@uniswap/analytics-events'
import { TestID } from '@universe/test'
import { ElementName, InterfaceEventName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { CategoryHoverCard } from '~/components/HoverCard/CategoryHoverCard/CategoryHoverCard'
import { useHoverCardState } from '~/components/HoverCard/HoverCard'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useIsTouchDevice: () => false,
}))

vi.mock('~/components/HoverCard/HoverCard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/components/HoverCard/HoverCard')>()),
  useHoverCardState: vi.fn(),
}))

const category = tokenCategory({ id: 'stablecoins', name: 'Stablecoins' })
const mockClose = vi.fn()

function mockHoverCardState(isOpen: boolean): void {
  mocked(useHoverCardState).mockReturnValue({
    isOpen,
    hasOpenIntent: isOpen,
    close: mockClose,
    onOpenChange: vi.fn(),
  })
}

const navigationState = { from: '/explore/tokens/ethereum/0x1', fromLabel: 'WBTC' }

function renderCard({
  withCategory = true,
  withNavigationState = false,
}: { withCategory?: boolean; withNavigationState?: boolean } = {}) {
  return render(
    <CategoryHoverCard
      category={withCategory ? category : undefined}
      section={SectionName.ExploreCategoryChips}
      getNavigationState={withNavigationState ? () => navigationState : undefined}
    >
      <span>chip</span>
    </CategoryHoverCard>,
  )
}

describe('CategoryHoverCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the trigger alone when there is no category to describe', () => {
    mockHoverCardState(true)
    renderCard({ withCategory: false })
    expect(screen.getByText('chip')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.CategoryDefinitionCard)).not.toBeInTheDocument()
  })

  it('renders the trigger without the card while closed', () => {
    mockHoverCardState(false)
    renderCard()
    expect(screen.getByText('chip')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.CategoryDefinitionCard)).not.toBeInTheDocument()
  })

  it('shows the definition card while open', () => {
    mockHoverCardState(true)
    renderCard()
    expect(screen.getByText(category.description)).toBeInTheDocument()
  })

  it('logs one hover-triggered definition open with its section while open', () => {
    mockHoverCardState(true)
    renderCard()

    const openCalls = mocked(sendAnalyticsEvent).mock.calls.filter(
      ([eventName]) => eventName === InterfaceEventName.CategoryDefinitionCardOpened,
    )
    expect(openCalls).toHaveLength(1)
    expect(openCalls[0]?.[1]).toEqual({
      section: SectionName.ExploreCategoryChips,
      category_id: category.id,
      trigger: 'hover',
    })
  })

  it('does not log a definition open while closed', () => {
    mockHoverCardState(false)
    renderCard()
    expect(sendAnalyticsEvent).not.toHaveBeenCalledWith(
      InterfaceEventName.CategoryDefinitionCardOpened,
      expect.anything(),
    )
  })

  it('logs the card press with its section, closes, and navigates to the category details page', () => {
    mockHoverCardState(true)
    renderCard()

    fireEvent.click(screen.getByTestId(TestID.CategoryDefinitionCard))

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CategoryHoverCard,
      section: SectionName.ExploreCategoryChips,
      category_id: category.id,
    })
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith(`/explore/category/${category.id}`, { state: undefined })
  })

  it('forwards the navigation state so the category details breadcrumb can point back to the entry point', () => {
    mockHoverCardState(true)
    renderCard({ withNavigationState: true })

    fireEvent.click(screen.getByTestId(TestID.CategoryDefinitionCard))

    expect(mockNavigate).toHaveBeenCalledWith(`/explore/category/${category.id}`, { state: navigationState })
  })
})
