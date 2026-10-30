import { TradingApi } from '@universe/api'
import { MARGIN_ACTION_KEYS, MARGIN_EQUITY_ACTION_KEYS } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
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
  positionChainId: 1,
  exposureToken: WETH,
  counterToken: USDC,
  direction: TradingApi.MarginDirection.LONG,
  swapper: '0x1111111111111111111111111111111111111111',
}

// A complete rail — token, its chain (the wire's walletChainId peer is required on every wallet key),
// amount, and the pay-in swap's tolerance.
const RAIL: MarginQuoteSwapConfig = { token: USDC, chainId: 1, amount: '1', slippageTolerance: 0.5 }

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

// The request is a discriminated union over the ten action keys; these read a member's fields through
// the `in` narrowing the consumers use, so a wire shape change surfaces here rather than needing a cast.
type AnyRequest = TradingApi.MarginQuoteRequest | undefined
function openVenues(request: AnyRequest): string[] | undefined {
  return request && 'open' in request ? request.open.venues : undefined
}
function openLeverageTarget(request: AnyRequest): string | undefined {
  return request && 'open' in request ? request.open.leverageTarget : undefined
}
function railSwapConfig(request: AnyRequest): TradingApi.MarginSwapConfig | undefined {
  return request && 'swapConfig' in request ? request.swapConfig : undefined
}
function walletToken(request: AnyRequest): string | undefined {
  return request && 'walletToken' in request ? request.walletToken : undefined
}
function leverageLegTolerance(request: AnyRequest): number | undefined {
  return request && 'slippageTolerance' in request ? request.slippageTolerance : undefined
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
  it('fans the rail across the envelope, the action, and swapConfig, and carries both allowlist + slippage', () => {
    // The wire splits what the FE models as one rail: walletToken/walletChainId ride the envelope, the
    // equity amount rides open.amount, and only the pay-in swap's slippage stays on swapConfig.
    expect(buildMarginOpenQuoteRequest(OPEN_INPUT)).toEqual({
      positionChainId: 1,
      exposureToken: WETH,
      counterToken: USDC,
      direction: TradingApi.MarginDirection.LONG,
      swapper: BASE.swapper,
      walletToken: USDC,
      walletChainId: 1,
      slippageTolerance: 0.5,
      swapConfig: { slippageTolerance: 0.5 },
      open: { leverageTarget: '2.00', venues: ['AAVE_V3', 'MORPHO'], amount: '1000000000' },
    })
  })

  it('drops the excluded venues from the allowlist', () => {
    expect(openVenues(buildMarginOpenQuoteRequest({ ...OPEN_INPUT, excludedVenues: ['MORPHO'] }))).toEqual(['AAVE_V3'])
  })

  // COMPOUND_V3 exists in the FE venue union but has no wire enum member (the BE admits only
  // MORPHO/AAVE_V3/AAVE_V4), so the builder drops it rather than sending a venue the server would 400.
  it('drops COMPOUND_V3, which has no wire venue', () => {
    expect(openVenues(buildMarginOpenQuoteRequest({ ...OPEN_INPUT, pairVenues: ['MORPHO', 'COMPOUND_V3'] }))).toEqual([
      'MORPHO',
    ])
    // Excluding every WIRE venue leaves nothing quotable even though COMPOUND_V3 was "selected".
    expect(
      buildMarginOpenQuoteRequest({ ...OPEN_INPUT, pairVenues: ['MORPHO', 'COMPOUND_V3'], excludedVenues: ['MORPHO'] }),
    ).toBeUndefined()
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
    expect(openLeverageTarget(buildMarginOpenQuoteRequest({ ...OPEN_INPUT, leverage: 3.456 }))).toBe('3.46')
  })
})

// The current wire splits the wallet-side rail: walletToken/walletChainId on the envelope and the
// equity magnitude on the action key, leaving swapConfig to carry ONLY the pay-in swap's slippage (the
// BE's SWAP_CONFIG_SCHEMA forbids autoSlippage and the server-authored floors). Assert that split.
function expectWalletFunded(request: AnyRequest): void {
  expect(request).toBeDefined()
  expect(walletToken(request)).toBeTruthy()
  const swapConfig = railSwapConfig(request)
  expect(swapConfig).toBeDefined()
  expect(swapConfig?.slippageTolerance).toBeTypeOf('number')
}

