import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarginActionFooterMessage } from '~/pages/Swap/Margin/components/shared/MarginActionFooterMessage'
import { render } from '~/test-utils/render'

// The component's whole job is choosing ONE line from a priority chain, so the chain is what needs
// pinning: every tier can be true at once, and only the order decides what the user reads.
const NONE = { isPlanInFlight: false, marginUnpriceable: false, insufficientBalance: false, overMax: false }

describe('MarginActionFooterMessage', () => {
  it('says nothing when there is nothing to say', () => {
    const { container } = render(<MarginActionFooterMessage {...NONE} />)
    expect(container.textContent).toBe('')
  })

  it('reports a plan already in flight above everything else', () => {
    render(<MarginActionFooterMessage {...NONE} isPlanInFlight marginUnpriceable insufficientBalance overMax />)
    expect(screen.getByText(/already in progress|in flight|in progress/i)).toBeInTheDocument()
  })

  // Above the two funding errors on purpose: both of those describe a delta this state can never
  // produce, since the sheet suppresses its margin field and derives no funding at all.
  it('reports an unpriceable margin above the funding errors', () => {
    render(<MarginActionFooterMessage {...NONE} marginUnpriceable insufficientBalance overMax paymentSymbol="USDC" />)
    expect(screen.getByText(/margin can’t be added or taken out/)).toBeInTheDocument()
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

  // Defaulted rather than required: Change leverage has no margin field, so it never passes one.
  it('treats an omitted marginUnpriceable as false', () => {
    const { container } = render(
      <MarginActionFooterMessage isPlanInFlight={false} insufficientBalance={false} overMax={false} />,
    )
    expect(container.textContent).toBe('')
  })
})
