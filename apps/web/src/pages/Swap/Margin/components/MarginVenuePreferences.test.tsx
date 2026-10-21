import { fireEvent, within } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { PropsWithChildren } from 'react'
import { deriveMarginVenues } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginVenuePreferences'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MarginPair, MarginPairGroup, MarginTokenInfo } from '~/constants/margin'
import { MarginVenuePreferencesModal } from '~/pages/Swap/Margin/components/MarginVenuePreferences'
import { render } from '~/test-utils/render'

// Inline the modal body, as every other margin modal test does.
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: PropsWithChildren) => children,
}))

vi.mock('~/pages/Swap/Margin/components/MarginVenueLogo', () => ({
  MarginVenueLogo: ({ venue }: { venue: string }) => <div data-testid={TestID.MarginVenueLogo} data-venue={venue} />,
}))

// The real store action, spied: the assertions are about what the sheet does to `excludedVenues`,
// and the analytics wrapper has its own test.
const { excluded, toggleVenue, resetVenues } = vi.hoisted(() => ({
  excluded: { current: [] as string[] },
  toggleVenue: vi.fn(),
  resetVenues: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { excludedVenues: string[]; pairKey: string }) => unknown) =>
    selector({ excludedVenues: excluded.current, pairKey: 'weth-usdc' }),
}))
vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useToggleMarginVenue', () => ({
  useToggleMarginVenue: () => toggleVenue,
}))
vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useResetMarginVenues', () => ({
  useResetMarginVenues: () => resetVenues,
}))

const WETH: MarginTokenInfo = {
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  symbol: 'WETH',
  decimals: 18,
}
const USDC: MarginTokenInfo = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
}

function pair({ venue, ...rest }: { venue: MarginVenue } & Partial<MarginPair>): MarginPair {
  return {
    key: `weth-usdc-${venue}`,
    debt: USDC,
    venue,
    lltvWad: '860000000000000000',
    maxLeverage: 5,
    borrowRateBps: 420,
    availableBorrowLiquidity: '12300000000000',
    ...rest,
  }
}

const GROUP: MarginPairGroup = {
  key: 'weth-usdc-LONG',
  pairKey: 'weth-usdc',
  base: WETH,
  quote: USDC,
  direction: 'LONG',
  pairs: [pair({ venue: 'MORPHO' }), pair({ venue: 'AAVE_V3', maxLeverage: 3, borrowRateBps: 510 })],
}

function renderSheet(group: MarginPairGroup = GROUP): ReturnType<typeof render> {
  return render(<MarginVenuePreferencesModal group={group} isOpen onClose={vi.fn()} />)
}

// The switch inside a given venue's row — the rows are what bind the preference, so a test that
// reached for switches by index could silently be pressing the master.
function venueSwitch({ container, venue }: { container: HTMLElement; venue: MarginVenue }): HTMLElement {
  const row = [...container.querySelectorAll(`[data-testid="${TestID.MarginVenueRow}"]`)].find((element) =>
    element.querySelector(`[data-venue="${venue}"]`),
  )
  expect(row).toBeTruthy()
  return within(row as HTMLElement).getByRole('switch')
}

