import { fireEvent } from '@testing-library/react'
import { TestID } from '@universe/test'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginOpenButton } from '~/pages/Swap/Margin/components/MarginOpenButton'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { render } from '~/test-utils/render'

vi.mock('~/hooks/useAccount', () => ({ useAccount: () => ({ address: '0x000000000000000000000000000000000000A1' }) }))
vi.mock('~/components/AccountDrawer/MiniPortfolio/hooks', () => ({ useAccountDrawer: () => ({ open: vi.fn() }) }))
vi.mock('~/pages/Swap/Margin/hooks/useExecuteMarginPlan', () => ({
  useExecuteMarginPlan: () => ({ resumePlan: vi.fn() }),
}))
// The notice resolves the active pair group off the registry + form store; both have their own
// tests, and here only the fact that it appears alongside the blocked CTA is under test.
vi.mock('~/pages/Swap/Margin/components/MarginVenuePreferences', () => ({
  MarginVenueEmptyNotice: () => <div data-testid={TestID.MarginVenuesNotice} />,
}))

const onRequestReview = vi.fn()

function derived({
  allowedVenues,
  direction = MarginDirection.LONG,
}: {
  allowedVenues: MarginVenue[]
  direction?: MarginDirection
}): DerivedMarginInfo {
  return {
    market: getDefaultMarginMarket(),
    direction,
    hasEnteredAmount: true,
    hasSufficientBalance: true,
    quote: {} as DerivedMarginInfo['quote'],
    isQuoteLoading: false,
    isFetching: false,
    isPlaceholderData: false,
    isDebouncing: false,
    paymentCurrency: { symbol: 'ETH' },
    paymentToken: { symbol: 'ETH' },
    leverage: 2,
    maxLeverage: 5,
    allowedVenues,
  } as unknown as DerivedMarginInfo
}

function ctaLabel(container: HTMLElement): string {
  return container.querySelector('button')?.textContent ?? ''
}

describe('MarginOpenButton venue gate', () => {
  afterEach(() => onRequestReview.mockClear())

  it('offers to open the position while the pair still has a venue to route to', () => {
    const { container, queryByTestId } = render(
      <MarginOpenButton derivedMarginInfo={derived({ allowedVenues: ['MORPHO'] })} onRequestReview={onRequestReview} />,
    )
    expect(ctaLabel(container)).toBe('Open long position')
    expect(queryByTestId(TestID.MarginVenuesNotice)).toBeNull()
  })

  it('labels the short side and opens the review on press', () => {
    const { container } = render(
      <MarginOpenButton
        derivedMarginInfo={derived({ allowedVenues: ['MORPHO'], direction: MarginDirection.SHORT })}
        onRequestReview={onRequestReview}
      />,
    )
    const button = container.querySelector('button')
    expect(ctaLabel(container)).toBe('Open short position')
    expect(button).toBeEnabled()
    fireEvent.click(button as HTMLButtonElement)
    expect(onRequestReview).toHaveBeenCalledTimes(1)
  })

  // An empty allowlist builds no quote request at all, so there is nothing for the amount or the
  // leverage to fix — the CTA has to say so rather than sit on a generic disabled state.
  it('blocks the CTA and shows the notice when every venue is excluded', () => {
    const { container, getByTestId } = render(
      <MarginOpenButton derivedMarginInfo={derived({ allowedVenues: [] })} onRequestReview={onRequestReview} />,
    )
    expect(ctaLabel(container)).toBe('No venues enabled')
    expect(container.querySelector('button')).toBeDisabled()
    expect(getByTestId(TestID.MarginVenuesNotice)).toBeTruthy()
  })
})
