import type {
  MarginActivePosition,
  MarginMarketRow,
  MarginTerminalPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import {
  hasMarginOpenedAt,
  hasMarginPositionBasis,
  isMarginActivePosition,
  marginEquityContributedAtOpen,
  marginMarketRowTokens,
  marginOpenedLeverage,
  marginPositionAccount,
  marginPositionDebt,
  marginPositionLegDebt,
  marginPositionSubId,
  marginPositionTokens,
  marginPositionVenue,
} from '~/pages/Swap/Margin/marginPositionRow'

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

// The wire dropped costBasis.equityContributed; the open-time collateral/leverage pair the indexer
// stamps determines it. A long's collateral IS its exposure (C = E × L); a short's is margin plus sale
// proceeds, one turn larger (C = E × (L+1)).
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

describe('marginEquityContributedAtOpen', () => {
  it('divides a LONG collateral by its opened leverage', () => {
    const position = activeFixture({ collateralAtOpen: '2000000000000000000', openedLeverage: '2' })
    expect(marginEquityContributedAtOpen({ position })).toBe(1)
  })

  // Same collateral, same leverage, one turn more balance sheet: 3 USDC of collateral at 2x is 1 of
  // margin, not 1.5.
  it('carries a SHORT extra turn (L+1)', () => {
    const position = activeFixture({
      direction: MarginDirection.SHORT,
      collateralAtOpen: '3000000',
      openedLeverage: '2',
    })
    expect(marginEquityContributedAtOpen({ position })).toBe(1)
  })

  // Never fabricate a contribution the indexer could not attribute.
  it('reports nothing where either open-time input is absent', () => {
    expect(
      marginEquityContributedAtOpen({ position: activeFixture({ collateralAtOpen: undefined, openedLeverage: '2' }) }),
    ).toBeUndefined()
    expect(
      marginEquityContributedAtOpen({
        position: activeFixture({ collateralAtOpen: '2000000000000000000', openedLeverage: undefined }),
      }),
    ).toBeUndefined()
  })

  // '0' is the indexer's "never recorded" stamp, not a figure — and it is not nullish, so the
  // absent-only check above sails past it. A zero collateralAtOpen would claim $0 contributed; a zero
  // openedLeverage on a SHORT divides by the +1 turn alone and claims the whole collateral was equity.
  it('reports nothing where either open-time input is the zero sentinel', () => {
    expect(
      marginEquityContributedAtOpen({ position: activeFixture({ collateralAtOpen: '0', openedLeverage: '2' }) }),
    ).toBeUndefined()
    for (const direction of [MarginDirection.LONG, MarginDirection.SHORT] as const) {
      expect(
        marginEquityContributedAtOpen({
          position: activeFixture({ direction, collateralAtOpen: '3000000', openedLeverage: '0' }),
        }),
      ).toBeUndefined()
    }
  })

  // `NaN <= 0` is false, so an un-inverted guard would return NaN/turns for a malformed basis.
  it('reports nothing for a malformed collateralAtOpen', () => {
    for (const collateralAtOpen of ['abc', '', '0']) {
      expect(
        marginEquityContributedAtOpen({ position: activeFixture({ collateralAtOpen, openedLeverage: '2' }) }),
      ).toBeUndefined()
    }
  })

  // A short already underwater at open carries no margin to report, and 0 is a claim — not nothing.
  it('reports nothing for a negative opened leverage', () => {
    const position = activeFixture({
      direction: MarginDirection.SHORT,
      collateralAtOpen: '3000000',
      openedLeverage: '-3',
    })
    expect(marginEquityContributedAtOpen({ position })).toBeUndefined()
  })
})
