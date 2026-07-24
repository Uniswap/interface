import { TradingApi } from '@universe/api'
import type { SwapReviewTransactionState } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/createSwapReviewTransactionStore'
import {
  getHasSettledEarnQuoteRefreshError,
  getIsEarnQuoteRefreshLoading,
  getIsSwapMissingParams,
} from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { CurrencyField } from 'uniswap/src/types/currency'

const AMOUNT = {} as NonNullable<SwapReviewTransactionState['derivedSwapInfo']['currencyAmounts'][CurrencyField.INPUT]>
const CURRENCY_INFO = {} as NonNullable<SwapReviewTransactionState['currencyInInfo']>

describe('swap review transaction store helpers', () => {
  it('keeps accepted Earn amounts renderable when a later Earn quote refresh settles with an error', () => {
    const state = createState({
      acceptedTrade: createTrade({ earn: true }),
      acceptedDerivedSwapInfo: createDerivedSwapInfo({ hasAmounts: true }),
      derivedSwapInfo: createDerivedSwapInfo({
        hasAmounts: false,
        trade: {
          error: new Error('quote failed'),
          isFetching: false,
          isLoading: false,
        },
      }),
      trade: undefined,
    })

    expect(getIsEarnQuoteRefreshLoading({ state, isEarnFlow: true })).toBe(false)
    expect(getIsSwapMissingParams({ state, isEarnQuoteRefreshLoading: false })).toBe(false)
    // The review renders the accepted trade with a retry banner in this state — it must not be
    // loading, not be missing params, and not pass the missing live trade into SwapDetails.
    expect(getHasSettledEarnQuoteRefreshError(state)).toBe(true)
  })

  it('does not report a settled earn quote refresh error while the refresh is still in flight', () => {
    const state = createState({
      acceptedTrade: createTrade({ earn: true }),
      acceptedDerivedSwapInfo: createDerivedSwapInfo({ hasAmounts: true }),
      derivedSwapInfo: createDerivedSwapInfo({
        hasAmounts: false,
        trade: {
          error: new Error('quote failed'),
          isFetching: true,
          isLoading: false,
        },
      }),
      trade: undefined,
    })

    expect(getHasSettledEarnQuoteRefreshError(state)).toBe(false)
  })

  it('does not report a settled earn quote refresh error for non-earn accepted trades', () => {
    const state = createState({
      acceptedTrade: createTrade({ earn: false }),
      acceptedDerivedSwapInfo: createDerivedSwapInfo({ hasAmounts: true }),
      derivedSwapInfo: createDerivedSwapInfo({
        hasAmounts: false,
        trade: {
          error: new Error('quote failed'),
          isFetching: false,
          isLoading: false,
        },
      }),
      trade: undefined,
    })

    expect(getHasSettledEarnQuoteRefreshError(state)).toBe(false)
  })

  it('still treats missing live amounts as missing for non-Earn settled quote errors', () => {
    const state = createState({
      acceptedTrade: createTrade({ earn: false }),
      acceptedDerivedSwapInfo: createDerivedSwapInfo({ hasAmounts: true }),
      derivedSwapInfo: createDerivedSwapInfo({
        hasAmounts: false,
        trade: {
          error: new Error('quote failed'),
          isFetching: false,
          isLoading: false,
        },
      }),
      trade: undefined,
    })

    expect(getIsSwapMissingParams({ state, isEarnQuoteRefreshLoading: false })).toBe(true)
  })

  it('uses the Earn quote refresh loading gate only while the refresh is in flight', () => {
    const loadingState = createState({
      acceptedTrade: createTrade({ earn: true }),
      acceptedDerivedSwapInfo: createDerivedSwapInfo({ hasAmounts: true }),
      derivedSwapInfo: createDerivedSwapInfo({
        hasAmounts: false,
        trade: {
          error: undefined,
          isFetching: true,
          isLoading: false,
        },
      }),
      trade: undefined,
    })
    const settledErrorState = createState({
      ...loadingState,
      derivedSwapInfo: createDerivedSwapInfo({
        hasAmounts: false,
        trade: {
          error: new Error('quote failed'),
          isFetching: false,
          isLoading: false,
        },
      }),
    })

    expect(getIsEarnQuoteRefreshLoading({ state: loadingState, isEarnFlow: true })).toBe(true)
    expect(getIsEarnQuoteRefreshLoading({ state: settledErrorState, isEarnFlow: true })).toBe(false)
  })
})

function createState(overrides: Partial<SwapReviewTransactionState>): SwapReviewTransactionState {
  return {
    acceptedDerivedSwapInfo: createDerivedSwapInfo({ hasAmounts: true }),
    acceptedTrade: createTrade({ earn: false }),
    blockingWarning: undefined,
    chainId: undefined,
    currencyInInfo: CURRENCY_INFO,
    currencyOutInfo: CURRENCY_INFO,
    derivedSwapInfo: createDerivedSwapInfo({ hasAmounts: true }),
    feeOnTransferProps: undefined,
    gasFee: { value: '0', isLoading: false, error: null },
    indicativeTrade: undefined,
    isWrap: false,
    newTradeRequiresAcceptance: false,
    onAcceptTrade: vi.fn(),
    reviewScreenWarning: undefined,
    swapTxContext: {},
    tokenWarningProps: {},
    trade: createTrade({ earn: false }),
    txSimulationErrors: undefined,
    uniswapXGasBreakdown: undefined,
    ...overrides,
  } as unknown as SwapReviewTransactionState
}

function createDerivedSwapInfo({
  hasAmounts,
  trade,
}: {
  hasAmounts: boolean
  trade?: {
    error?: Error
    isFetching?: boolean
    isLoading?: boolean
  }
}): SwapReviewTransactionState['derivedSwapInfo'] {
  return {
    currencyAmounts: {
      [CurrencyField.INPUT]: hasAmounts ? AMOUNT : undefined,
      [CurrencyField.OUTPUT]: hasAmounts ? AMOUNT : undefined,
    },
    trade: {
      error: trade?.error,
      isFetching: trade?.isFetching ?? false,
      isLoading: trade?.isLoading ?? false,
    },
  } as unknown as SwapReviewTransactionState['derivedSwapInfo']
}

function createTrade({ earn }: { earn: boolean }): Trade {
  return {
    routing: TradingApi.Routing.CHAINED,
    earnIntent: earn
      ? {
          action: TradingApi.EarnAction.DEPOSIT,
          vault: '0x0000000000000000000000000000000000000001',
          chainId: TradingApi.ChainId._1,
        }
      : undefined,
  } as unknown as Trade
}
