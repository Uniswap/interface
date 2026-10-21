import { fireEvent, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { MarginChartGlossaryModal } from '~/pages/Swap/Margin/chart/MarginChartGlossaryModal'
import { render } from '~/test-utils/render'

// The real Modal portals; honor isModalOpen so a closed glossary is genuinely absent from the tree.
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children, isModalOpen }: { children: ReactNode; isModalOpen?: boolean }) =>
    isModalOpen ? <>{children}</> : null,
}))

describe('MarginChartGlossaryModal', () => {
  it('explains every chart overlay under its own heading', () => {
    render(<MarginChartGlossaryModal isOpen leverage="3x" onClose={vi.fn()} />)

    expect(screen.getByText('What’s on this chart')).toBeInTheDocument()
    expect(screen.getByText('Chart lines')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByText('Entry (3x)')).toBeInTheDocument()
    expect(screen.getByText('Liquidation zone')).toBeInTheDocument()
    expect(screen.getByText('Break-even')).toBeInTheDocument()
    expect(screen.getByText('Order preview lines')).toBeInTheDocument()
    expect(screen.getByText('Event markers')).toBeInTheDocument()
  })

  it('interpolates the live leverage into the entry row', () => {
    render(<MarginChartGlossaryModal isOpen leverage="3x" onClose={vi.fn()} />)
    expect(screen.getByText(/The price you opened at, at 3x leverage/)).toBeInTheDocument()
  })

  it('falls back to an em dash when there is no position to read leverage from', () => {
    render(<MarginChartGlossaryModal isOpen onClose={vi.fn()} />)
    expect(screen.getByText(/The price you opened at, at — leverage/)).toBeInTheDocument()
  })

  it('teaches how PnL works beside the lines', () => {
    render(<MarginChartGlossaryModal isOpen leverage="3x" onClose={vi.fn()} />)

    expect(screen.getByText('How PnL works')).toBeInTheDocument()
    expect(
      screen.getByText('PnL is what your margin is worth right now, less what that margin cost you.'),
    ).toBeInTheDocument()
  })

  it('closes from the header ✕', () => {
    const onClose = vi.fn()
    render(<MarginChartGlossaryModal isOpen leverage="3x" onClose={onClose} />)

    fireEvent.click(screen.getByTestId(TestID.MarginChartGlossaryClose))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
