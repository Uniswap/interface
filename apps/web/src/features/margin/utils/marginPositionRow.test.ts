import { MARGIN_POSITIONS_WIRE_PNL_ACTIVE } from 'uniswap/src/data/apiClients/tradingApi/__fixtures__/marginPositionsWirePnl'
import type {
  MarginActivePosition,
  MarginMarketRow,
  MarginTerminalPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { toMarginPositionsView } from 'uniswap/src/data/apiClients/tradingApi/marginPositionsView'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import {
  hasMarginOpenedAt,
  hasMarginPositionBasis,
  isMarginActivePosition,
  marginCurrentLeverage,
  marginLeverageAtOpen,
  marginMarketRowTokens,
  marginOpenedLeverage,
  marginPositionAccount,
  marginPositionDebt,
  marginPositionLegDebt,
  marginPositionSubId,
  marginPositionTokens,
  marginPositionVenue,
} from '~/features/margin/utils/marginPositionRow'

const WETH = { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chainId: 1, decimals: 18 }
const USDC = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: 1, decimals: 6 }

// A LONG borrows the counter token against exposure collateral; a SHORT is the reverse. The wire
// speaks only trader terms now, so every venue-term consumer goes through these helpers.
function activeFixture(overrides: Partial<MarginActivePosition> = {}): MarginActivePosition {
  return {
    status: 'ACTIVE',
    positionId: '3',
    direction: MarginDirection.LONG,
    exposureToken: WETH,
    counterToken: USDC,
    size: '1000000000000000000',
    entryPrice: '2000000000000000000000',
    openedAt: '1700000000',
    legs: [{ venue: 'MORPHO', subId: '7', account: '0x000000000000000000000000000000000000000A', debt: '500000000' }],
    isTradable: true,
    equity: '1000000000000000000',
    oraclePrice: '2000000000000000000000',
    liquidationPrice: '1000000000000000000000',
    buffer: '500000000000000000',
    healthFactor: '1500000000000000000',
    maxWithdrawable: '400000000000000000',
    leverage: '1.5',
    ...overrides,
  }
}

function terminalFixture(overrides: Partial<MarginTerminalPosition> = {}): MarginTerminalPosition {
  return {
    status: 'COMPLETED',
    positionId: '4',
    direction: MarginDirection.LONG,
    exposureToken: WETH,
    counterToken: USDC,
    size: '1000000000000000000',
    entryPrice: '2000000000000000000000',
    openedAt: '1700000000',
    legs: [{ venue: 'AAVE_V3', subId: '9', account: '0x000000000000000000000000000000000000000B', debt: '0' }],
    isTradable: true,
    closedAt: '1700100000',
    ...overrides,
  }
}

describe('marginPositionTokens', () => {
  it('reads a LONG as exposure-collateral / counter-debt', () => {
    expect(marginPositionTokens(activeFixture())).toEqual({
      collateralToken: WETH.address,
      collateralDecimals: 18,
      debtToken: USDC.address,
      debtDecimals: 6,
    })
  })

  // A short's exposure IS its debt leg — swapping these silently divides amounts by the wrong decimals.
  it('flips the legs for a SHORT', () => {
    expect(marginPositionTokens(activeFixture({ direction: MarginDirection.SHORT }))).toEqual({
      collateralToken: USDC.address,
      collateralDecimals: 6,
      debtToken: WETH.address,
      debtDecimals: 18,
    })
  })
})

describe('marginMarketRowTokens', () => {
  it('applies the same direction rule to a markets row', () => {
    const row = {
      exposureToken: WETH,
      counterToken: USDC,
      direction: MarginDirection.SHORT,
    } as MarginMarketRow
    expect(marginMarketRowTokens(row)).toMatchObject({ collateralToken: USDC.address, debtToken: WETH.address })
  })
})

describe('isMarginActivePosition', () => {
  it('narrows on status, so terminal rows never reach ACTIVE-only fields', () => {
    expect(isMarginActivePosition(activeFixture())).toBe(true)
    expect(isMarginActivePosition(terminalFixture())).toBe(false)
    expect(isMarginActivePosition(terminalFixture({ status: 'LIQUIDATED' }))).toBe(false)
    expect(isMarginActivePosition(terminalFixture({ status: 'PARTIALLY_LIQUIDATED' }))).toBe(false)
  })
})

describe('leg accessors', () => {
  it('read venue identity off the single v1 leg', () => {
    const position = activeFixture()
    expect(marginPositionVenue(position)).toBe('MORPHO')
    expect(marginPositionSubId(position)).toBe('7')
    expect(marginPositionAccount(position)).toBe('0x000000000000000000000000000000000000000A')
    expect(marginPositionDebt(position)).toBe('500000000')
  })

  // A row the wire sent leg-less must degrade, never throw — the table renders it either way.
  it('degrade to undefined (and a zero debt) with no legs', () => {
    const legless = activeFixture({ legs: [] })
    expect(marginPositionVenue(legless)).toBeUndefined()
    expect(marginPositionSubId(legless)).toBeUndefined()
    expect(marginPositionAccount(legless)).toBeUndefined()
    expect(marginPositionDebt(legless)).toBe('0')
  })

  // The display reader's '0' is a rendering convenience; anything VALUING the position needs to tell an
  // unknown debt from a settled one, or it reports a debt-free balance sheet for a levered position.
  it('separates an unknown debt from a settled one', () => {
    expect(marginPositionLegDebt(activeFixture())).toBe('500000000')
    expect(marginPositionLegDebt(activeFixture({ legs: [] }))).toBeUndefined()
    expect(marginPositionDebt(activeFixture({ legs: [] }))).toBe('0')
  })
})

