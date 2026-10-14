import { buildFiatOnRampRows } from 'src/components/TokenSelector/buildFiatOnRampRows'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'

function currency(currencyId: string, meldCurrencyCode = 'USDC'): FiatOnRampCurrency {
  return {
    currencyInfo: { currencyId } as FiatOnRampCurrency['currencyInfo'],
    meldCurrencyCode,
  } as FiatOnRampCurrency
}

function balance(currencyId: string, quantity: number, balanceUSD: number): PortfolioBalance {
  return { quantity, balanceUSD, currencyInfo: { currencyId } } as PortfolioBalance
}

const ETH = currency('1-eth')
const USDC = currency('1-usdc')
const DAI = currency('1-dai')

describe('buildFiatOnRampRows', () => {
  it('keeps the server ordering on the on-ramp branch', () => {
    const rows = buildFiatOnRampRows({
      list: [ETH, USDC, DAI],
      balancesById: undefined,
      isOffRamp: false,
      showMore: true,
    })

    expect(rows.map((r) => r.key)).toEqual(['supported-1-eth', 'supported-1-usdc', 'supported-1-dai'])
  })

  it('drops entries with no currencyInfo instead of colliding them on one key', () => {
    const unresolvedA = { meldCurrencyCode: 'AAA' } as FiatOnRampCurrency
    const unresolvedB = { meldCurrencyCode: 'BBB' } as FiatOnRampCurrency

    const rows = buildFiatOnRampRows({
      list: [ETH, unresolvedA, unresolvedB],
      balancesById: undefined,
      isOffRamp: false,
      showMore: true,
    })

    expect(rows.map((r) => r.key)).toEqual(['supported-1-eth'])
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length)
  })

  it('sorts held balances above unheld ones by USD value on the off-ramp branch', () => {
    const balancesById = {
      '1-eth': balance('1-eth', 1, 50),
      '1-dai': balance('1-dai', 1, 500),
    }

    const rows = buildFiatOnRampRows({ list: [ETH, USDC, DAI], balancesById, isOffRamp: true, showMore: true })

    expect(rows.map((r) => r.key)).toEqual(['supported-1-dai', 'supported-1-eth', 'supported-1-usdc'])
  })

  it('groups a zero-quantity balance entry with the unheld currencies rather than dropping it', () => {
    const balancesById = { '1-eth': balance('1-eth', 0, 0) }

    const rows = buildFiatOnRampRows({ list: [ETH, USDC], balancesById, isOffRamp: true, showMore: true })

    // A fully-sold token keeps a cache entry at quantity 0; it must still be sellable-listable, and
    // must not sort above tokens the user actually holds.
    expect(rows.map((r) => r.key)).toEqual(['supported-1-eth', 'supported-1-usdc'])
  })

  it('keeps held currencies above zero-quantity ones on the off-ramp branch', () => {
    const balancesById = {
      '1-eth': balance('1-eth', 0, 0),
      '1-dai': balance('1-dai', 5, 500),
    }

    const rows = buildFiatOnRampRows({ list: [ETH, USDC, DAI], balancesById, isOffRamp: true, showMore: true })

    expect(rows.map((r) => r.key)).toEqual(['supported-1-dai', 'supported-1-eth', 'supported-1-usdc'])
  })

  it('emits no unsupported toggle when there are no unsupported balances', () => {
    const rows = buildFiatOnRampRows({ list: [ETH], balancesById: undefined, isOffRamp: true, showMore: true })

    expect(rows.some((r) => r.type === 'unsupportedToggle')).toBe(false)
  })

  it('emits the toggle and the unsupported rows when open', () => {
    const balancesById = { '1-wbtc': balance('1-wbtc', 2, 200) }

    const rows = buildFiatOnRampRows({ list: [ETH], balancesById, isOffRamp: true, showMore: true })

    expect(rows.map((r) => r.key)).toEqual(['supported-1-eth', 'unsupported-toggle', 'unsupported-1-wbtc'])
  })

  it('emits the toggle without its rows when collapsed', () => {
    const balancesById = { '1-wbtc': balance('1-wbtc', 2, 200) }

    const rows = buildFiatOnRampRows({ list: [ETH], balancesById, isOffRamp: true, showMore: false })

    expect(rows.map((r) => r.key)).toEqual(['supported-1-eth', 'unsupported-toggle'])
  })

  it('never surfaces unsupported balances on the on-ramp branch', () => {
    const balancesById = { '1-wbtc': balance('1-wbtc', 2, 200) }

    const rows = buildFiatOnRampRows({ list: [ETH], balancesById, isOffRamp: false, showMore: true })

    expect(rows.map((r) => r.key)).toEqual(['supported-1-eth'])
  })

  it('finds a held ERC20 whose list currency id is checksummed while the portfolio key is lowercase', () => {
    // Native USDC on Arbitrum: data-api returns the checksummed address, the portfolio keys by lowercase.
    const arbUsdc = currency('42161-0xaf88d065e77c8cC2239327C5EDB3A432268e5831')
    const lowercaseId = '42161-0xaf88d065e77c8cc2239327c5edb3a432268e5831'
    const balancesById = { [lowercaseId]: balance(lowercaseId, 10, 10) }

    const rows = buildFiatOnRampRows({ list: [USDC, arbUsdc], balancesById, isOffRamp: true, showMore: true })

    expect(rows.map((r) => r.key)).toEqual([
      'supported-42161-0xaf88d065e77c8cC2239327C5EDB3A432268e5831',
      'supported-1-usdc',
    ])
  })

  it('produces unique keys across both groups', () => {
    const balancesById = {
      '1-eth': balance('1-eth', 1, 50),
      '1-wbtc': balance('1-wbtc', 2, 200),
    }

    const rows = buildFiatOnRampRows({ list: [ETH, USDC], balancesById, isOffRamp: true, showMore: true })

    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length)
  })
})
