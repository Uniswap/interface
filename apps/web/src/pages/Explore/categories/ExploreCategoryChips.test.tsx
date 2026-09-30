import { useIsTouchDevice } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import type { ExploreCategoryChipOption } from '~/pages/Explore/categories/exploreCategoryChipOptions'
import { ExploreCategoryChips } from '~/pages/Explore/categories/ExploreCategoryChips'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useIsTouchDevice: vi.fn(),
}))
vi.mock('~/components/CategoryDefinitionCard/CategoryDefinitionSheet', () => ({
  CategoryDefinitionSheet: ({ category, isOpen }: { category: TokenCategory; isOpen: boolean }) =>
    isOpen ? <div data-testid="definition-sheet">{category.name}</div> : null,
}))

const stocks = tokenCategory({ id: 'stocks', name: 'Stocks' })
const options: ExploreCategoryChipOption[] = [
  { id: 'all', label: 'All' },
  { id: 'stocks', label: 'Stocks', category: stocks },
  { id: 'etfs', label: 'ETFs', category: tokenCategory({ id: 'etfs', name: 'ETFs' }) },
]

function renderChips({ value, onChange = vi.fn() }: { value: string; onChange?: (id: string) => void }): void {
  render(<ExploreCategoryChips options={options} value={value} onChange={onChange} />)
}

function visibleInfoIcons(): HTMLElement[] {
  return screen
    .queryAllByTestId(TestID.ExploreCategoryChipInfo)
    .filter((el) => el.getAttribute('aria-hidden') !== 'true')
}

describe('ExploreCategoryChips on touch devices', () => {
  beforeEach(() => {
    mocked(useIsTouchDevice).mockReturnValue(true)
  })

  it('shows the info icon only on the selected chip, and only when it has a category', () => {
    renderChips({ value: 'stocks' })
    expect(screen.getAllByTestId(TestID.ExploreCategoryChipInfo)).toHaveLength(2)
    expect(visibleInfoIcons()).toHaveLength(1)
    expect(visibleInfoIcons()[0]?.closest('[role="button"]')).toHaveTextContent('Stocks')
  })

  it('announces the selected chip as opening a dialog, and only that chip', () => {
    renderChips({ value: 'stocks' })
    expect(screen.getByRole('button', { name: 'Stocks' })).toHaveAttribute('aria-haspopup', 'dialog')
    expect(screen.getByRole('button', { name: 'ETFs' })).not.toHaveAttribute('aria-haspopup')
    expect(screen.getByRole('button', { name: 'All' })).not.toHaveAttribute('aria-haspopup')
  })

  it('hides every info icon when the selected chip has no category', () => {
    renderChips({ value: 'all' })
    expect(visibleInfoIcons()).toHaveLength(0)
  })

  it('opens the definition sheet from a second tap on the selected chip without changing the selection', () => {
    const onChange = vi.fn()
    renderChips({ value: 'stocks', onChange })

    fireEvent.click(screen.getByText('Stocks'))
    expect(screen.getByTestId('definition-sheet')).toHaveTextContent('Stocks')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('selects an unselected chip instead of opening the sheet', () => {
    const onChange = vi.fn()
    renderChips({ value: 'stocks', onChange })

    fireEvent.click(screen.getByText('ETFs'))
    expect(onChange).toHaveBeenCalledWith('etfs')
    expect(screen.queryByTestId('definition-sheet')).not.toBeInTheDocument()
  })
})

describe('ExploreCategoryChips with a pointer', () => {
  beforeEach(() => {
    mocked(useIsTouchDevice).mockReturnValue(false)
  })

  it('renders no info icon and keeps the selected chip inert', () => {
    const onChange = vi.fn()
    renderChips({ value: 'stocks', onChange })

    expect(screen.queryAllByTestId(TestID.ExploreCategoryChipInfo)).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Stocks' })).not.toHaveAttribute('aria-haspopup')
    fireEvent.click(screen.getByText('Stocks'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByTestId('definition-sheet')).not.toBeInTheDocument()
  })
})
