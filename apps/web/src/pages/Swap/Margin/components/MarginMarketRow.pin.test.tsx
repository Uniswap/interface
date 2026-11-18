import { fireEvent, screen, waitFor } from '@testing-library/react'
import {
  MarginApiClient,
  type MarginQuoteRequest,
  type MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import { createMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/createMarginFormStore'
import { MarginFormStoreContext } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/MarginFormStoreContext'
import { describe, expect, it, vi } from 'vitest'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginMarketRow } from '~/pages/Swap/Margin/components/MarginMarketRow'
import { useDerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { render } from '~/test-utils/render'

const MORPHO_ID = '0x1cc83f2e3e44cd44fadedc9ee43109ffafc5609a46097183de1f53abcfc91733'
const AAVE_ID = '0x7d25d9a4127437970c901ef507e7593c79e5c3d329b5504fbe4f1d6c293855b2'
// Morpho is the server's headline market; Aave is cheaper and deeper, which Auto must not care about.
const MORPHO = { ...getDefaultMarginMarket(), marketId: MORPHO_ID, maxLeverage: 5, isHeadline: true }
const AAVE = { ...MORPHO, key: `${MORPHO.key}-aave`, venue: 'AAVE_V3' as const, marketId: AAVE_ID, isHeadline: false }
const PAIR_KEY = marginPairKey({ collateralToken: MORPHO.collateral.address, debtToken: MORPHO.debt.address })

vi.mock('~/connection/hooks/useAccount', () => ({
  useAccount: () => ({ address: '0x00000000000000000000000000000000000000A1' }),
}))
vi.mock('uniswap/src/features/portfolio/balances/hooks', () => ({
  usePortfolioBalances: () => ({ data: undefined, loading: false }),
}))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({ useCurrencyInfo: () => undefined }))
vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCValue: () => undefined,
  useUSDCPrice: () => ({ price: undefined }),
}))
vi.mock('~/pages/Swap/Margin/hooks/useMarginVenueRoutedAnalytics', () => ({
  useMarginVenueRoutedAnalytics: () => undefined,
}))
// Stable identities, as the real hook's memo gives: the derived allowlist is the quote's query key.
const PAIR_MARKETS = [MORPHO, AAVE]
const MARKETS = {
  markets: PAIR_MARKETS,
  groups: [
    {
      key: PAIR_KEY,
      pairKey: PAIR_KEY,
      pairs: [
        { ...AAVE, borrowRateBps: 300, availableBorrowLiquidity: '9000000000000' },
        { ...MORPHO, borrowRateBps: 500, availableBorrowLiquidity: '1000000' },
      ],
    },
  ],
  getPairMarkets: () => PAIR_MARKETS,
  getLive: (key: string) => ({ borrowApyBps: key === AAVE.key ? 300 : 500 }),
  getMarketByTokens: () => undefined,
}
vi.mock('~/features/margin/hooks/useMarginMarkets', () => ({ useMarginMarkets: () => MARKETS }))

// What MarginReceipt hands the row: no venue while the quote is placeholder data. The routed venue is
// echoed so the test can read which market the current quote opens on, cached or fetched.
function Receipt(): JSX.Element {
  const { quote, isPlaceholderData } = useDerivedMarginInfo({ market: MORPHO })
  const routedVenue = isPlaceholderData ? undefined : quote?.legs.at(0)?.venue
  return (
    <>
      <MarginMarketRow routedVenue={routedVenue} quotedRatePct={undefined} />
      <span data-testid="routed">{routedVenue}</span>
    </>
  )
}

describe('MarginMarketRow — Auto is the headline market', () => {
  it('quotes the headline under Auto, the picked venue after a pick, and the headline again on Auto', async () => {
    const fetchQuote = vi.spyOn(MarginApiClient, 'fetchMarginQuote').mockImplementation((params: MarginQuoteRequest) =>
      Promise.resolve({
        legs: [{ venue: JSON.stringify(params).includes(MORPHO_ID) ? 'MORPHO' : 'AAVE_V3' }],
      } as unknown as MarginQuoteResponse),
    )
    const store = createMarginFormStore({ initialState: { marginAmount: '1', leverage: 2 } })
    render(
      <MarginFormStoreContext.Provider value={store}>
        <Receipt />
      </MarginFormStoreContext.Provider>,
    )
    await waitFor(() => expect(screen.getByTestId('routed')).toHaveTextContent('MORPHO'))
    expect(JSON.stringify(fetchQuote.mock.calls.at(-1)?.[0])).toContain(MORPHO_ID)
    // The settled quote is not pinned: Auto stays the server's pick.
    expect(store.getState().pinnedVenue).toBeUndefined()

    fireEvent.click(screen.getByText('Morpho'))
    fireEvent.click(screen.getByText('Aave v3'))
    expect(store.getState().pinnedVenue).toEqual({ pairKey: PAIR_KEY, venue: 'AAVE_V3' })
    await waitFor(() => expect(screen.getByTestId('routed')).toHaveTextContent('AAVE_V3'))
    expect(JSON.stringify(fetchQuote.mock.calls.at(-1)?.[0])).toContain(AAVE_ID)

    fireEvent.click(screen.getAllByText('Aave v3')[0] as HTMLElement)
    fireEvent.click(screen.getAllByText('Auto').at(-1) as HTMLElement)
    expect(store.getState().pinnedVenue).toBeUndefined()
    await waitFor(() => expect(screen.getByTestId('routed')).toHaveTextContent('MORPHO'))
  })
})
