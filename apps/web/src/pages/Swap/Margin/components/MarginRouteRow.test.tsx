import { describe, expect, it } from 'vitest'
import { MarginRouteRow, MarginRouteTooltipContent } from '~/pages/Swap/Margin/components/MarginRouteRow'
import type { MarginRouteStep } from '~/pages/Swap/Margin/marginRouteSteps'
import { render } from '~/test-utils/render'

const CROSS_CHAIN_STEPS: MarginRouteStep[] = [
  { type: 'swap', fromSymbol: 'cbBTC', toSymbol: 'USDC', chainId: 8453 },
  { type: 'bridge', symbol: 'USDC', fromChainId: 8453, toChainId: 1 },
  { type: 'swap', fromSymbol: 'USDC', toSymbol: 'WETH', chainId: 1 },
  { type: 'open', venue: 'MORPHO' },
]

describe('MarginRouteRow', () => {
  it('shows the Route label and the Uniswap API provider on the row', () => {
    const { getByText } = render(<MarginRouteRow steps={CROSS_CHAIN_STEPS} />)
    expect(getByText('Route')).toBeInTheDocument()
    expect(getByText('Uniswap API')).toBeInTheDocument()
  })

  it('does not surface route hop text on the collapsed row', () => {
    const { queryByText } = render(<MarginRouteRow steps={CROSS_CHAIN_STEPS} />)
    expect(queryByText(/Bridge USDC/)).toBeNull()
  })
})

describe('MarginRouteTooltipContent', () => {
  it('renders the provider header and every step, venue-accurately, without pool detail', () => {
    const { getByText, queryByText } = render(<MarginRouteTooltipContent steps={CROSS_CHAIN_STEPS} />)
    expect(getByText('Route via Uniswap API')).toBeInTheDocument()
    expect(getByText('Swap cbBTC to USDC on Base')).toBeInTheDocument()
    expect(getByText('Bridge USDC from Base to Ethereum')).toBeInTheDocument()
    expect(getByText('Swap USDC to WETH on Ethereum')).toBeInTheDocument()
    expect(getByText('Open position on Morpho')).toBeInTheDocument()
    expect(queryByText(/Uniswap v3/)).toBeNull()
    expect(queryByText(/%/)).toBeNull()
  })

  it('renders the venue label for Aave markets (no hardcoded Morpho)', () => {
    const { getByText } = render(<MarginRouteTooltipContent steps={[{ type: 'open', venue: 'AAVE_V3' }]} />)
    expect(getByText('Open position on Aave v3')).toBeInTheDocument()
  })
})
