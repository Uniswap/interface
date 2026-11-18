import { screen } from '@testing-library/react'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MarginMarket } from '~/constants/margin'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { MarginForm } from '~/pages/Swap/Margin/MarginForm'
import { render } from '~/test-utils/render'

// MarginFormBody's own children are irrelevant here — the SHORT-market case below resolves a
// display market via markets.at(0) even while the stored key is unresolved (matches
// PairHeaderButton/MarginStatsStrip), so MarginFormBody mounts. Stub every child so mounting it
// doesn't drag in the quote/balance/currency dependency web; only MarginFormContent's own
// adopt-first-market effect is under test.
vi.mock('~/pages/Swap/Margin/hooks/useDerivedMarginInfo', () => ({
  // Only the fields MarginFormBody itself reads before its children (all stubbed below) mount. The
  // conversion caption reads the collateral decimals, so an empty object is not enough of a stub.
  useDerivedMarginInfo: () =>
    ({
      market: { collateral: { decimals: 18 } },
      isPaymentDifferentFromCollateral: false,
    }) as unknown as DerivedMarginInfo,
}))
vi.mock('~/pages/Swap/Margin/hooks/useMarginEquityInput', () => ({ useMarginEquityInput: () => ({}) }))
vi.mock('uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel', () => ({ CurrencyInputPanel: () => null }))
vi.mock('~/pages/Swap/Margin/components/MarginPayWith', () => ({ MarginPayWith: () => null }))
vi.mock('~/pages/Swap/Margin/components/MarginSizeLeverageBox', () => ({
  MarginLeverageSection: () => <span data-testid="leverage-section" />,
}))
vi.mock('~/pages/Swap/Margin/components/MarginSizeBlock', () => ({
  MarginSizeBlock: () => <span data-testid="size-block" />,
}))
vi.mock('~/pages/Swap/Margin/components/MarginRateRows', () => ({
  MarginRateRows: () => null,
}))
vi.mock('~/pages/Swap/Margin/components/MarginOpenButton', () => ({ MarginOpenButton: () => null }))
vi.mock('~/pages/Swap/Margin/components/MarginOpenReviewModal', () => ({ MarginOpenReviewModal: () => null }))
vi.mock('~/pages/Swap/Margin/components/MarginMarketSelector', () => ({ MarginMarketSelector: () => null }))
vi.mock('~/pages/Swap/Margin/MarginPositionsTable', () => ({ MarginPositionsTable: () => null }))

vi.mock('~/connection/hooks/useAccount', () => ({
  useAccount: () => ({ address: '0x000000000000000000000000000000000000A1' }),
}))
vi.mock('~/state/accountDrawer/hooks', () => ({ useAccountDrawer: () => ({ open: vi.fn() }) }))

const { mockMarkets, mockGetPairMarket, mockIsLoading, setMarginFormState } = vi.hoisted(() => ({
  mockMarkets: { current: [] as MarginMarket[] },
  // Simulates a stored pairKey that no longer resolves against the registry.
  mockGetPairMarket: { current: (): MarginMarket | undefined => undefined },
  mockIsLoading: { current: false },
  setMarginFormState: vi.fn(),
}))

vi.mock('~/features/margin/hooks/useMarginMarkets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/features/margin/hooks/useMarginMarkets')>()
  return {
    ...actual,
    useMarginMarkets: () => ({
      // Real grouping off the same fixtures the display path uses: the effect adopts a group, and a
      // market carrying no wire `direction` only reaches it as a short if the grouping derives one.
      groups: actual.groupMarketsIntoPairs({ markets: mockMarkets.current, liveByKey: new Map() }),
      markets: mockMarkets.current,
      getPairMarket: mockGetPairMarket.current,
      getLive: () => undefined,
      isLoading: mockIsLoading.current,
      isFetching: false,
      error: undefined,
      dataUpdatedAt: 0,
      refetch: vi.fn(),
    }),
  }
})

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { pairKey: string | undefined }) => unknown) =>
    selector({ pairKey: 'stale-pair-key' }),
  useMarginFormStoreActions: () => ({ setMarginFormState }),
}))

const SHORT_MARKET: MarginMarket = {
  key: 'usdc-weth-MORPHO',
  asset: 'ETH',
  name: 'Ethereum',
  displaySymbol: 'USDC',
  collateral: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
  debt: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
  venue: 'MORPHO',
  direction: MarginDirection.SHORT,
  lltvWad: '860000000000000000',
  shouldUseNativeEquity: false,
}

describe('MarginForm adopt-first-market effect', () => {
  afterEach(() => {
    mockMarkets.current = []
    mockGetPairMarket.current = () => undefined
    mockIsLoading.current = false
    setMarginFormState.mockClear()
  })

  it('adopts the first market and writes side "short" for a SHORT-direction first market', () => {
    mockMarkets.current = [SHORT_MARKET]
    render(<MarginForm showInlinePositions={false} />)

    expect(setMarginFormState).toHaveBeenCalledWith({
      pairKey: marginPairKey({
        collateralToken: SHORT_MARKET.collateral.address,
        debtToken: SHORT_MARKET.debt.address,
      }),
      paymentToken: undefined,
      side: MarginDirection.SHORT,
    })
  })

  // `direction` is optional on the wire; the reversed pair (stable collateral / volatile debt) is a
  // short by token identity alone, so the toggle must not fall back to "Long".
  it('derives side "short" for a first market carrying no wire direction', () => {
    mockMarkets.current = [{ ...SHORT_MARKET, direction: undefined }]
    render(<MarginForm showInlinePositions={false} />)

    expect(setMarginFormState).toHaveBeenCalledWith({
      pairKey: marginPairKey({
        collateralToken: SHORT_MARKET.collateral.address,
        debtToken: SHORT_MARKET.debt.address,
      }),
      paymentToken: undefined,
      side: MarginDirection.SHORT,
    })
  })

  it('does not call setMarginFormState when markets is empty', () => {
    mockMarkets.current = []
    render(<MarginForm showInlinePositions={false} />)

    expect(setMarginFormState).not.toHaveBeenCalled()
  })
})

describe('MarginForm Size and Leverage layout', () => {
  afterEach(() => {
    mockMarkets.current = []
  })

  it('renders the Leverage row and a separate Size box', () => {
    mockMarkets.current = [SHORT_MARKET]
    render(<MarginForm showInlinePositions={false} />)

    expect(screen.getByTestId('leverage-section')).toBeInTheDocument()
    expect(screen.getByTestId('size-block')).toBeInTheDocument()
  })
})
