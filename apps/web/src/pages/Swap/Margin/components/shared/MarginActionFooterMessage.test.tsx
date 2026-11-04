import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarginActionFooterMessage } from '~/pages/Swap/Margin/components/shared/MarginActionFooterMessage'
import { render } from '~/test-utils/render'

// The component's whole job is choosing ONE line from a priority chain, so the chain is what needs
// pinning: every tier can be true at once, and only the order decides what the user reads.
const NONE = { isPlanInFlight: false, insufficientBalance: false, overMax: false }

describe('MarginActionFooterMessage', () => {
  it('says nothing when there is nothing to say', () => {
    const { container } = render(<MarginActionFooterMessage {...NONE} />)
    expect(container.textContent).toBe('')
  })

  it('reports a plan already in flight above everything else', () => {
    render(<MarginActionFooterMessage {...NONE} isPlanInFlight insufficientBalance overMax />)
    expect(screen.getByText(/already in progress|in flight|in progress/i)).toBeInTheDocument()
  })

  it('reports insufficient balance above the over-max bound', () => {
    render(<MarginActionFooterMessage {...NONE} insufficientBalance overMax paymentSymbol="USDC" />)
    expect(screen.getByText(/USDC/)).toBeInTheDocument()
    expect(screen.queryByText(/exceeds the available maximum/)).not.toBeInTheDocument()
  })

  it('reports the over-max bound on its own', () => {
    render(<MarginActionFooterMessage {...NONE} overMax />)
    expect(screen.getByText(/exceeds the available maximum/)).toBeInTheDocument()
  })
})