describe('every equity key carries a wallet-funded rail', () => {
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
    expectWalletFunded(request)
  })

  it('open', () => {
    expectWalletFunded(buildMarginOpenQuoteRequest(OPEN_INPUT))
  })

  // Only the two PURE leverage moves carry no wallet rail. `close` pays OUT through a swap, so it names
  // walletToken (what the swapper receives) and a swapConfig like the equity keys.
  it('and no wallet rail rides a pure leverage move', () => {
    for (const actionKey of ['increaseLeverage', 'decreaseLeverage'] as const) {
      const request = buildMarginQuoteRequest({
        ...BASE,
        actionKey,
        positionId: '3',
        leverageTarget: '3',
        slippageTolerance: 0.5,
        swapConfig: RAIL,
      })
      expect(walletToken(request)).toBeUndefined()
      expect(railSwapConfig(request)).toBeUndefined()
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
        swapConfig: RAIL,
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
        swapConfig: RAIL,
      })
      expect(leverageLegTolerance(request)).toBeUndefined()
    }
  })

  it('requires the leverage-leg tolerance on every key that swaps', () => {
    for (const actionKey of MARGIN_ACTION_KEYS.filter((key) => key !== 'addEquity' && key !== 'withdrawEquity')) {
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

  it('requires a rail amount on every key that names an equity direction', () => {
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

  it('carries no rail on the two pure leverage moves', () => {
    for (const actionKey of ['increaseLeverage', 'decreaseLeverage'] as const) {
      const request = buildMarginQuoteRequest({
        ...BASE,
        actionKey,
        positionId: '3',
        leverageTarget: '3',
        slippageTolerance: 0.5,
        swapConfig: RAIL,
      })
      expect(railSwapConfig(request)).toBeUndefined()
      expect(walletToken(request)).toBeUndefined()
    }
  })

  // close pays out through a swap, so unlike a pure leverage move it DOES carry a wallet rail.
  it('carries a wallet rail on close', () => {
    const request = buildMarginQuoteRequest({
      ...BASE,
      actionKey: 'close',
      positionId: '3',
      slippageTolerance: 0.5,
      swapConfig: RAIL,
    })
    expect(walletToken(request)).toBe(USDC)
    expect(railSwapConfig(request)).toEqual({ slippageTolerance: 0.5 })
  })

  // The wire names the pay/receive token at the envelope on a withdrawal too (it is what the user gets
  // BACK), the amount on the action key, and leaves only slippage on swapConfig.
  it('fans a withdrawal rail across envelope, action, and swapConfig', () => {
    const request = buildMarginQuoteRequest({
      ...BASE,
      actionKey: 'withdrawEquityAndDecreaseLeverage',
      positionId: '3',
      leverageTarget: '1.5',
      slippageTolerance: 0.5,
      swapConfig: { token: USDC, chainId: 8453, amount: '250000', slippageTolerance: 0.5 },
    })
    expect(walletToken(request)).toBe(USDC)
    expect(request && 'walletChainId' in request ? request.walletChainId : undefined).toBe(8453)
    expect(railSwapConfig(request)).toEqual({ slippageTolerance: 0.5 })
    expect(
      request && 'withdrawEquityAndDecreaseLeverage' in request
        ? request.withdrawEquityAndDecreaseLeverage.amount
        : undefined,
    ).toBe('250000')
  })

  it('keeps the rail slippage independent of the leverage leg', () => {
    const request = buildMarginQuoteRequest({
      ...BASE,
      actionKey: 'addEquity',
      positionId: '3',
      swapConfig: { ...RAIL, slippageTolerance: 1.25 },
    })
    expect(railSwapConfig(request)?.slippageTolerance).toBe(1.25)
    expect(leverageLegTolerance(request)).toBeUndefined()
  })

  // Margin's SWAP_CONFIG_SCHEMA forbids autoSlippage on the pay-in swap, so an auto-only rail is not a
  // legal margin request: the builder refuses it rather than sending an unbounded swap.
  it('refuses an auto-only rail (margin forbids autoSlippage on the pay-in swap)', () => {
    const request = buildMarginQuoteRequest({
      ...BASE,
      actionKey: 'addEquity',
      positionId: '3',
      swapConfig: { token: USDC, amount: '1', autoSlippage: 'DEFAULT' },
    })
    expect(request).toBeUndefined()
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
    expect(addEquity && 'addEquity' in addEquity ? addEquity.addEquity : undefined).toEqual({
      positionId: '3',
      amount: '1',
    })
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
    const setKeys = MARGIN_ACTION_KEYS.filter((key) => request !== undefined && key in request)
    expect(setKeys).toEqual(['addEquityAndIncreaseLeverage'])
    expect(
      request && 'addEquityAndIncreaseLeverage' in request ? request.addEquityAndIncreaseLeverage : undefined,
    ).toEqual({ positionId: '7', leverageTarget: '4', amount: '1' })
  })

  it('never lets a manage key name a venue', () => {
    const request = buildMarginQuoteRequest({
      ...BASE,
      actionKey: 'close',
      positionId: '3',
      slippageTolerance: 0.5,
      swapConfig: RAIL,
      venues: ['MORPHO'],
    })
    expect(request).toBeDefined()
    expect(JSON.stringify(request)).not.toContain('MORPHO')
  })
})
