import { renderHook } from '@testing-library/react'
import type { Currency } from '@uniswap/sdk-core'
import { USDC_MAINNET, nativeOnChain } from 'uniswap/src/constants/tokens'
import { MARGIN_NATIVE_TOKEN_ADDRESS } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_PAYMENT_SOURCE_CHAIN_IDS } from '~/constants/margin'
import { toMarginPaymentToken, useMarginPaymentTokens } from '~/pages/Swap/Margin/hooks/useMarginPaymentTokens'

const portfolio = vi.hoisted(() => ({
  balances: undefined as unknown[] | undefined,
  loading: false,
  lastArgs: undefined as unknown,
}))

vi.mock('uniswap/src/features/portfolio/balances/hooks', () => ({
  useSortedPortfolioBalances: (args: unknown) => {
    portfolio.lastArgs = args
    return { data: portfolio.balances ? { balances: portfolio.balances } : undefined, loading: portfolio.loading }
  },
}))

const ETH = nativeOnChain(1)

function balance({
  currency,
  quantity,
  quantityRaw,
  balanceUSD,
}: {
  currency: Currency
  quantity: number
  quantityRaw?: string
  balanceUSD?: number | null
}): PortfolioBalance {
  return { currencyInfo: { currency }, quantity, quantityRaw, balanceUSD } as unknown as PortfolioBalance
}

describe('toMarginPaymentToken', () => {
  it('maps native ETH to the zero-address sentinel', () => {
    expect(toMarginPaymentToken(ETH)).toEqual({
      address: MARGIN_NATIVE_TOKEN_ADDRESS,
      symbol: 'ETH',
      decimals: 18,
      isNative: true,
      chainId: 1,
    })
  })

  it('keeps an ERC-20 address and chain', () => {
    expect(toMarginPaymentToken(USDC_MAINNET)).toMatchObject({
      address: USDC_MAINNET.address,
      decimals: 6,
      isNative: false,
      chainId: 1,
    })
  })
})

describe('useMarginPaymentTokens', () => {
  beforeEach(() => {
    portfolio.balances = undefined
    portfolio.loading = false
    portfolio.lastArgs = undefined
  })

  it('reads balances only on the margin payment source chains', () => {
    renderHook(() => useMarginPaymentTokens({ evmAddress: '0xabc' }))
    expect(portfolio.lastArgs).toEqual({ evmAddress: '0xabc', chainIds: MARGIN_PAYMENT_SOURCE_CHAIN_IDS })
  })

  it('returns no rows while balances are loading', () => {
    portfolio.loading = true
    const { result } = renderHook(() => useMarginPaymentTokens({ evmAddress: '0xabc' }))
    expect(result.current).toEqual({ rows: [], isLoading: true })
  })

  it('keeps the portfolio order and maps each balance to a payment row', () => {
    portfolio.balances = [
      balance({ currency: USDC_MAINNET, quantity: 1500, quantityRaw: '1500000000', balanceUSD: 1500 }),
      balance({ currency: ETH, quantity: 0.5, quantityRaw: '500000000000000000', balanceUSD: null }),
    ]
    const { result } = renderHook(() => useMarginPaymentTokens({ evmAddress: '0xabc' }))
    expect(result.current.rows.map((row) => row.token.symbol)).toEqual(['USDC', 'ETH'])
    expect(result.current.rows[0]).toMatchObject({ balance: 1500, balanceUSD: 1500 })
    // A null USD value from the API reads as unknown, not $0.
    expect(result.current.rows[1]?.balanceUSD).toBeUndefined()
    expect(result.current.rows[1]?.token.address).toBe(MARGIN_NATIVE_TOKEN_ADDRESS)
  })

  // quantity is a float64; quantityRaw keeps dust that the float would drop.
  it('derives the balance from quantityRaw over the float quantity', () => {
    portfolio.balances = [balance({ currency: USDC_MAINNET, quantity: 1, quantityRaw: '1000001' })]
    const { result } = renderHook(() => useMarginPaymentTokens({ evmAddress: '0xabc' }))
    expect(result.current.rows[0]?.balance).toBe(1.000001)
  })

  it('falls back to the float quantity when quantityRaw is missing', () => {
    portfolio.balances = [balance({ currency: USDC_MAINNET, quantity: 42.5 })]
    const { result } = renderHook(() => useMarginPaymentTokens({ evmAddress: '0xabc' }))
    expect(result.current.rows[0]?.balance).toBe(42.5)
  })
})
