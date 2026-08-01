import { renderHook } from '@testing-library/react'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { normalizeToken, usePrice } from '@universe/prices'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { SolanaToken } from 'uniswap/src/features/tokens/SolanaToken'
import { useUSDCPrice, useUSDCValueWithStatus } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  usePrice: vi.fn(),
  useTrade: vi.fn(),
}))

vi.mock('@universe/prices', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/prices')>()),
  usePrice: mocks.usePrice,
}))

vi.mock('uniswap/src/features/transactions/swap/hooks/useTrade', () => ({
  useTrade: mocks.useTrade,
}))

const MAINNET_TOKEN = new Token(
  UniverseChainId.Mainnet,
  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  18,
  'DAI',
  'Dai Stablecoin',
)
const UNKNOWN_CHAIN_TOKEN = new Token(
  999_999_999,
  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  18,
  'DAI',
  'Dai Stablecoin',
)
const SOLANA_TOKEN = new SolanaToken(
  UniverseChainId.Solana,
  'So11111111111111111111111111111111111111112',
  9,
  'SOL',
  'Solana',
)

describe('useUSDCPrice', () => {
  beforeEach(() => {
    mocks.usePrice.mockReset()
    mocks.useTrade.mockReset()
    mocks.usePrice.mockReturnValue({ price: undefined, isLoading: false })
    mocks.useTrade.mockReturnValue({ trade: undefined, isLoading: false })
  })

  it('uses remote price service for supported EVM chains', () => {
    mocks.usePrice.mockReturnValue({ price: 2, isLoading: false })

    const { result } = renderHook(() => useUSDCPrice(MAINNET_TOKEN))

    expect(usePrice).toHaveBeenCalledWith({
      chainId: UniverseChainId.Mainnet,
      address: normalizeToken(MAINNET_TOKEN).address,
    })
    expect(useTrade).toHaveBeenCalledWith(
      expect.objectContaining({
        amountSpecified: undefined,
        otherCurrency: undefined,
      }),
    )
    expect(
      result.current.price?.quote(CurrencyAmount.fromRawAmount(MAINNET_TOKEN, '1000000000000000000')).toExact(),
    ).toBe('2')
  })

  it('uses the Solana quote fallback for Solana currencies', () => {
    mocks.usePrice.mockReturnValue({ price: 999, isLoading: false })
    mocks.useTrade.mockReturnValue({
      trade: {
        routing: TradingApi.Routing.JUPITER,
        quote: {
          quote: {
            inAmount: '2000000000',
            outAmount: '1000000000',
          },
        },
      },
      isLoading: false,
    })

    const { result } = renderHook(() => useUSDCPrice(SOLANA_TOKEN))

    expect(usePrice).toHaveBeenCalledWith({ chainId: undefined, address: undefined })
    expect(useTrade).toHaveBeenCalledWith(
      expect.objectContaining({
        otherCurrency: SOLANA_TOKEN,
        amountSpecified: expect.objectContaining({
          currency: expect.objectContaining({ chainId: UniverseChainId.Solana }),
        }),
      }),
    )
    expect(result.current.price).toBeDefined()
  })

  it('returns no price for unknown chains without requesting remote or quote data', () => {
    mocks.useTrade.mockReturnValue({ trade: undefined, isLoading: true })

    const { result } = renderHook(() => useUSDCPrice(UNKNOWN_CHAIN_TOKEN))

    expect(usePrice).toHaveBeenCalledWith({ chainId: undefined, address: undefined })
    expect(useTrade).toHaveBeenCalledWith(
      expect.objectContaining({
        amountSpecified: undefined,
        otherCurrency: undefined,
      }),
    )
    expect(result.current).toEqual({ price: undefined, isLoading: false })
  })

  it('returns 1:1 for the chain primary stablecoin', () => {
    const stablecoin = getPrimaryStablecoin(UniverseChainId.Mainnet)

    const { result } = renderHook(() => useUSDCPrice(stablecoin))

    expect(usePrice).toHaveBeenCalledWith({ chainId: undefined, address: undefined })
    expect(result.current.price?.quote(CurrencyAmount.fromRawAmount(stablecoin, 123_000_000)).toExact()).toBe('123')
  })

  it('keeps tiny remote prices instead of truncating them to zero', () => {
    mocks.usePrice.mockReturnValue({ price: 0.00000001, isLoading: false })

    const { result } = renderHook(() => useUSDCPrice(MAINNET_TOKEN))

    expect(result.current.price).toBeDefined()
  })

  it('reports loading while the remote price lookup is still in flight', () => {
    mocks.usePrice.mockReturnValue({ price: undefined, isLoading: true })

    const { result } = renderHook(() => useUSDCPrice(MAINNET_TOKEN))

    expect(result.current).toEqual({ price: undefined, isLoading: true })
  })

  it('reports settled (not loading) when the remote lookup completes with no price', () => {
    mocks.usePrice.mockReturnValue({ price: undefined, isLoading: false })

    const { result } = renderHook(() => useUSDCPrice(MAINNET_TOKEN))

    expect(result.current).toEqual({ price: undefined, isLoading: false })
  })

  it('propagates the remote loading state through useUSDCValueWithStatus', () => {
    mocks.usePrice.mockReturnValue({ price: undefined, isLoading: true })

    const amount = CurrencyAmount.fromRawAmount(MAINNET_TOKEN, '1000000000000000000')
    const { result } = renderHook(() => useUSDCValueWithStatus(amount))

    expect(result.current).toEqual({ value: null, isLoading: true })
  })
})
