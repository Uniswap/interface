import { SharedEventName } from '@uniswap/analytics-events'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { MoreCategoriesDropdown } from '~/pages/Explore/categories/MoreCategoriesDropdown'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery', () => ({
  useListCategoriesQuery: vi.fn(() => ({ data: undefined, isPlaceholderData: false })),
}))
vi.mock('~/utils/params/chainParams', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/utils/params/chainParams')>()),
  useChainIdFromUrlParam: vi.fn(),
}))
// Positioning is not under test; render the trigger, and the menu while open.
vi.mock('~/components/Dropdowns/AdaptiveDropdown', () => ({
  AdaptiveDropdown: ({ isOpen, trigger, children }: { isOpen: boolean; trigger: ReactNode; children: ReactNode }) => (
    <div>
      {trigger}
      {isOpen && children}
    </div>
  ),
}))

const MORE_POSITION = 5
const gaming = tokenCategory({ id: 'gaming', name: 'Gaming' })
const defi = tokenCategory({ id: 'defi', name: 'DeFi' })

function renderDropdown({
  selectedCategoryId = 'all',
  onSelectCategory = vi.fn(),
}: { selectedCategoryId?: string; onSelectCategory?: (id: string) => void } = {}): void {
  render(
    <MoreCategoriesDropdown
      categories={[gaming, defi]}
      selectedCategoryId={selectedCategoryId}
      position={MORE_POSITION}
      onSelectCategory={onSelectCategory}
    />,
  )
}

function openMenu(): void {
  fireEvent.click(screen.getByText('More'))
}

describe('MoreCategoriesDropdown analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs the More open with its slot, and nothing when it closes again', () => {
    renderDropdown()

    openMenu()
    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.ExploreCategoryViewMore,
      section: SectionName.ExploreCategoryChips,
      tab_position: MORE_POSITION,
    })

    openMenu()
    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('logs a pick as a category selection from the More menu, carrying the More slot', () => {
    const onSelectCategory = vi.fn()
    renderDropdown({ onSelectCategory })

    openMenu()
    fireEvent.click(screen.getByTestId(`${TestID.ExploreCategoryRowPrefix}gaming`))

    expect(sendAnalyticsEvent).toHaveBeenLastCalledWith(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.ExploreCategoryView,
      section: SectionName.ExploreCategoryChips,
      tab: 'gaming',
      category_id: 'gaming',
      is_from_more_menu: true,
      tab_position: MORE_POSITION,
    })
    expect(onSelectCategory).toHaveBeenCalledWith('gaming')
  })

  it('does not log a selection when picking the already-selected category', () => {
    const onSelectCategory = vi.fn()
    renderDropdown({ selectedCategoryId: 'gaming', onSelectCategory })

    openMenu()
    fireEvent.click(screen.getByTestId(`${TestID.ExploreCategoryRowPrefix}gaming`))

    const selectionCalls = mocked(sendAnalyticsEvent).mock.calls.filter(
      ([, properties]) => (properties as { element?: string }).element === ElementName.ExploreCategoryView,
    )
    expect(selectionCalls).toHaveLength(0)
    expect(onSelectCategory).not.toHaveBeenCalled()
  })
})

describe('MoreCategoriesDropdown network-scoped stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('scopes stats to the selected EVM network', () => {
    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.Base)
    renderDropdown()

    expect(useListCategoriesQuery).toHaveBeenCalledWith({ chainIds: [UniverseChainId.Base] })
  })

  it('reads Solana as All networks rather than requesting an unsupported scope', () => {
    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.Solana)
    renderDropdown()

    expect(useListCategoriesQuery).toHaveBeenCalledWith({ chainIds: undefined })
  })
})
