import { renderHook } from '@testing-library/react'
import { type Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useIsStepValid } from '~/pages/Liquidity/CreateAuction/hooks/useIsStepValid'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import {
  type CreateAuctionStore,
  createCreateAuctionStore,
} from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { minimumAuctionSupplyDeposit } from '~/pages/Liquidity/CreateAuction/store/postAuctionLiquidityAllocationState'
import { CreateAuctionStep } from '~/pages/Liquidity/CreateAuction/types'
import { getMinStartTime, MS_PER_DAY } from '~/pages/Liquidity/CreateAuction/utils/duration'

/**
 * Builds a store committed to a new-token auction with valid start/end times and a floor price, so
 * the CONFIGURE_AUCTION step is valid except for whatever a test mutates next. Times are relative to
 * `now` so the lead-time check (`now + 1m`) holds regardless of when the suite runs.
 */
function buildConfiguredStore(): CreateAuctionStore {
  const store = createCreateAuctionStore()
  const { actions } = store.getState()
  actions.commitTokenFormAndAdvance()
  actions.setStartTime(new Date(Date.now() + MS_PER_DAY))
  actions.setEndTime(new Date(Date.now() + 6 * MS_PER_DAY))
  actions.setFloorPrice('0.1')
  return store
}

function renderStepValid(store: CreateAuctionStore, step: CreateAuctionStep): boolean {
  const { result } = renderHook(() => useIsStepValid(step), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(CreateAuctionStoreContext.Provider, { value: store }, children),
  })
  return result.current
}

function committedCurrency(store: CreateAuctionStore): Currency {
  return store.getState().configureAuction.committed!.auctionSupplyAmount.currency
}

function minDepositFor(store: CreateAuctionStore): CurrencyAmount<Currency> {
  const { configureAuction } = store.getState()
  return minimumAuctionSupplyDeposit(committedCurrency(store), configureAuction.postAuctionLiquidityAllocation)
}

describe('useIsStepValid', () => {
  it('validates a fully configured auction step', () => {
    const store = buildConfiguredStore()
    expect(renderStepValid(store, CreateAuctionStep.CONFIGURE_AUCTION)).toBe(true)
  })

  it('rejects a deposit one base unit below the minimum two-leg supply', () => {
    const store = buildConfiguredStore()
    const currency = committedCurrency(store)
    const belowMin = minDepositFor(store).subtract(CurrencyAmount.fromRawAmount(currency, 1))
    store.getState().actions.setAuctionConfig({ auctionSupplyAmount: belowMin })

    expect(renderStepValid(store, CreateAuctionStep.CONFIGURE_AUCTION)).toBe(false)
  })

  it('accepts a deposit exactly at the minimum two-leg supply', () => {
    const store = buildConfiguredStore()
    store.getState().actions.setAuctionConfig({ auctionSupplyAmount: minDepositFor(store) })

    expect(renderStepValid(store, CreateAuctionStep.CONFIGURE_AUCTION)).toBe(true)
  })

  it('rejects the configure step before the token form is committed', () => {
    const store = createCreateAuctionStore()
    expect(renderStepValid(store, CreateAuctionStep.CONFIGURE_AUCTION)).toBe(false)
  })

  it('accepts a start time at the picker minimum lead', () => {
    // The earliest start the picker allows must satisfy the proceed lead-time check,
    // otherwise picking the minimum start would immediately block the continue button.
    const store = buildConfiguredStore()
    store.getState().actions.setStartTime(getMinStartTime())
    expect(renderStepValid(store, CreateAuctionStep.CONFIGURE_AUCTION)).toBe(true)
  })

  it('rejects a start time below the proceed lead time', () => {
    const store = buildConfiguredStore()
    store.getState().actions.setStartTime(new Date())
    expect(renderStepValid(store, CreateAuctionStep.CONFIGURE_AUCTION)).toBe(false)
  })

  it('always allows the review step', () => {
    expect(renderStepValid(buildConfiguredStore(), CreateAuctionStep.REVIEW_LAUNCH)).toBe(true)
  })
})
