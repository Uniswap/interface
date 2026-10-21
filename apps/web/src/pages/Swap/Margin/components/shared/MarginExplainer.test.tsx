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

  it('picks the long example, resolved to English', () => {
    render(<MarginExplainerContent lines={['exampleLong']} />)
    expect(screen.getByText(/1.5 ETH, with \$2,000 borrowed/)).toBeInTheDocument()
  })

  it('renders labelled rows with their values', () => {
    render(
      <MarginExplainerContent
        lead="unrealizedLead"
        rows={[
          { id: 'marginAtCost', value: '$25.00' },
          { id: 'marginNow', value: '$30.66' },
          { id: 'unrealized', value: '+$5.66', tone: 'positive' },
          { id: 'roe', value: '+22.65%', tone: 'positive' },
        ]}
      />,
    )
    expect(screen.getByText('Unrealized — none of this is settled until you close.')).toBeInTheDocument()
    expect(screen.getByText('Margin at cost')).toBeInTheDocument()
    expect(screen.getByText('Margin now')).toBeInTheDocument()
    expect(screen.getByText('Unrealized PnL')).toBeInTheDocument()
    expect(screen.getByText('RoE')).toBeInTheDocument()
    // ASCII sign: formatSignedFiat emits '-', never U+2212.
    expect(screen.getByText('+$5.66')).toBeInTheDocument()
    expect(screen.getByText('+22.65%')).toBeInTheDocument()
  })

  it('renders a note after the rows', () => {
    render(<MarginExplainerContent rows={[{ id: 'roe', value: '≤-100.00%' }]} notes={['floored']} />)
    expect(screen.getByText(/Capped at -100%/)).toBeInTheDocument()
  })

  it('renders each suppression reason with its own copy', () => {
    const { unmount } = render(<MarginExplainerContent suppression="untradable" lines={['lead']} />)
    expect(screen.getByText(/no single US-dollar side/)).toBeInTheDocument()
    unmount()

    render(<MarginExplainerContent suppression="noPrice" lines={['lead']} />)
    expect(screen.getByText(/usually temporary/)).toBeInTheDocument()
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

  it('sets the worked examples apart from the definition they illustrate', () => {
    const { container } = render(<MarginExplainerContent lines={['lead', 'exampleLong', 'exampleShort']} />)
    expect(screen.getByText('Long example:')).toBeInTheDocument()
    expect(screen.getByText('Short example:')).toBeInTheDocument()
    // Both examples share one ruled group that the definition line sits outside of.
    const ruled = Array.from(container.querySelectorAll('div')).filter(
      (d) =>
        d.innerHTML.includes('Long example:') &&
        d.innerHTML.includes('Short example:') &&
        !d.innerHTML.includes('PnL is what your margin'),
    )
    expect(ruled.length).toBeGreaterThan(0)
  })
})
