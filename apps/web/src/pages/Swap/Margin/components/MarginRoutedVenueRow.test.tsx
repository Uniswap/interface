import { act, fireEvent, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MarginPairGroup } from '~/constants/margin'
import { MarginRoutedVenueRow } from '~/pages/Swap/Margin/components/MarginRoutedVenueRow'
import { render } from '~/test-utils/render'

const GROUP = { key: 'weth-usdc-LONG', pairKey: 'weth-usdc' } as unknown as MarginPairGroup

// The FE-10 sheet and its active-group hook, stubbed: this row is an ENTRY POINT into them, so what
// is under test is that pressing the chip opens that sheet — not what the sheet then renders.
const { mockGroup } = vi.hoisted(() => ({ mockGroup: { current: undefined as MarginPairGroup | undefined } }))
vi.mock('~/pages/Swap/Margin/components/MarginVenuePreferences', () => ({
  useActiveMarginPairGroup: () => mockGroup.current,
  MarginVenuePreferencesModal: () => <div data-testid="venue-sheet" />,
}))

vi.mock('~/pages/Swap/Margin/components/MarginVenueLogo', () => ({
  MarginVenueLogo: ({ venue }: { venue: string }) => <div data-testid={TestID.MarginVenueLogo} data-venue={venue} />,
}))

function renderRow(routedVenue?: MarginVenue): ReturnType<typeof render> {
  return render(<MarginRoutedVenueRow routedVenue={routedVenue} />)
}

describe('MarginRoutedVenueRow', () => {
  beforeEach(() => {
    mockGroup.current = GROUP
  })

  it('reads as Auto before a quote has routed anywhere', () => {
    renderRow(undefined)
    expect(screen.getByText('Auto · best available')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.MarginVenueLogo)).toBeNull()
  })

  it('names the routed venue, with its logo, once the quote has one', () => {
    renderRow('MORPHO')
    expect(screen.getByText('Morpho')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.MarginVenueLogo)).toHaveAttribute('data-venue', 'MORPHO')
  })

  it('opens the venue opt-out sheet from the chip', () => {
    renderRow('MORPHO')
    expect(screen.queryByTestId('venue-sheet')).toBeNull()
    fireEvent.click(screen.getByTestId(TestID.MarginRoutedVenueChip))
    expect(screen.getByTestId('venue-sheet')).toBeInTheDocument()
  })

  describe('change cue', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('cues a re-route between quotes, then clears itself', () => {
      const { rerender } = renderRow('MORPHO')
      expect(screen.queryByText('Route updated')).toBeNull()

      rerender(<MarginRoutedVenueRow routedVenue="AAVE_V3" />)
      expect(screen.getByText('Route updated')).toBeInTheDocument()
      expect(screen.getByText('Aave v3')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(screen.queryByText('Route updated')).toBeNull()
      // Transient cue only — the venue it moved to stays named.
      expect(screen.getByText('Aave v3')).toBeInTheDocument()
    })

    // Arriving at the first venue is not a change: there was nothing on screen to move away from.
    it('does not cue the first venue a quote produces', () => {
      const { rerender } = renderRow(undefined)
      rerender(<MarginRoutedVenueRow routedVenue="MORPHO" />)
      expect(screen.queryByText('Route updated')).toBeNull()
    })

    // The bridged-quote window blanks the venue; coming back to the SAME one is not a re-route.
    it('does not cue a venue reappearing after a placeholder gap', () => {
      const { rerender } = renderRow('MORPHO')
      rerender(<MarginRoutedVenueRow routedVenue={undefined} />)
      expect(screen.queryByText('Route updated')).toBeNull()
      rerender(<MarginRoutedVenueRow routedVenue="MORPHO" />)
      expect(screen.queryByText('Route updated')).toBeNull()
    })

    it('restarts the cue when a second re-route lands while it is still up', () => {
      const { rerender } = renderRow('MORPHO')
      rerender(<MarginRoutedVenueRow routedVenue="AAVE_V3" />)
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      rerender(<MarginRoutedVenueRow routedVenue="AAVE_V4" />)
      // Past the first cue's deadline, still up because the second re-route reset it.
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(screen.getByText('Route updated')).toBeInTheDocument()
    })
  })

  // The sheet needs a group to configure; with none resolved the chip still names the venue rather
  // than opening an empty sheet.
  it('leaves the chip inert while no pair group is resolved', () => {
    mockGroup.current = undefined
    renderRow('MORPHO')
    fireEvent.click(screen.getByTestId(TestID.MarginRoutedVenueChip))
    expect(screen.queryByTestId('venue-sheet')).toBeNull()
    expect(screen.getByText('Morpho')).toBeInTheDocument()
  })
})
