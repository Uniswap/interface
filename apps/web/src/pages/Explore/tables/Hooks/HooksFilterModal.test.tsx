import { EMPTY_HOOK_FILTER_STATE } from '~/features/Hooks/hookFilters'
import { HooksFilterModal } from '~/pages/Explore/tables/Hooks/HooksFilterModal'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { render, screen, within } from '~/test-utils/render'

vi.unmock('uniswap/src/components/modals/Modal')
vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()),
  useMedia: vi.fn(),
}))

describe('HooksFilterModal', () => {
  it.each(['xxxl', 'md'] as const)('keeps its visible title as the dialog name at the %s breakpoint', async (size) => {
    mockMediaSize(size)

    render(
      <HooksFilterModal
        isOpen
        onClose={vi.fn()}
        filters={EMPTY_HOOK_FILTER_STATE}
        onChange={vi.fn()}
        onClearAll={vi.fn()}
        onApply={vi.fn()}
      />,
    )

    const dialog = await screen.findByRole('dialog', { name: 'Filters' })
    const title = within(dialog).getByRole('heading', { name: 'Filters' })
    expect(dialog).toHaveAttribute('aria-labelledby', title.id)
    expect(dialog.querySelector('[data-sheet-handle]') !== null).toBe(size === 'md')
  })
})
