import { useIsTouchDevice } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { TrendingShelf } from '~/pages/Explore/trending/TrendingShelf'
import { useTrendingCarouselTokens } from '~/pages/Explore/trending/useTrendingCarouselTokens'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useIsTouchDevice: vi.fn(),
}))
vi.mock('~/pages/Explore/trending/useTrendingCarouselTokens', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Explore/trending/useTrendingCarouselTokens')>()),
  useTrendingCarouselTokens: vi.fn(),
}))
vi.mock('~/components/CategoryDefinitionCard/CategoryDefinitionSheet', () => ({
  CategoryDefinitionSheet: ({ category, isOpen }: { category: TokenCategory; isOpen: boolean }) =>
    isOpen ? <div data-testid="definition-sheet">{category.name}</div> : null,
}))
vi.mock('uniswap/src/features/tokenCategories/CategoryDefinitionTooltip', () => ({
  CategoryDefinitionTooltip: () => <div data-testid="definition-tooltip" />,
}))

const trending = tokenCategory({ id: 'trending', name: 'Trending' })

describe('TrendingShelf definition affordance', () => {
  beforeEach(() => {
    mocked(useTrendingCarouselTokens).mockReturnValue({ tokens: [], isLoading: true, trendingCategory: trending })
  })

  it('opens the definition sheet from the info icon on touch devices', () => {
    mocked(useIsTouchDevice).mockReturnValue(true)
    render(<TrendingShelf />)

    expect(screen.queryByTestId('definition-tooltip')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId(TestID.ExploreTrendingInfo))
    expect(screen.getByTestId('definition-sheet')).toHaveTextContent('Trending')
  })

  it('shows the tooltip instead of a pressable icon with a pointer', () => {
    mocked(useIsTouchDevice).mockReturnValue(false)
    render(<TrendingShelf />)

    expect(screen.getByTestId('definition-tooltip')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.ExploreTrendingInfo)).not.toBeInTheDocument()
  })
})
