import type { CurrencyInfo, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import { multichainBalancesEqual, stabilizeBalancesById } from 'uniswap/src/features/portfolio/TokenBalanceListContext'
import {
  createPortfolioChainBalance,
  createPortfolioMultichainBalance,
} from 'uniswap/src/test/fixtures/dataApi/portfolioMultichainBalances'
import { describe, expect, it } from 'vitest'

type Currency = CurrencyInfo['currency']

/** Mimics the query `select`: a structurally identical balance with fresh object identities. */
function clone(balance: PortfolioMultichainBalance): PortfolioMultichainBalance {
  return {
    ...balance,
    tokens: balance.tokens.map((token) => ({
      ...token,
      currencyInfo: { ...token.currencyInfo, currency: { ...token.currencyInfo.currency } as Currency },
    })),
  }
}

function withCurrencyInfo(
  balance: PortfolioMultichainBalance,
  overrides: Partial<CurrencyInfo>,
): PortfolioMultichainBalance {
  const next = clone(balance)
  const token = next.tokens[0]!
  token.currencyInfo = { ...token.currencyInfo, ...overrides }
  return next
}

const usdc = createPortfolioMultichainBalance({ id: 'usdc', tokens: [createPortfolioChainBalance()] })
const weth = createPortfolioMultichainBalance({
  id: 'weth',
  tokens: [createPortfolioChainBalance({ address: '0x2222222222222222222222222222222222222222' })],
})

describe(multichainBalancesEqual, () => {
  it('treats a structurally identical rebuild as equal', () => {
    expect(multichainBalancesEqual(usdc, clone(usdc))).toBe(true)
  })

  it.each([
    ['isSpam', { isSpam: true }],
    ['spamCode', { spamCode: 1 }],
    ['logoUrl', { logoUrl: 'https://example.com/new.png' }],
  ] as const)('reports a change to currencyInfo.%s', (_field, overrides) => {
    expect(multichainBalancesEqual(usdc, withCurrencyInfo(usdc, overrides))).toBe(false)
  })

  it('reports a change to the rendered currency symbol', () => {
    const next = clone(usdc)
    next.tokens[0]!.currencyInfo.currency = { ...next.tokens[0]!.currencyInfo.currency, symbol: 'RENAMED' } as Currency
    expect(multichainBalancesEqual(usdc, next)).toBe(false)
  })
})

describe(stabilizeBalancesById, () => {
  it('returns the previous map when nothing rendered changed', () => {
    const prev = { usdc, weth }
    const { merged, changedKeys } = stabilizeBalancesById(prev, { usdc: clone(usdc), weth: clone(weth) })
    expect(merged).toBe(prev)
    expect(changedKeys).toEqual([])
  })

  it('reuses previous identities for unchanged entries and reports only changed keys', () => {
    const prev = { usdc, weth }
    const nextWeth = { ...clone(weth), priceUsd: 999 }
    const { merged, changedKeys } = stabilizeBalancesById(prev, { usdc: clone(usdc), weth: nextWeth })
    expect(merged?.['usdc']).toBe(usdc)
    expect(merged?.['weth']).toBe(nextWeth)
    expect(changedKeys).toEqual(['weth'])
  })

  it('reports a row whose only change is currencyInfo.isSpam', () => {
    const prev = { usdc }
    const { merged, changedKeys } = stabilizeBalancesById(prev, { usdc: withCurrencyInfo(usdc, { isSpam: true }) })
    expect(merged?.['usdc']).not.toBe(usdc)
    expect(changedKeys).toEqual(['usdc'])
  })

  it('reports removed keys so their rows re-read the store', () => {
    const { merged, changedKeys } = stabilizeBalancesById({ usdc, weth }, { usdc: clone(usdc) })
    expect(merged).toEqual({ usdc })
    expect(changedKeys).toEqual(['weth'])
  })

  it('is idempotent: re-running the same diff yields the same changed keys', () => {
    const prev = { usdc, weth }
    const next = { usdc: clone(usdc), weth: { ...clone(weth), totalValueUsd: 1 } }
    const first = stabilizeBalancesById(prev, next)
    const second = stabilizeBalancesById(prev, next)
    expect(second.changedKeys).toEqual(first.changedKeys)
    expect(second.merged).toEqual(first.merged)
  })

  it('reports every key when there is no previous map', () => {
    expect(stabilizeBalancesById(undefined, { usdc, weth }).changedKeys).toEqual(['usdc', 'weth'])
  })
})
