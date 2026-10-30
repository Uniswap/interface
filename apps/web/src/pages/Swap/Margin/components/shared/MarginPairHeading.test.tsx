import { screen } from '@testing-library/react'
import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginPairHeading } from '~/pages/Swap/Margin/components/shared/MarginPairHeading'
import { render } from '~/test-utils/render'

// Echo the venue prop so we assert the heading wires the market's venue into the ghost;
// the venue→logo mapping itself is covered by MarginVenueLogo.test.tsx.
vi.mock('~/pages/Swap/Margin/components/MarginVenueLogo', () => ({
  MarginVenueLogo: ({ venue }: { venue: string }) => <div data-testid="venue-logo" data-venue={venue} />,
}))

// Currency-info resolution drags in the token/data-API web; the heading needs it only for logo art.
vi.mock('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos')>()),
  useMarginCurrencyInfos: () => new Map(),
}))

describe('MarginPairHeading', () => {
  it('renders the venue ghost wired to the market venue (Aave)', () => {
    const market = { ...getDefaultMarginMarket(), venue: 'AAVE_V3' as const }
    const { getByTestId } = render(<MarginPairHeading market={market} variant="venue" />)
    expect(getByTestId('venue-logo').getAttribute('data-venue')).toBe('AAVE_V3')
  })

  it('renders the venue ghost wired to the market venue (Morpho)', () => {
    const market = { ...getDefaultMarginMarket(), venue: 'MORPHO' as const }
    const { getByTestId } = render(<MarginPairHeading market={market} variant="venue" />)
    expect(getByTestId('venue-logo').getAttribute('data-venue')).toBe('MORPHO')
  })

  describe('direction variant subtitle', () => {
    const MARKET = getDefaultMarginMarket() // WETH (18dp, displaySymbol ETH) / USDC

    // ltv 0.695 → 1/(1-0.695) = 3.2787x. Opened at 2.00x, so the two are distinguishable.
    function position(overrides: Partial<MarginActivePosition> = {}): MarginActivePosition {
      return {
        positionId: '7',
        status: 'ACTIVE',
        direction: MarginDirection.LONG,
        exposureToken: {
          address: MARKET.collateral.address,
          chainId: MARGIN_CHAIN_ID,
          decimals: MARKET.collateral.decimals,
        },
        counterToken: { address: MARKET.debt.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.debt.decimals },
        size: '53000000000000000',
        entryPrice: '1850000000000000000000',
        openedAt: '1753000000',
        legs: [
          { venue: 'MORPHO', subId: '7', account: '0x000000000000000000000000000000000000000A', debt: '71310000' },
        ],
        isTradable: true,
        equity: '20000000000000000',
        leverage: '3.278688524590163934',
        oraclePrice: '1924000000000000000000',
        liquidationPrice: '1555930000000000000000',
        buffer: '400000000000000000',
        healthFactor: '1237000000000000000',
        maxWithdrawable: '0',
        openedLeverage: '2',
        ...overrides,
      }
    }

    it('reports CURRENT leverage, not leverage at open', () => {
      render(<MarginPairHeading market={MARKET} variant="direction" position={position()} />)
      expect(screen.getByText(/3\.28x/)).toBeInTheDocument()
      expect(screen.queryByText(/2\.00x/)).not.toBeInTheDocument()
    })

    it('carries direction, current size and leverage in one line', () => {
      render(<MarginPairHeading market={MARKET} variant="direction" position={position()} />)
      expect(screen.getByText('Long · 0.053 ETH · 3.28x')).toBeInTheDocument()
    })

    // The server omits leverage when there is no finite leverage to report.
    it('renders ∞ for a position with no finite leverage rather than claiming 1x', () => {
      render(<MarginPairHeading market={MARKET} variant="direction" position={position({ leverage: undefined })} />)
      expect(screen.getByText(/∞/)).toBeInTheDocument()
      expect(screen.queryByText(/1\.00x/)).not.toBeInTheDocument()
    })

    it('still renders the line for a position carrying no attributable basis', () => {
      render(
        <MarginPairHeading
          market={MARKET}
          variant="direction"
          position={position({ entryPrice: '0', openedAt: '0' })}
        />,
      )
      expect(screen.getByText('Long · 0.053 ETH · 3.28x')).toBeInTheDocument()
    })

    // A real short market: collateral is the stable USDC leg (6dp), debt is the volatile WETH (18dp).
    // The size is the exposure = the debt leg, so it must render in ETH — decoding it against the 6dp
    // collateral would print ~53 billion USDC.
    const SHORT_MARKET = {
      ...MARKET,
      collateral: MARKET.debt,
      debt: MARKET.collateral,
      displaySymbol: MARKET.debt.symbol,
      direction: MarginDirection.SHORT,
    }

    it('sizes a short by its exposure (debt) leg, not the stable collateral', () => {
      render(
        <MarginPairHeading
          market={SHORT_MARKET}
          variant="direction"
          position={position({ direction: MarginDirection.SHORT })}
        />,
      )
      // Decoding against the 6dp collateral would print ~53,000,000,000; the stable ticker would
      // replace ETH — the exact line pins both the amount and the exposure symbol.
      expect(screen.getByText('Short · 0.053 ETH · 3.28x')).toBeInTheDocument()
    })
  })
})
