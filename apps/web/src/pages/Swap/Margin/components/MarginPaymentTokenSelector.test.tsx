import { fireEvent, screen } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import type { PropsWithChildren } from 'react'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID, type MarginMarket } from '~/constants/margin'
import { MarginPaymentTokenSelector } from '~/pages/Swap/Margin/components/MarginPaymentTokenSelector'
import type { MarginPaymentTokenRow } from '~/pages/Swap/Margin/hooks/useMarginPaymentTokens'
import { render } from '~/test-utils/render'

// Render Modal children inline so the row list is testable without the portal/animation machinery
// (same approach as MarginMarketSelector.test.tsx).
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: PropsWithChildren) => children,
}))

vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => ({ address: '0x000000000000000000000000000000000000000A' }),
}))

const MARKET: MarginMarket = {
  key: 'weth-usdc-MORPHO',
  asset: 'ETH',
  name: 'Ethereum',
  displaySymbol: 'WETH',
  collateral: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
  debt: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
  venue: 'MORPHO',
  lltvWad: '860000000000000000',
  shouldUseNativeEquity: false,
}

const { mockMarketResolved, setMarginFormState } = vi.hoisted(() => ({
  // Per-test toggle: whether the lookup resolves the form's selected pairKey.
  mockMarketResolved: { current: false },
  setMarginFormState: vi.fn(),
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({
    groups: [],
    markets: [],
    getPairMarket: () => (mockMarketResolved.current ? MARKET : undefined),
    getLive: () => undefined,
    isLoading: false,
    isFetching: false,
    error: undefined,
    dataUpdatedAt: 0,
    refetch: vi.fn(),
  }),
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { selectingPaymentToken: boolean; pairKey: string }) => unknown) =>
    selector({
      selectingPaymentToken: true,
      pairKey: marginPairKey({ collateralToken: MARKET.collateral.address, debtToken: MARKET.debt.address }),
    }),
  useMarginFormStoreActions: () => ({ setMarginFormState }),
}))

// The market's own collateral (WETH) — picking it is the "market default" case the collapse-to-
// undefined logic exists for.
const DEFAULT_PAYMENT_TOKEN: MarginPaymentToken = {
  address: MARKET.collateral.address,
  symbol: MARKET.collateral.symbol,
  decimals: MARKET.collateral.decimals,
  isNative: false,
  chainId: MARGIN_CHAIN_ID,
}
const DEFAULT_PAYMENT_CURRENCY_INFO: CurrencyInfo = buildCurrencyInfo({
  currency: new Token(MARGIN_CHAIN_ID, MARKET.collateral.address, MARKET.collateral.decimals, MARKET.collateral.symbol),
  currencyId: `${MARKET.collateral.address}-${MARGIN_CHAIN_ID}`,
  logoUrl: null,
})
const ROW: MarginPaymentTokenRow = {
  token: DEFAULT_PAYMENT_TOKEN,
  currencyInfo: DEFAULT_PAYMENT_CURRENCY_INFO,
  balance: 1,
}

vi.mock('~/pages/Swap/Margin/hooks/useMarginPaymentTokens', () => ({
  useMarginPaymentTokens: () => ({ rows: [ROW], isLoading: false }),
}))

afterEach(() => {
  mockMarketResolved.current = false
  setMarginFormState.mockClear()
})

describe('MarginPaymentTokenSelector', () => {
  it('does not store a selection when the market cannot be resolved', () => {
    render(<MarginPaymentTokenSelector />)
    fireEvent.click(screen.getByLabelText('Pay with WETH'))
    expect(setMarginFormState).not.toHaveBeenCalled()
  })

  it('collapses the market default to undefined once the market resolves', () => {
    mockMarketResolved.current = true
    render(<MarginPaymentTokenSelector />)
    fireEvent.click(screen.getByLabelText('Pay with WETH'))
    expect(setMarginFormState).toHaveBeenCalledWith({ paymentToken: undefined, selectingPaymentToken: false })
  })
})
