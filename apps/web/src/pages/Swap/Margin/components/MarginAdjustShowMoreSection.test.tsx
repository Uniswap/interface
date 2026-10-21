import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MarginAdjustShowMoreSection } from '~/pages/Swap/Margin/components/MarginAdjustShowMoreSection'
import { render } from '~/test-utils/render'

const BASE = { onToggle: vi.fn(), slippageToleranceBps: 50 }

describe('MarginAdjustShowMoreSection', () => {
  it('keeps the extra rows hidden until expanded', () => {
    render(<MarginAdjustShowMoreSection {...BASE} isExpanded={false} extraRows={<div>Borrowing row</div>} />)
    expect(screen.queryByText('Borrowing row')).not.toBeInTheDocument()
  })

  it('shows the extra rows alongside max slippage once expanded', () => {
    render(<MarginAdjustShowMoreSection {...BASE} isExpanded extraRows={<div>Borrowing row</div>} />)
    expect(screen.getByText('Borrowing row')).toBeInTheDocument()
    expect(screen.getByText('Max slippage')).toBeInTheDocument()
  })

  it('renders max slippage with no extra rows supplied', () => {
    render(<MarginAdjustShowMoreSection {...BASE} isExpanded />)
    expect(screen.getByText('Max slippage')).toBeInTheDocument()
    expect(screen.queryByTestId('margin-show-more-quote-rows')).not.toBeInTheDocument()
  })

  // Slippage is a user setting, not a quote figure — it must never read as stale.
  // The two-swap route compounds the per-leg tolerance to (1+s)²−1. This is the only test on that
  // number, and the branches format differently — toFixed(2) vs the raw percent.
  it('compounds max slippage when the route carries two swap legs', () => {
    render(<MarginAdjustShowMoreSection {...BASE} isExpanded compoundsSlippage />)
    expect(screen.getByText('1.00%')).toBeInTheDocument()
  })

  it('shows the single-leg tolerance when it does not', () => {
    render(<MarginAdjustShowMoreSection {...BASE} isExpanded />)
    expect(screen.getByText('0.5%')).toBeInTheDocument()
  })

  it('dims what came off the quote, never max slippage', () => {
    render(<MarginAdjustShowMoreSection {...BASE} isExpanded dim extraRows={<div>Borrowing row</div>} />)
    const dimmed = screen.getByTestId('margin-show-more-quote-rows')
    expect(dimmed).toContainElement(screen.getByText('Borrowing row'))
    expect(dimmed).not.toContainElement(screen.getByText('Max slippage'))
  })

  it('shows the network cost only when the quote carries a gas estimate', () => {
    const withGas = render(<MarginAdjustShowMoreSection {...BASE} isExpanded gasDisplay="$1.24" />)
    expect(screen.getByText('Network cost')).toBeInTheDocument()
    expect(screen.getByText('$1.24')).toBeInTheDocument()
    withGas.unmount()

    render(<MarginAdjustShowMoreSection {...BASE} isExpanded />)
    expect(screen.queryByText('Network cost')).not.toBeInTheDocument()
  })
})
