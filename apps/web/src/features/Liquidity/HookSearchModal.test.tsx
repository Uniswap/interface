import { HookSearchModal } from '~/features/Liquidity/HookSearchModal'
import { render, screen } from '~/test-utils/render'

const mockUseMedia = vi.fn()

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()),
  useMedia: () => mockUseMedia(),
}))

// The real Modal is a Radix dialog / bottom sheet; render straight through like the other modal specs.
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children, isModalOpen }: { children: React.ReactNode; isModalOpen: boolean }) =>
    isModalOpen ? <div>{children}</div> : null,
}))

function renderModal(): HTMLElement {
  render(<HookSearchModal isOpen onClose={vi.fn()} onSelectHook={vi.fn()} onSelectAddress={vi.fn()} />)
  return screen.getByPlaceholderText('Search by name or address')
}

describe('HookSearchModal', () => {
  it('focuses the search input on open on larger screens', () => {
    mockUseMedia.mockReturnValue({ sm: false })

    expect(renderModal()).toHaveFocus()
  })

  it('does not focus the search input on open on small screens, so the mobile keyboard stays closed', () => {
    mockUseMedia.mockReturnValue({ sm: true })

    const input = renderModal()
    expect(input).toBeInTheDocument()
    expect(input).not.toHaveFocus()
  })
})
