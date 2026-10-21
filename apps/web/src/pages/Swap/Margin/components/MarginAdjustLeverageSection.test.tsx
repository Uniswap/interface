import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MarginAdjustLeverageSection } from '~/pages/Swap/Margin/components/MarginAdjustLeverageSection'
import { render } from '~/test-utils/render'

// The real slider drags via pointer capture on a measured track, none of which jsdom provides. Echo the
// colour it was handed so the tint assertions read the prop rather than a Tamagui class.
vi.mock('~/pages/Swap/Margin/components/shared/MarginLeverageSlider', () => ({
  MarginLeverageSlider: ({ trackColor, value }: { trackColor?: string; value: number }) => (
    <div data-testid="slider" data-track-color={trackColor} data-value={String(value)} />
  ),
}))

vi.mock('uniswap/src/components/AmountInput/AmountInput', () => ({
  AmountInput: (props: Record<string, unknown>) => (
    <input
      aria-label={props['aria-label'] as string | undefined}
      value={(props.value as string | undefined) ?? ''}
      readOnly
    />
  ),
}))

const BASE = {
  displayedLeverage: 3.28,
  cap: 5.56,
  // WETH/USDC Morpho: 86%.
  lltvWad: '860000000000000000',
  direction: 'LONG' as const,
  onLeverageDraftChange: vi.fn(),
  onCommitLeverageDraft: vi.fn(),
  onSliderChange: vi.fn(),
}

describe('MarginAdjustLeverageSection', () => {
  it('renders the lock beside the section label when the caller supplies a handler', () => {
    render(<MarginAdjustLeverageSection {...BASE} lockLeverage onToggleLockLeverage={vi.fn()} />)
    expect(screen.getByText('Lock')).toBeInTheDocument()
    expect(screen.getByTestId('margin-adjust-position-lock-leverage')).toBeInTheDocument()
  })

  // Change leverage has nothing to lock against, so it passes no handler.
  it('omits the lock entirely when no handler is given', () => {
    render(<MarginAdjustLeverageSection {...BASE} />)
    expect(screen.queryByText('Lock')).not.toBeInTheDocument()
    expect(screen.queryByTestId('margin-adjust-position-lock-leverage')).not.toBeInTheDocument()
  })

  // The visible chrome shortens to "Lock"; the accessible name stays the full phrase. WCAG 2.5.3 wants
  // the accessible name to CONTAIN the visible label, so this direction is the compliant one. Today's
  // switch carries no accessible name at all, so this is a fix, not a new constraint.
  it('keeps the full wording as the switch accessible name', () => {
    render(<MarginAdjustLeverageSection {...BASE} lockLeverage onToggleLockLeverage={vi.fn()} />)
    const named = screen.getByLabelText('Lock leverage')
    expect(named).toBeInTheDocument()
    // Both sides read from the DOM: comparing two literals here would pass whatever the component renders.
    expect(named.getAttribute('aria-label')).toContain(screen.getByText('Lock').textContent)
  })

  describe('track tint', () => {
    it('is green while the implied health factor is comfortable', () => {
      render(<MarginAdjustLeverageSection {...BASE} displayedLeverage={2} />)
      expect(screen.getByTestId('slider').getAttribute('data-track-color')).toBe('$statusSuccess')
    })

    // HF at 3.28x on an 86% LLTV is 1.237 — the same Caution band the health row reports.
    it('is amber once the implied health factor enters caution', () => {
      render(<MarginAdjustLeverageSection {...BASE} displayedLeverage={3.28} />)
      expect(screen.getByTestId('slider').getAttribute('data-track-color')).toBe('$statusWarning')
    })

    it('is red approaching the cap', () => {
      render(<MarginAdjustLeverageSection {...BASE} displayedLeverage={5} />)
      expect(screen.getByTestId('slider').getAttribute('data-track-color')).toBe('$statusCritical')
    })

    it('stays green at the slider origin, where there is no debt', () => {
      render(<MarginAdjustLeverageSection {...BASE} displayedLeverage={1} />)
      expect(screen.getByTestId('slider').getAttribute('data-track-color')).toBe('$statusSuccess')
    })

    // Aave rows publish no LLTV, so there is no constraint to tint against — and "unknown" must not
    // read as "healthy" on a risk indicator, so the track goes neutral rather than green.
    it('goes neutral for a venue that publishes no LLTV', () => {
      render(<MarginAdjustLeverageSection {...BASE} displayedLeverage={4} lltvWad="0" />)
      expect(screen.getByTestId('slider').getAttribute('data-track-color')).toBe('$neutral3')
    })
  })
})
