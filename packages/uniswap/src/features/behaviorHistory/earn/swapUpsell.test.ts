import { shouldShowEarnSwapUpsell } from 'uniswap/src/features/behaviorHistory/earn/swapUpsell'
import {
  permanentlyDismissEarnSwapUpsell,
  recordEarnSwapUpsellInteraction,
  recordEarnSwapUpsellQualifyingSwap,
  uniswapBehaviorHistoryReducer,
} from 'uniswap/src/features/behaviorHistory/slice'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import { describe, expect, it } from 'vitest'

const NOW_MS = 1_000_000_000
const USDC_CURRENCY_ID = '1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

describe(shouldShowEarnSwapUpsell, () => {
  it('shows the first upsell after the first qualifying swap', () => {
    expect(
      shouldShowEarnSwapUpsell({
        history: { qualifyingSwapCount: 1, interactionCount: 0 },
        nowMs: NOW_MS,
      }),
    ).toBe(true)
  })

  it('requires the third qualifying swap and three days after the first interaction', () => {
    expect(
      shouldShowEarnSwapUpsell({
        history: {
          qualifyingSwapCount: 3,
          interactionCount: 1,
          lastInteractionAtMs: NOW_MS - 3 * ONE_DAY_MS + 1,
        },
        nowMs: NOW_MS,
      }),
    ).toBe(false)

    expect(
      shouldShowEarnSwapUpsell({
        history: {
          qualifyingSwapCount: 3,
          interactionCount: 1,
          lastInteractionAtMs: NOW_MS - 3 * ONE_DAY_MS,
        },
        nowMs: NOW_MS,
      }),
    ).toBe(true)
  })

  it('requires the seventh qualifying swap and seven days after the second interaction', () => {
    expect(
      shouldShowEarnSwapUpsell({
        history: {
          qualifyingSwapCount: 6,
          interactionCount: 2,
          lastInteractionAtMs: NOW_MS - 8 * ONE_DAY_MS,
        },
        nowMs: NOW_MS,
      }),
    ).toBe(false)

    expect(
      shouldShowEarnSwapUpsell({
        history: {
          qualifyingSwapCount: 7,
          interactionCount: 2,
          lastInteractionAtMs: NOW_MS - 7 * ONE_DAY_MS,
        },
        nowMs: NOW_MS,
      }),
    ).toBe(true)
  })

  it('stops after three interactions or explicit permanent dismissal', () => {
    expect(
      shouldShowEarnSwapUpsell({
        history: { qualifyingSwapCount: 10, interactionCount: 3 },
        nowMs: NOW_MS,
      }),
    ).toBe(false)

    expect(
      shouldShowEarnSwapUpsell({
        history: {
          qualifyingSwapCount: 10,
          interactionCount: 0,
          permanentlyDismissed: true,
        },
        nowMs: NOW_MS,
      }),
    ).toBe(false)
  })
})

describe('earn swap upsell behavior history reducer', () => {
  it('counts each qualifying transaction once per token', () => {
    let state = uniswapBehaviorHistoryReducer(
      undefined,
      recordEarnSwapUpsellQualifyingSwap({
        tokenCurrencyId: USDC_CURRENCY_ID,
        transactionId: 'tx-1',
      }),
    )
    state = uniswapBehaviorHistoryReducer(
      state,
      recordEarnSwapUpsellQualifyingSwap({
        tokenCurrencyId: USDC_CURRENCY_ID,
        transactionId: 'tx-1',
      }),
    )
    state = uniswapBehaviorHistoryReducer(
      state,
      recordEarnSwapUpsellQualifyingSwap({
        tokenCurrencyId: USDC_CURRENCY_ID,
        transactionId: 'tx-2',
      }),
    )

    expect(state.earnSwapUpsell?.byTokenCurrencyId?.[USDC_CURRENCY_ID]).toMatchObject({
      qualifyingSwapCount: 2,
      countedTransactionIds: {
        'tx-1': true,
        'tx-2': true,
      },
    })
  })

  it('permanently dismisses a token after three user interactions', () => {
    let state = uniswapBehaviorHistoryReducer(
      undefined,
      recordEarnSwapUpsellInteraction({
        tokenCurrencyId: USDC_CURRENCY_ID,
        timestampMs: NOW_MS,
      }),
    )
    state = uniswapBehaviorHistoryReducer(
      state,
      recordEarnSwapUpsellInteraction({
        tokenCurrencyId: USDC_CURRENCY_ID,
        timestampMs: NOW_MS + 1,
      }),
    )
    state = uniswapBehaviorHistoryReducer(
      state,
      recordEarnSwapUpsellInteraction({
        tokenCurrencyId: USDC_CURRENCY_ID,
        timestampMs: NOW_MS + 2,
      }),
    )

    expect(state.earnSwapUpsell?.byTokenCurrencyId?.[USDC_CURRENCY_ID]).toMatchObject({
      interactionCount: 3,
      lastInteractionAtMs: NOW_MS + 2,
      permanentlyDismissed: true,
    })
  })

  it('can permanently dismiss a token without incrementing interactions', () => {
    const state = uniswapBehaviorHistoryReducer(
      undefined,
      permanentlyDismissEarnSwapUpsell({ tokenCurrencyId: USDC_CURRENCY_ID }),
    )

    expect(state.earnSwapUpsell?.byTokenCurrencyId?.[USDC_CURRENCY_ID]).toMatchObject({
      interactionCount: 0,
      qualifyingSwapCount: 0,
      permanentlyDismissed: true,
    })
  })

  it('keeps explicit permanent dismissal after later interactions', () => {
    const dismissedState = uniswapBehaviorHistoryReducer(
      undefined,
      permanentlyDismissEarnSwapUpsell({ tokenCurrencyId: USDC_CURRENCY_ID }),
    )
    const state = uniswapBehaviorHistoryReducer(
      dismissedState,
      recordEarnSwapUpsellInteraction({
        tokenCurrencyId: USDC_CURRENCY_ID,
        timestampMs: NOW_MS,
      }),
    )

    expect(state.earnSwapUpsell?.byTokenCurrencyId?.[USDC_CURRENCY_ID]).toMatchObject({
      interactionCount: 1,
      permanentlyDismissed: true,
    })
  })
})