// '0' is the documented sentinel for a basis the server cannot attribute; it replaced the old
// "costBasis is present" gate, and dropping it would render a $0 entry price as real.
// The narrower of the two gates: a calendar age needs an open TIME and nothing else, so it must stay
// independent of the entry price or every age-derived figure disappears with a missing mark.
describe('hasMarginPositionBasis — non-numeric entry prices', () => {
  // '' and '0.0' are the same fact as '0'; a literal `!== '0'` let both through and left downstream
  // Number(entryPrice) to produce 0 or NaN.
  it('rejects an entry price that is not a positive number', () => {
    for (const entryPrice of ['0', '', '0.0', 'not-a-price']) {
      expect(hasMarginPositionBasis(activeFixture({ entryPrice }))).toBe(false)
    }
  })
})

describe('hasMarginOpenedAt', () => {
  it('admits a real timestamp regardless of whether an entry price was stamped', () => {
    expect(hasMarginOpenedAt(activeFixture())).toBe(true)
    expect(hasMarginOpenedAt(activeFixture({ entryPrice: '0' }))).toBe(true)
  })

  it('rejects the zero sentinel and anything that is not a positive number', () => {
    expect(hasMarginOpenedAt(activeFixture({ openedAt: '0' }))).toBe(false)
    expect(hasMarginOpenedAt(activeFixture({ openedAt: '' }))).toBe(false)
    expect(hasMarginOpenedAt(activeFixture({ openedAt: 'not-a-time' }))).toBe(false)
  })
})

describe('hasMarginPositionBasis', () => {
  it('is true only when both entryPrice and openedAt are attributable', () => {
    expect(hasMarginPositionBasis(activeFixture())).toBe(true)
    expect(hasMarginPositionBasis(activeFixture({ entryPrice: '0' }))).toBe(false)
    expect(hasMarginPositionBasis(activeFixture({ openedAt: '0' }))).toBe(false)
  })
})

describe('marginOpenedLeverage', () => {
  it('reads a recorded ratio', () => {
    expect(marginOpenedLeverage(activeFixture({ openedLeverage: '2.5' }))).toBe(2.5)
  })

  // '0' is the indexer's "never recorded" stamp and is not nullish, so an absent-only check would
  // report a fabricated 0x on every surface that states an open-time leverage.
  it('reports nothing for an absent, zero, negative or malformed ratio', () => {
    for (const openedLeverage of [undefined, '0', '-3', 'abc', '', 'Infinity']) {
      expect(marginOpenedLeverage(activeFixture({ openedLeverage }))).toBeUndefined()
    }
  })
})

// One wallet's four served longs, mapped through the client boundary as the table receives them.
const WIRE_ACTIVE = toMarginPositionsView(MARGIN_POSITIONS_WIRE_PNL_ACTIVE).positions.filter(isMarginActivePosition)

function wireMorphoRow(): MarginActivePosition {
  return WIRE_ACTIVE[0]
}

describe('marginLeverageAtOpen', () => {
  // The wire stamps no openedLeverage; collateralAtOpen / depositedEquity is the ratio each was opened at.
  it('derives a LONG ratio from collateralAtOpen / depositedEquity on served rows', () => {
    expect(WIRE_ACTIVE.map((position) => marginLeverageAtOpen(position)?.toFixed(2))).toEqual([
      '2.00',
      '1.10',
      '2.00',
      '2.00',
    ])
  })

  it('prefers a stamped openedLeverage', () => {
    expect(marginLeverageAtOpen({ ...wireMorphoRow(), openedLeverage: '2.4' })).toBe(2.4)
  })

  it('reports nothing where either input is absent, zero or malformed', () => {
    const base = activeFixture({ collateralAtOpen: '2000000000000000000', depositedEquity: '1000000000000000000' })
    expect(marginLeverageAtOpen(base)).toBe(2)
    for (const overrides of [
      { collateralAtOpen: undefined },
      { depositedEquity: undefined },
      { collateralAtOpen: '0' },
      { depositedEquity: '0' },
      { depositedEquity: 'abc' },
      { collateralAtOpen: '-1' },
    ]) {
      expect(marginLeverageAtOpen({ ...base, ...overrides })).toBeUndefined()
    }
  })

  // A short's collateral is the counter token, so the exposure-unit ratio does not apply to it.
  it('reports nothing for an unstamped SHORT', () => {
    const position = activeFixture({
      direction: MarginDirection.SHORT,
      collateralAtOpen: '3000000',
      depositedEquity: '1000000',
    })
    expect(marginLeverageAtOpen(position)).toBeUndefined()
  })
})

describe('marginCurrentLeverage', () => {
  it('reads the served leverage', () => {
    expect(WIRE_ACTIVE.map((position) => marginCurrentLeverage(position)?.toFixed(3))).toEqual([
      '2.120',
      '1.102',
      '2.052',
      '2.041',
    ])
  })

  it('falls back to size / equity when the wire carries no leverage', () => {
    const position = { ...wireMorphoRow(), leverage: undefined }
    expect(marginCurrentLeverage(position)?.toFixed(3)).toBe('2.120')
  })

  it('derives nothing for a short without a served leverage — its equity and size are different legs', () => {
    const position = { ...wireMorphoRow(), direction: MarginDirection.SHORT, leverage: undefined }
    expect(marginCurrentLeverage(position)).toBeUndefined()
  })

  it('reads ∞ for an unlevered position at or below zero equity', () => {
    for (const equity of ['0', '-5']) {
      expect(marginCurrentLeverage(activeFixture({ leverage: undefined, equity }))).toBe(Number.POSITIVE_INFINITY)
    }
  })

  it('reports nothing when neither leverage nor equity parses', () => {
    for (const equity of ['', 'abc']) {
      expect(marginCurrentLeverage(activeFixture({ leverage: undefined, equity }))).toBeUndefined()
    }
  })
})
