import { screen } from '@testing-library/react-native'
import { UnitagInfoModal } from 'uniswap/src/features/unitags/UnitagInfoModal'
import { renderWithProviders } from 'uniswap/src/test/render'

// The bottom sheet needs native modal context jsdom can't provide; the sheet content is what's under test.
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children, isModalOpen }: { children: React.ReactNode; isModalOpen: boolean }): JSX.Element | null =>
    isModalOpen ? <>{children}</> : null,
}))

const ADDRESS = '0x4dc593ad21E4D10D0c3Df6C80AA1B4C5c9bdC7DE'
const SHORTENED = '0x4dc5...C7DE'

describe('UnitagInfoModal', () => {
  it('renders the shortened address', () => {
    renderWithProviders(<UnitagInfoModal isOpen unitagAddress={ADDRESS} onClose={vi.fn()} />)

    expect(screen.getByText(SHORTENED)).toBeDefined()
  })

  it('does not let the address wrap onto a second line', () => {
    renderWithProviders(<UnitagInfoModal isOpen unitagAddress={ADDRESS} onClose={vi.fn()} />)

    // Regression guard: the pill used to carry a fixed 128px width against a ~102px content box,
    // so the final character wrapped. The pill now has a width floor and a single-line label.
    const classes = (screen.getByText(SHORTENED) as unknown as HTMLElement).className.split(/\s+/)
    expect(classes).toContain('whitespace-nowrap')
    expect(classes).not.toContain('whitespace-pre-wrap')
  })
})
