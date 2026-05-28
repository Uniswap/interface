import { computeAggregateBalance, sortBalancesByValue } from 'uniswap/src/components/tokenDetails/utils'
import { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { describe, expect, it } from 'vitest'

function makeBalance(
  overrides: Partial<PortfolioBalance> & { balanceUSD?: number; quantity?: number },
): PortfolioBalance {
  return {
    id: 'test',
    cacheId: 'test',
    quantity: 0,
    balanceUSD: undefined,
    currencyInfo: { currency: { symbol: 'TEST', name: 'Test Token' } } as CurrencyInfo,
    relativeChange24: undefined,
    isHidden: undefined,
    ...overrides,
  }
}

describe('computeAggregateBalance', () => {
  it('returns undefined for empty array', () => {
    expect(computeAggregateBalance([])).toBeUndefined()
  })

  it('returns a single balance unchanged (structurally)', () => {
    const balance = makeBalance({ id: 'eth-1', quantity: 1.5, balanceUSD: 3000 })
    const result = computeAggregateBalance([balance])

    expect(result).toBeDefined()
    expect(result?.quantity).toBe(1.5)
    expect(result?.balanceUSD).toBe(3000)
    expect(result?.currencyInfo).toBe(balance.currencyInfo)
  })

  it('sums quantity and balanceUSD across multiple balances', () => {
    const balances = [
      makeBalance({ id: 'eth-1', quantity: 1.5, balanceUSD: 3000 }),
      makeBalance({ id: 'arb-1', quantity: 0.5, balanceUSD: 1000 }),
      makeBalance({ id: 'opt-1', quantity: 2.0, balanceUSD: 4000 }),
    ]
    const result = computeAggregateBalance(balances)

    expect(result?.quantity).toBe(4.0)
    expect(result?.balanceUSD).toBe(8000)
    expect(result?.id).toBe('aggregate')
  })

  it('uses representativeCurrencyInfo when provided', () => {
    const representative = { currency: { symbol: 'ETH', name: 'Ethereum' } } as CurrencyInfo
    const balances = [makeBalance({ id: 'arb-1', quantity: 0.5, balanceUSD: 1000 })]
    const result = computeAggregateBalance(balances, representative)

    expect(result?.currencyInfo).toBe(representative)
  })

  it('falls back to first balance currencyInfo when no representative provided', () => {
    const firstInfo = { currency: { symbol: 'FIRST', name: 'First' } } as CurrencyInfo
    const balances = [
      makeBalance({ id: '1', quantity: 1, balanceUSD: 100, currencyInfo: firstInfo }),
      makeBalance({ id: '2', quantity: 2, balanceUSD: 200 }),
    ]
    const result = computeAggregateBalance(balances)

    expect(result?.currencyInfo).toBe(firstInfo)
  })

  it('handles balances with undefined balanceUSD', () => {
    const balances = [
      makeBalance({ id: '1', quantity: 1, balanceUSD: 500 }),
      makeBalance({ id: '2', quantity: 2, balanceUSD: undefined }),
      makeBalance({ id: '3', quantity: 3, balanceUSD: 300 }),
    ]
    const result = computeAggregateBalance(balances)

    expect(result?.quantity).toBe(6)
    expect(result?.balanceUSD).toBe(800)
  })

  it('returns undefined balanceUSD when all balances have no USD value', () => {
    const balances = [
      makeBalance({ id: '1', quantity: 1, balanceUSD: undefined }),
      makeBalance({ id: '2', quantity: 2, balanceUSD: undefined }),
    ]
    const result = computeAggregateBalance(balances)

    expect(result?.quantity).toBe(3)
    expect(result?.balanceUSD).toBeUndefined()
  })

  it('returns undefined balanceUSD when all balances sum to zero', () => {
    const balances = [
      makeBalance({ id: '1', quantity: 1, balanceUSD: 0 }),
      makeBalance({ id: '2', quantity: 2, balanceUSD: 0 }),
    ]
    const result = computeAggregateBalance(balances)

    expect(result?.quantity).toBe(3)
    expect(result?.balanceUSD).toBeUndefined()
  })

  it('sets relativeChange24 and isHidden to undefined', () => {
    const balances = [makeBalance({ id: '1', quantity: 1, balanceUSD: 100, relativeChange24: 5, isHidden: false })]
    const result = computeAggregateBalance(balances)

    expect(result?.relativeChange24).toBeUndefined()
    expect(result?.isHidden).toBeUndefined()
  })
})

describe('sortBalancesByValue', () => {
  it('returns empty array for empty input', () => {
    expect(sortBalancesByValue([])).toEqual([])
  })

  it('sorts by balanceUSD descending', () => {
    const balances = [
      makeBalance({ id: 'low', balanceUSD: 100 }),
      makeBalance({ id: 'high', balanceUSD: 5000 }),
      makeBalance({ id: 'mid', balanceUSD: 1000 }),
    ]
    const sorted = sortBalancesByValue(balances)

    expect(sorted.map((b) => b.id)).toEqual(['high', 'mid', 'low'])
  })

  it('places undefined balanceUSD after defined values', () => {
    const balances = [makeBalance({ id: 'none', balanceUSD: undefined }), makeBalance({ id: 'some', balanceUSD: 50 })]
    const sorted = sortBalancesByValue(balances)

    expect(sorted.map((b) => b.id)).toEqual(['some', 'none'])
  })

  it('places balanceUSD: 0 before undefined (zero is a known value)', () => {
    const balances = [
      makeBalance({ id: 'unknown', balanceUSD: undefined }),
      makeBalance({ id: 'zero', balanceUSD: 0 }),
      makeBalance({ id: 'positive', balanceUSD: 100 }),
    ]
    const sorted = sortBalancesByValue(balances)

    expect(sorted.map((b) => b.id)).toEqual(['positive', 'zero', 'unknown'])
  })

  it('does not mutate the original array', () => {
    const balances = [makeBalance({ id: 'b', balanceUSD: 100 }), makeBalance({ id: 'a', balanceUSD: 500 })]
    const original = [...balances]
    sortBalancesByValue(balances)

    expect(balances.map((b) => b.id)).toEqual(original.map((b) => b.id))
  })
})
