import {
  MARGIN_ACTION_KEYS,
  MARGIN_EQUITY_ACTION_KEYS,
  type MarginActionKey,
  type MarginSwapConfig,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import {
  buildMarginOpenQuoteRequest,
  buildMarginQuoteRequest,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/buildMarginQuoteRequest'
import {
  buildMarginSwapConfig,
  type MarginQuoteSwapConfig,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginSwapConfig'
import {
  deriveMarginVenues,
  isDefaultMarginVenues,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginVenuePreferences'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'

const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

const BASE = {
  chainId: 1,
  exposureToken: WETH,
  counterToken: USDC,
  direction: 'LONG' as const,
  swapper: '0x1111111111111111111111111111111111111111',
}

// A complete rail — the only shape the input type admits.
const RAIL: MarginQuoteSwapConfig = { token: USDC, amount: '1', slippageTolerance: 0.5 }

const OPEN_INPUT = {
  ...BASE,
  leverage: 2,
  equityAmountRaw: '1000000000',
  paymentToken: USDC,
  paymentChainId: 1,
  slippageToleranceBps: 50,
  pairVenues: ['MORPHO', 'AAVE_V3'] as MarginVenue[],
  excludedVenues: [] as MarginVenue[],
}

describe('deriveMarginVenues', () => {
  it('is every pair venue when nothing is excluded', () => {
    expect(deriveMarginVenues({ pairVenues: ['MORPHO', 'AAVE_V3'], excludedVenues: [] })).toEqual(['AAVE_V3', 'MORPHO'])
  })

  it('sorts, so the same preference always produces the same query key', () => {
    expect(deriveMarginVenues({ pairVenues: ['MORPHO', 'AAVE_V4', 'AAVE_V3'], excludedVenues: [] })).toEqual(
      deriveMarginVenues({ pairVenues: ['AAVE_V3', 'MORPHO', 'AAVE_V4'], excludedVenues: [] }),
    )
  })

  it('dedupes', () => {
    expect(deriveMarginVenues({ pairVenues: ['MORPHO', 'MORPHO'], excludedVenues: [] })).toEqual(['MORPHO'])
  })

  it('drops exclusions, and ignores an exclusion the pair does not offer', () => {
    expect(deriveMarginVenues({ pairVenues: ['MORPHO', 'AAVE_V3'], excludedVenues: ['MORPHO', 'AAVE_V4'] })).toEqual([
      'AAVE_V3',
    ])
  })

  it('is empty when every venue the pair offers is excluded', () => {
    expect(deriveMarginVenues({ pairVenues: ['MORPHO'], excludedVenues: ['MORPHO'] })).toEqual([])
  })
})

describe('isDefaultMarginVenues', () => {
  it('is the empty exclusion set', () => {
    expect(isDefaultMarginVenues({ excludedVenues: [] })).toBe(true)
    expect(isDefaultMarginVenues({ excludedVenues: ['MORPHO'] })).toBe(false)
  })
})

describe('buildMarginOpenQuoteRequest', () => {
  it('carries the derived allowlist and BOTH slippage configs', () => {
    const request = buildMarginOpenQuoteRequest(OPEN_INPUT)
    expect(request).toEqual({
      chainId: 1,
      exposureToken: WETH,
      counterToken: USDC,
      direction: 'LONG',
      swapper: BASE.swapper,
      slippageTolerance: 0.5,
      swapConfig: { token: USDC, chainId: 1, amount: '1000000000', slippageTolerance: 0.5 },
      open: { leverageTarget: '2.00', venues: ['AAVE_V3', 'MORPHO'] },
    })
  })

  it('drops the excluded venues from the allowlist', () => {
    expect(buildMarginOpenQuoteRequest({ ...OPEN_INPUT, excludedVenues: ['MORPHO'] })?.open?.venues).toEqual([
      'AAVE_V3',
    ])
  })

  // Compound rides the same allowlist as every other venue — nothing about the request shape is
  // venue-specific, so enabling it on the wire is enough to have it quoted.
  it('carries COMPOUND_V3 through to the wire allowlist', () => {
    expect(buildMarginOpenQuoteRequest({ ...OPEN_INPUT, pairVenues: ['MORPHO', 'COMPOUND_V3'] })?.open?.venues).toEqual(
      ['COMPOUND_V3', 'MORPHO'],
    )
    expect(
      buildMarginOpenQuoteRequest({ ...OPEN_INPUT, pairVenues: ['MORPHO', 'COMPOUND_V3'], excludedVenues: ['MORPHO'] })
        ?.open?.venues,
    ).toEqual(['COMPOUND_V3'])
  })

  // An empty `venues` must never reach the wire: `open` requires >= 1, so the absent request is what
  // leaves the quote query disabled.
  it('builds nothing when every venue for the pair is excluded', () => {
    expect(buildMarginOpenQuoteRequest({ ...OPEN_INPUT, excludedVenues: ['MORPHO', 'AAVE_V3'] })).toBeUndefined()
  })

  it('builds nothing when the pair has no venues at all', () => {
    expect(buildMarginOpenQuoteRequest({ ...OPEN_INPUT, pairVenues: [] })).toBeUndefined()
  })

  it('builds nothing without an amount, a zero amount, or a swapper', () => {
    expect(buildMarginOpenQuoteRequest({ ...OPEN_INPUT, equityAmountRaw: undefined })).toBeUndefined()
    expect(buildMarginOpenQuoteRequest({ ...OPEN_INPUT, equityAmountRaw: '0' })).toBeUndefined()
    expect(buildMarginOpenQuoteRequest({ ...OPEN_INPUT, swapper: undefined })).toBeUndefined()
  })

  it('sends leverage as a decimal string, never a WAD', () => {
    expect(buildMarginOpenQuoteRequest({ ...OPEN_INPUT, leverage: 3.456 })?.open?.leverageTarget).toBe('3.46')
  })
})

// The BE's swapConfig schema (margin-quote/schema.ts): `token` required, `amount` required, EXACTLY
// one of slippageTolerance/autoSlippage, `chainId` only alongside `token`, and unknown(false) — so a
// rail that misses any of these 400s the whole quote rather than degrading.
function expectWireLegalRail(swapConfig: MarginSwapConfig | undefined): void {
  expect(swapConfig).toBeDefined()
  expect(swapConfig?.token).toBeTruthy()
  expect(swapConfig?.amount).toBeTruthy()
  const tolerances = [swapConfig?.slippageTolerance, swapConfig?.autoSlippage].filter((v) => v !== undefined)
  expect(tolerances).toHaveLength(1)
  if (swapConfig?.chainId !== undefined) {
    expect(swapConfig.token).toBeTruthy()
  }
  expect(swapConfig?.minAmount).toBeUndefined()
  expect(swapConfig?.minBridgeOut).toBeUndefined()
}

describe('the emitted swapConfig is wire-legal on every equity key', () => {
  it.each(MARGIN_EQUITY_ACTION_KEYS.filter((key) => key !== 'open'))('%s', (actionKey) => {
    const request = buildMarginQuoteRequest({
      ...BASE,
      actionKey,
      positionId: '3',
      leverageTarget: '3',
      slippageTolerance: 0.5,
      swapConfig: buildMarginSwapConfig({
        token: USDC,
        chainId: 1,
        amountRaw: '1000000',
        slippageToleranceBps: 50,
      }),
    })
    expectWireLegalRail(request?.swapConfig)
  })

  it('open', () => {
    expectWireLegalRail(buildMarginOpenQuoteRequest(OPEN_INPUT)?.swapConfig)
  })

  it('and is absent on every key that moves no equity', () => {
    const equityKeys: ReadonlySet<MarginActionKey> = new Set(MARGIN_EQUITY_ACTION_KEYS)
    for (const actionKey of MARGIN_ACTION_KEYS.filter((key) => !equityKeys.has(key))) {
      const request = buildMarginQuoteRequest({
        ...BASE,
        actionKey,
        positionId: '3',
        leverageTarget: '3',
        slippageTolerance: 0.5,
        swapConfig: RAIL,
      })
      expect(request?.swapConfig).toBeUndefined()
    }
  })
})

describe('buildMarginSwapConfig', () => {
  it('always carries exactly one tolerance — a bare bps setting becomes a concrete percent', () => {
    expect(buildMarginSwapConfig({ token: USDC, amountRaw: '1', slippageToleranceBps: 50 })).toEqual({
      token: USDC,
      amount: '1',
      slippageTolerance: 0.5,
    })
  })

  it('lets an explicit auto selection displace the percent, never ride beside it', () => {
    expect(
      buildMarginSwapConfig({ token: USDC, amountRaw: '1', slippageToleranceBps: 50, autoSlippage: 'DEFAULT' }),
    ).toEqual({ token: USDC, amount: '1', autoSlippage: 'DEFAULT' })
  })

  it('builds nothing rather than a partial rail', () => {
    expect(buildMarginSwapConfig({ token: '', amountRaw: '1', slippageToleranceBps: 50 })).toBeUndefined()
    expect(buildMarginSwapConfig({ token: USDC, amountRaw: undefined, slippageToleranceBps: 50 })).toBeUndefined()
    expect(buildMarginSwapConfig({ token: USDC, amountRaw: '0', slippageToleranceBps: 50 })).toBeUndefined()
  })
})

describe('buildMarginQuoteRequest', () => {
  it('requires a swapper on every key', () => {
    expect(
      buildMarginQuoteRequest({
        ...BASE,
        swapper: undefined,
        actionKey: 'close',
        positionId: '3',
        slippageTolerance: 0.5,
      }),
    ).toBeUndefined()
  })

  it('requires a positionId on every manage key', () => {
    for (const actionKey of MARGIN_ACTION_KEYS.filter((key) => key !== 'open')) {
      expect(
        buildMarginQuoteRequest({
          ...BASE,
          actionKey,
          leverageTarget: '3',
          slippageTolerance: 0.5,
          swapConfig: RAIL,
        }),
      ).toBeUndefined()
    }
  })

  it('forbids the leverage-leg tolerance on the two keys with no leverage swap', () => {
    for (const actionKey of ['addEquity', 'withdrawEquity'] as const) {
      const request = buildMarginQuoteRequest({
        ...BASE,
        actionKey,
        positionId: '3',
        slippageTolerance: 0.5,
        protocols: ['V3'],
        swapConfig: RAIL,
      })
      expect(request?.slippageTolerance).toBeUndefined()
      expect(request?.protocols).toBeUndefined()
    }
  })

  it('requires the leverage-leg tolerance on every key that swaps', () => {
    for (const actionKey of MARGIN_ACTION_KEYS.filter(
      (key) => key !== 'addEquity' && key !== 'withdrawEquity',
    ) as MarginActionKey[]) {
      expect(
        buildMarginQuoteRequest({
          ...BASE,
          actionKey,
          positionId: '3',
          leverageTarget: '3',
          venues: ['MORPHO'],
          swapConfig: RAIL,
        }),
      ).toBeUndefined()
    }
  })

  it('requires a swapConfig amount on every key that names an equity direction', () => {
    for (const actionKey of [
      'addEquity',
      'withdrawEquity',
      'addEquityAndIncreaseLeverage',
      'addEquityAndDecreaseLeverage',
      'withdrawEquityAndIncreaseLeverage',
      'withdrawEquityAndDecreaseLeverage',
    ] as const) {
      expect(
        buildMarginQuoteRequest({
          ...BASE,
          actionKey,
          positionId: '3',
          leverageTarget: '3',
          slippageTolerance: 0.5,
        }),
      ).toBeUndefined()
    }
  })

  it('carries no rail on the keys that move no equity', () => {
    for (const actionKey of ['close', 'increaseLeverage', 'decreaseLeverage'] as const) {
      const request = buildMarginQuoteRequest({
        ...BASE,
        actionKey,
        positionId: '3',
        leverageTarget: '3',
        slippageTolerance: 0.5,
        swapConfig: RAIL,
      })
      expect(request?.swapConfig).toBeUndefined()
    }
  })

  // The wire requires `token` unconditionally: on a withdrawal it names what the user gets BACK, so
  // stripping it would 400 every withdraw quote.
  it('keeps the token on a withdrawal', () => {
    const request = buildMarginQuoteRequest({
      ...BASE,
      actionKey: 'withdrawEquityAndDecreaseLeverage',
      positionId: '3',
      leverageTarget: '1.5',
      slippageTolerance: 0.5,
      swapConfig: { token: USDC, chainId: 8453, amount: '250000', slippageTolerance: 0.5 },
    })
    expect(request?.swapConfig).toEqual({ token: USDC, chainId: 8453, amount: '250000', slippageTolerance: 0.5 })
  })

  it('keeps the rail slippage independent of the leverage leg', () => {
    const request = buildMarginQuoteRequest({
      ...BASE,
      actionKey: 'addEquity',
      positionId: '3',
      swapConfig: { ...RAIL, slippageTolerance: 1.25 },
    })
    expect(request?.swapConfig?.slippageTolerance).toBe(1.25)
    expect(request?.slippageTolerance).toBeUndefined()
  })

  it('emits autoSlippage instead of a percent when the rail names one', () => {
    const request = buildMarginQuoteRequest({
      ...BASE,
      actionKey: 'addEquity',
      positionId: '3',
      swapConfig: { token: USDC, amount: '1', autoSlippage: 'DEFAULT' },
    })
    expect(request?.swapConfig).toEqual({ token: USDC, amount: '1', autoSlippage: 'DEFAULT' })
  })

  it('requires a leverageTarget on every key that moves leverage, and sets none on the rest', () => {
    for (const actionKey of [
      'increaseLeverage',
      'decreaseLeverage',
      'addEquityAndIncreaseLeverage',
      'addEquityAndDecreaseLeverage',
      'withdrawEquityAndIncreaseLeverage',
      'withdrawEquityAndDecreaseLeverage',
    ] as const) {
      expect(
        buildMarginQuoteRequest({
          ...BASE,
          actionKey,
          positionId: '3',
          slippageTolerance: 0.5,
          swapConfig: RAIL,
        }),
      ).toBeUndefined()
    }
    const addEquity = buildMarginQuoteRequest({
      ...BASE,
      actionKey: 'addEquity',
      positionId: '3',
      leverageTarget: '3',
      swapConfig: RAIL,
    })
    expect(addEquity?.addEquity).toEqual({ positionId: '3' })
  })

  it('sets exactly one action key', () => {
    const request = buildMarginQuoteRequest({
      ...BASE,
      actionKey: 'addEquityAndIncreaseLeverage',
      positionId: '7',
      leverageTarget: '4',
      slippageTolerance: 0.5,
      swapConfig: RAIL,
    })
    const setKeys = MARGIN_ACTION_KEYS.filter((key) => request?.[key] !== undefined)
    expect(setKeys).toEqual(['addEquityAndIncreaseLeverage'])
    expect(request?.addEquityAndIncreaseLeverage).toEqual({ positionId: '7', leverageTarget: '4' })
  })

  it('never lets a manage key name a venue', () => {
    const request = buildMarginQuoteRequest({
      ...BASE,
      actionKey: 'close',
      positionId: '3',
      slippageTolerance: 0.5,
      venues: ['MORPHO'],
    })
    expect(request).toBeDefined()
    expect(JSON.stringify(request)).not.toContain('MORPHO')
  })
})
