import { TestID } from '@universe/test'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
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

function renderCard(withCategory = true) {
  return render(
    <CategoryHoverCard category={withCategory ? category : undefined} section={SectionName.ExploreCategoryChips}>
      <span>chip</span>
    </CategoryHoverCard>,
  )
}

describe('CategoryHoverCard', () => {
  it('renders the trigger alone when there is no category to describe', () => {
    mockHoverCardState(true)
    renderCard(false)
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

  it('logs the card press with its section, closes, and navigates to the category details page', () => {
    mockHoverCardState(true)
    renderCard()

    fireEvent.click(screen.getByTestId(TestID.CategoryDefinitionCard))

    expect(mocked(sendAnalyticsEvent).mock.calls[0]?.[1]).toEqual({
      element: ElementName.CategoryHoverCard,
      section: SectionName.ExploreCategoryChips,
      category_id: category.id,
    })
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith(`/explore/category/${category.id}`)
  })
})
