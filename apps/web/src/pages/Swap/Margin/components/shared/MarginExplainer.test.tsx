import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarginExplainerContent } from '~/pages/Swap/Margin/components/shared/MarginExplainer'
import { render } from '~/test-utils/render'

// Render the content component directly. No margin test opens a real Tamagui tooltip — hover and
// restMs do not fire in jsdom — so the content is exported and asserted on its own, exactly as
// MarginRouteTooltipContent is.
describe('MarginExplainerContent', () => {
  it('renders the definition lines as prose, in order', () => {
    render(<MarginExplainerContent lines={['lead', 'frozen']} />)
    expect(
      screen.getByText('PnL is what your margin is worth right now, less what that margin cost you.'),
    ).toBeInTheDocument()
    // The line is split around its <highlight> run, so the term and its sentence are separate nodes.
    expect(screen.getByText('Margin at cost')).toBeInTheDocument()
    expect(screen.getByText(/doesn’t change when the price moves/)).toBeInTheDocument()
  })

  it('renders labelled rows with their values', () => {
    render(
      <MarginExplainerContent
        rows={[
          { id: 'marginAtCost', value: '$25.00' },
          { id: 'proceeds', value: '$30.66' },
          { id: 'estRealized', value: '+$5.66', tone: 'positive' },
        ]}
      />,
    )
    expect(screen.getByText('Margin at cost')).toBeInTheDocument()
    expect(screen.getByText('Proceeds')).toBeInTheDocument()
    // ASCII sign: formatSignedFiat emits '-', never U+2212.
    expect(screen.getByText('+$5.66')).toBeInTheDocument()
  })

  it('renders the realized lines, swapping the basis line for a liquidation', () => {
    const { unmount } = render(<MarginExplainerContent realized={['realizedLead', 'realizedBasis']} />)
    expect(screen.getByText(/The cost of the closing swap is in it/)).toBeInTheDocument()
    unmount()

    render(<MarginExplainerContent realized={['realizedLead', 'liquidated']} />)
    expect(screen.getByText(/the venue sold your collateral/)).toBeInTheDocument()
    expect(screen.queryByText(/The cost of the closing swap is in it/)).not.toBeInTheDocument()
  })

  it('interpolates the slippage into the estimate note', () => {
    render(<MarginExplainerContent estimate slippagePercent={0.5} />)
    expect(
      screen.getByText('An estimate. The final figure depends on the price when this transaction lands.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/up to 0.5% worse than this quote/)).toBeInTheDocument()
    expect(screen.getByText('It excludes gas.')).toBeInTheDocument()
  })

  // A debt-free close performs no swap, so promising a slippage allowance would contradict the modal,
  // which hides its own Max-slippage row in that case.
  it('drops the slippage line when there is nothing to sell', () => {
    render(<MarginExplainerContent estimate />)
    expect(screen.getByText('It excludes gas.')).toBeInTheDocument()
    expect(screen.queryByText(/worse than this quote/)).not.toBeInTheDocument()
  })

  // <highlight> is the catalog's existing emphasis tag; it must never reach the screen as literal text.
  it('promotes a highlighted term and leaves no markup behind', () => {
    render(<MarginExplainerContent lines={['roe']} />)
    expect(screen.getByText('Margin at cost')).toBeInTheDocument()
    expect(screen.queryByText(/<highlight>/)).not.toBeInTheDocument()
  })
})