describe('MarginVenuePreferencesModal', () => {
  afterEach(() => {
    excluded.current = []
    toggleVenue.mockClear()
    resetVenues.mockClear()
  })

  it('renders one row per backing venue, with its logo, label and numbers', () => {
    const { getAllByTestId, getByText } = renderSheet()
    const rows = getAllByTestId(TestID.MarginVenueRow)
    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.textContent)).toMatchInlineSnapshot(`
      [
        "MorphoMax 5x · Borrow rate 4.2% · Liquidity 12.3M USDC",
        "Aave v3Max 3x · Borrow rate 5.1% · Liquidity 12.3M USDC",
      ]
    `)
    expect(getByText('ETH / USDC')).toBeTruthy()
  })

  // Compound ships with no brand mark, so the row has to stand on its label alone and still bind
  // the preference like any other venue.
  it('renders and toggles a COMPOUND_V3 row', () => {
    const { getAllByTestId, container } = renderSheet({
      ...GROUP,
      pairs: [...GROUP.pairs, pair({ venue: 'COMPOUND_V3', maxLeverage: 4, borrowRateBps: 380 })],
    })
    expect(getAllByTestId(TestID.MarginVenueRow).map((row) => row.textContent)).toContain(
      'Compound v3Max 4x · Borrow rate 3.8% · Liquidity 12.3M USDC',
    )
    fireEvent.click(venueSwitch({ container, venue: 'COMPOUND_V3' }))
    expect(toggleVenue).toHaveBeenCalledWith({ venue: 'COMPOUND_V3' })
  })

  // The wire may omit either number for a venue; the row drops the chunk rather than printing a
  // labelled em dash next to two real figures.
  it('drops the liquidity chunk when the wire carries no depth for a venue', () => {
    const { getByText, queryByText } = renderSheet({
      ...GROUP,
      pairs: [pair({ venue: 'MORPHO', availableBorrowLiquidity: undefined })],
    })
    expect(getByText('Max 5x · Borrow rate 4.2%')).toBeTruthy()
    expect(queryByText(/Liquidity/)).toBeNull()
  })

  it('toggles the venue the pressed row belongs to', () => {
    const { container } = renderSheet()
    fireEvent.click(venueSwitch({ container, venue: 'AAVE_V3' }))
    expect(toggleVenue).toHaveBeenCalledWith({ venue: 'AAVE_V3' })
  })

  it('draws an excluded venue as off and leaves the rest on', () => {
    excluded.current = ['AAVE_V3']
    const { container } = renderSheet()
    expect(venueSwitch({ container, venue: 'MORPHO' })).toHaveAttribute('aria-checked', 'true')
    expect(venueSwitch({ container, venue: 'AAVE_V3' })).toHaveAttribute('aria-checked', 'false')
  })

  // What the row shows as enabled is exactly what the quote request would carry.
  it('shows the venues the quote would be asked with', () => {
    excluded.current = ['AAVE_V3']
    const { container } = renderSheet()
    const enabled = (['AAVE_V3', 'MORPHO'] as MarginVenue[]).filter(
      (venue) => venueSwitch({ container, venue }).getAttribute('aria-checked') === 'true',
    )
    expect(enabled).toEqual(
      deriveMarginVenues({ pairVenues: GROUP.pairs.map((p) => p.venue), excludedVenues: ['AAVE_V3'] }),
    )
  })

  it('locks the last enabled venue so the rows cannot empty the market', () => {
    excluded.current = ['AAVE_V3']
    const { container, getByText } = renderSheet()
    const last = venueSwitch({ container, venue: 'MORPHO' })
    expect(last).toHaveAttribute('aria-disabled', 'true')
    expect(getByText('Last enabled venue')).toBeTruthy()
    fireEvent.click(last)
    expect(toggleVenue).not.toHaveBeenCalled()
  })

  it('leaves both switches live while two venues are enabled', () => {
    const { container, queryByText } = renderSheet()
    expect(venueSwitch({ container, venue: 'MORPHO' })).not.toHaveAttribute('aria-disabled', 'true')
    expect(venueSwitch({ container, venue: 'AAVE_V3' })).not.toHaveAttribute('aria-disabled', 'true')
    expect(queryByText('Last enabled venue')).toBeNull()
  })

  it('reflects the default preference on the master switch', () => {
    const { getByTestId, rerender } = renderSheet()
    expect(getByTestId(TestID.MarginVenueDefaultToggle)).toHaveAttribute('aria-checked', 'true')
    excluded.current = ['AAVE_V3']
    rerender(<MarginVenuePreferencesModal group={GROUP} isOpen onClose={vi.fn()} />)
    expect(getByTestId(TestID.MarginVenueDefaultToggle)).toHaveAttribute('aria-checked', 'false')
  })

  it('clears every exclusion from the master switch', () => {
    excluded.current = ['AAVE_V3']
    const { getByTestId } = renderSheet()
    fireEvent.click(getByTestId(TestID.MarginVenueDefaultToggle))
    expect(resetVenues).toHaveBeenCalledTimes(1)
  })

  // "Default" IS the empty exclusion set, so pressing an already-on master has nothing to mean.
  it('does nothing when the master switch is pressed in the default state', () => {
    const { getByTestId } = renderSheet()
    fireEvent.click(getByTestId(TestID.MarginVenueDefaultToggle))
    expect(resetVenues).not.toHaveBeenCalled()
  })

  // Reachable without touching this pair's rows at all: the preference is global.
  it('names the empty market when every venue under it is excluded', () => {
    excluded.current = ['MORPHO', 'AAVE_V3']
    const { getByTestId, container } = renderSheet()
    expect(getByTestId(TestID.MarginVenuesEmpty).textContent).toBe('No venues enabled for this market')
    // Nothing is locked in that state — every row has to be re-enablable.
    expect(venueSwitch({ container, venue: 'MORPHO' })).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('shows no empty state while a venue is still enabled', () => {
    excluded.current = ['AAVE_V3']
    const { queryByTestId } = renderSheet()
    expect(queryByTestId(TestID.MarginVenuesEmpty)).toBeNull()
  })
})
