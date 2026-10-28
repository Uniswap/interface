import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import { getCloseConfirmDisabled, isCloseUnderwater } from '~/pages/Swap/Margin/marginCloseGate'

// Every gate satisfied for a debt-bearing close → Confirm enabled. Each field is flipped in isolation.
const READY = {
  canManage: true,
  hasAccount: true,
  hasDebt: true,
  hasQuote: true,
  isQuoteLoading: false,
  isDebouncing: false,
  isPlaceholderData: false,
  hasQuoteError: false,
  underwater: false,
  isPlanInFlight: false,
}

describe('getCloseConfirmDisabled', () => {
  it('enables confirm when every gate is satisfied', () => {
    expect(getCloseConfirmDisabled(READY)).toBe(false)
  })

  it('disables confirm when unmanageable, disconnected, or a plan is in flight', () => {
    expect(getCloseConfirmDisabled({ ...READY, canManage: false })).toBe(true)
    expect(getCloseConfirmDisabled({ ...READY, hasAccount: false })).toBe(true)
    expect(getCloseConfirmDisabled({ ...READY, isPlanInFlight: true })).toBe(true)
  })

  // The debt-free arm fetches its quote on press, and this term is the ONLY thing holding Confirm shut
  // for that round-trip — it sits ABOVE the `!hasDebt` short-circuit precisely so it still applies
  // there. Without it a second press mints a duplicate /margin/quote request.
  it('disables confirm while the debt-free quote is in flight, with or without debt', () => {
    expect(getCloseConfirmDisabled({ ...READY, isFetchingDebtFreeQuote: true })).toBe(true)
    expect(getCloseConfirmDisabled({ ...READY, hasDebt: false, hasQuote: false, isFetchingDebtFreeQuote: true })).toBe(
      true,
    )
  })

  it('disables confirm on a missing/loading/debouncing/bridged/errored/underwater quote when there is debt', () => {
    expect(getCloseConfirmDisabled({ ...READY, hasQuote: false })).toBe(true)
    expect(getCloseConfirmDisabled({ ...READY, isQuoteLoading: true })).toBe(true)
    expect(getCloseConfirmDisabled({ ...READY, isDebouncing: true })).toBe(true)
    expect(getCloseConfirmDisabled({ ...READY, isPlaceholderData: true })).toBe(true)
    expect(getCloseConfirmDisabled({ ...READY, hasQuoteError: true })).toBe(true)
    expect(getCloseConfirmDisabled({ ...READY, underwater: true })).toBe(true)
  })

  // A debt-free close does no swap → no quote is needed; only the account/in-flight gates apply.
  it('enables a debt-free close with no quote', () => {
    expect(
      getCloseConfirmDisabled({
        ...READY,
        hasDebt: false,
        hasQuote: false,
        isQuoteLoading: false,
      }),
    ).toBe(false)
  })

  it('still blocks a debt-free close while a plan is in flight', () => {
    expect(getCloseConfirmDisabled({ ...READY, hasDebt: false, hasQuote: false, isPlanInFlight: true })).toBe(true)
  })
})

describe('isCloseUnderwater', () => {
  // A long holds its collateral AS its exposure — collateral = size, both the volatile leg (18dp here).
  // equity/debt are '0' so they pin the branch: were the SHORT formula (equity + debt×mark) used for a
  // long, held would read 0 and `0.95 > 0` would flip the first assertion — the long branch is required.
  const LONG = {
    direction: MarginDirection.LONG,
    size: '2000000000000000000', // 2 WETH held
    equity: '0',
    debt: '0',
    collateralDecimals: 18,
    debtDecimals: 6,
    mark: 2000,
  }

  // A short's collateral is the STABLE counter leg (6dp), recovered as equity + debt×mark: 1000 USDC
  // equity + 1 WETH debt × $2000 = 3000 USDC held. `size` is the 18dp WETH debt leg, NOT the collateral.
  const SHORT = {
    direction: MarginDirection.SHORT,
    size: '1000000000000000000', // 1 WETH exposure (the debt leg)
    equity: '1000000000', // 1000 USDC
    debt: '1000000000000000000', // 1 WETH debt
    collateralDecimals: 6,
    debtDecimals: 18,
    mark: 2000, // USDC per WETH
  }

  it('is not underwater when there is no bound (debt-free / unquoted)', () => {
    expect(isCloseUnderwater({ ...LONG, maxCollateralIn: undefined })).toBe(false)
    expect(isCloseUnderwater({ ...SHORT, maxCollateralIn: undefined })).toBe(false)
  })

  it('measures a LONG against its exposure held in collateral units', () => {
    expect(isCloseUnderwater({ ...LONG, maxCollateralIn: '950000000000000000' })).toBe(false) // 0.95 < 2 WETH
    expect(isCloseUnderwater({ ...LONG, maxCollateralIn: '2100000000000000000' })).toBe(true) // 2.1 > 2 WETH
  })

  it('measures a SHORT against equity + debt×mark, not the debt-leg size', () => {
    expect(isCloseUnderwater({ ...SHORT, maxCollateralIn: '2900000000' })).toBe(false) // 2900 < 3000 USDC
    expect(isCloseUnderwater({ ...SHORT, maxCollateralIn: '3100000000' })).toBe(true) // 3100 > 3000 USDC
  })

  // The guard blocks a close that would revert, so an unmeasurable position must fall through it —
  // otherwise one oracle poll returning the absent-price sentinel strands the funds a close releases.
  // With no mark a SHORT's held collateral collapses to its equity alone (1000, not 3000), so the very
  // bound the case above passes as healthy would read as underwater.
  it('fails OPEN for a SHORT with no usable mark, rather than blocking its only exit', () => {
    expect(isCloseUnderwater({ ...SHORT, mark: undefined, maxCollateralIn: '2900000000' })).toBe(false)
  })

  // A LONG holds its collateral AS its exposure, so the mark never enters its balance sheet and a real
  // over-bound still blocks — the carve-out must not widen into a blanket bypass.
  it('still measures a LONG with no usable mark', () => {
    expect(isCloseUnderwater({ ...LONG, mark: undefined, maxCollateralIn: '2100000000000000000' })).toBe(true)
  })

  // A SHORT's `size` is its DEBT leg, so it carries the debt token's decimals. Decoding it at the
  // collateral's was inert only because the SHORT branch answers from `equity + debt x mark` and never
  // reads `exposure` — a ~1e12 error parked behind a coupling in another file.
  it('decodes a SHORT size at the debt leg decimals, so the verdict cannot ride on a 1e12 error', () => {
    // 3,100 USDC against the 3,000 the position holds — over the bound either way, but the exposure
    // figure feeding collateralHeld must be the honest one.
    expect(isCloseUnderwater({ ...SHORT, maxCollateralIn: '3100000000' })).toBe(true)
    expect(isCloseUnderwater({ ...SHORT, maxCollateralIn: '2900000000' })).toBe(false)
  })

  // The regression this guards: comparing the collateral bound to the raw 18dp `size` is always false
  // for a short (3.1e9 < 1e18), so an underwater short would slip past and revert on-chain.
  it('fires for an underwater SHORT whose bound is far below its raw debt-leg size', () => {
    expect(BigInt('3100000000') > BigInt(SHORT.size)).toBe(false) // the old comparison never fired
    expect(isCloseUnderwater({ ...SHORT, maxCollateralIn: '3100000000' })).toBe(true) // the fixed one does
  })
})
