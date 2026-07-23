import { renderHook } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { logger } from 'utilities/src/logger/logger'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetAuctionTokenInfoLogGuards } from '~/features/Toucan/Auction/hooks/auctionTokenInfoLogGuards'
import { useAuctionTokenInfo } from '~/features/Toucan/Auction/hooks/useAuctionTokenInfo'

const mockUseCurrencyInfoWithLoading = vi.fn()
const mockUseTokenInfoFromContract = vi.fn()

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfoWithLoading: (...args: unknown[]) => mockUseCurrencyInfoWithLoading(...args),
}))

vi.mock('~/features/Toucan/Auction/hooks/useTokenInfoFromContract', () => ({
  useTokenInfoFromContract: (...args: unknown[]) => mockUseTokenInfoFromContract(...args),
}))

vi.mock('~/features/Toucan/Config/config', () => ({
  getAuctionMetadata: () => undefined,
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn(), debug: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const CHAIN_ID = UniverseChainId.Mainnet
const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000001'

function buildCurrencyInfoFixture({
  decimals,
  symbol,
  name,
}: {
  decimals: number
  symbol?: string
  name?: string
}): CurrencyInfo {
  return {
    currency: new Token(CHAIN_ID, TOKEN_ADDRESS, decimals, symbol, name),
    currencyId: `${CHAIN_ID}-${TOKEN_ADDRESS}`,
    logoUrl: null,
  } as CurrencyInfo
}

describe('useAuctionTokenInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAuctionTokenInfoLogGuards()
    mockUseTokenInfoFromContract.mockReturnValue({ tokenMetadata: undefined, loading: false, error: null })
  })

  it('uses indexed metadata when it is trustworthy (decimals 18)', () => {
    const currencyInfo = buildCurrencyInfoFixture({ decimals: 18, symbol: 'TCAN', name: 'Toucan' })
    mockUseCurrencyInfoWithLoading.mockReturnValue({ currencyInfo, loading: false, error: undefined })

    const { result } = renderHook(() => useAuctionTokenInfo(TOKEN_ADDRESS, CHAIN_ID))

    expect(result.current.tokenInfo?.currency.decimals).toBe(18)
    expect(result.current.tokenInfo?.currency.symbol).toBe('TCAN')
    // On-chain fallback stays disabled (called with undefined args)
    expect(mockUseTokenInfoFromContract).toHaveBeenCalledWith(undefined, undefined)
  })

  it('treats corrupt indexed metadata (decimals=0, empty name/symbol) as missing and resolves on-chain', () => {
    const corruptCurrencyInfo = buildCurrencyInfoFixture({ decimals: 0 })
    mockUseCurrencyInfoWithLoading.mockReturnValue({
      currencyInfo: corruptCurrencyInfo,
      loading: false,
      error: undefined,
    })
    mockUseTokenInfoFromContract.mockReturnValue({
      tokenMetadata: { name: 'Toucan', symbol: 'TCAN', decimals: 18 },
      loading: false,
      error: null,
    })

    const { result } = renderHook(() => useAuctionTokenInfo(TOKEN_ADDRESS, CHAIN_ID))

    // On-chain fallback is triggered and its real decimals win over the corrupt 0
    expect(mockUseTokenInfoFromContract).toHaveBeenCalledWith(TOKEN_ADDRESS, CHAIN_ID)
    expect(result.current.tokenInfo?.currency.decimals).toBe(18)
    expect(result.current.tokenInfo?.currency.symbol).toBe('TCAN')
  })

  it('returns no token info while the on-chain fallback is still loading (no assumed decimals)', () => {
    const corruptCurrencyInfo = buildCurrencyInfoFixture({ decimals: 0 })
    mockUseCurrencyInfoWithLoading.mockReturnValue({
      currencyInfo: corruptCurrencyInfo,
      loading: false,
      error: undefined,
    })
    mockUseTokenInfoFromContract.mockReturnValue({ tokenMetadata: undefined, loading: true, error: null })

    const { result } = renderHook(() => useAuctionTokenInfo(TOKEN_ADDRESS, CHAIN_ID))

    expect(result.current.tokenInfo).toBeUndefined()
    expect(result.current.loading).toBe(true)
  })

  it('never defaults decimals when the on-chain read comes back without them', () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({ currencyInfo: undefined, loading: false, error: undefined })
    mockUseTokenInfoFromContract.mockReturnValue({
      tokenMetadata: { name: 'Toucan', symbol: 'TCAN', decimals: undefined },
      loading: false,
      error: null,
    })

    const { result } = renderHook(() => useAuctionTokenInfo(TOKEN_ADDRESS, CHAIN_ID))

    expect(result.current.tokenInfo).toBeUndefined()
  })

  describe('failure observability logging', () => {
    it('warns once with chainId + token address when corrupt indexed metadata engages the fallback', () => {
      const corruptCurrencyInfo = buildCurrencyInfoFixture({ decimals: 0 })
      mockUseCurrencyInfoWithLoading.mockReturnValue({
        currencyInfo: corruptCurrencyInfo,
        loading: false,
        error: undefined,
      })
      mockUseTokenInfoFromContract.mockReturnValue({ tokenMetadata: undefined, loading: true, error: null })

      const { rerender } = renderHook(() => useAuctionTokenInfo(TOKEN_ADDRESS, CHAIN_ID))

      expect(logger.warn).toHaveBeenCalledTimes(1)
      expect(logger.warn).toHaveBeenCalledWith(
        'useAuctionTokenInfo',
        'useAuctionTokenInfo',
        'Corrupt indexed auction token metadata, falling back to on-chain read',
        { chainId: CHAIN_ID, tokenAddress: TOKEN_ADDRESS },
      )

      // Re-renders must not re-log the same token (once per token per session)
      rerender()
      expect(logger.warn).toHaveBeenCalledTimes(1)
    })

    it('does not warn for a token that is simply not indexed yet', () => {
      mockUseCurrencyInfoWithLoading.mockReturnValue({ currencyInfo: undefined, loading: false, error: undefined })

      renderHook(() => useAuctionTokenInfo(TOKEN_ADDRESS, CHAIN_ID))

      expect(logger.warn).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('logs an error once when the on-chain fallback also settles without decimals', () => {
      const corruptCurrencyInfo = buildCurrencyInfoFixture({ decimals: 0 })
      mockUseCurrencyInfoWithLoading.mockReturnValue({
        currencyInfo: corruptCurrencyInfo,
        loading: false,
        error: undefined,
      })
      mockUseTokenInfoFromContract.mockReturnValue({
        tokenMetadata: { name: 'Toucan', symbol: 'TCAN', decimals: undefined },
        loading: false,
        error: null,
      })

      const { rerender } = renderHook(() => useAuctionTokenInfo(TOKEN_ADDRESS, CHAIN_ID))

      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), {
        tags: { file: 'useAuctionTokenInfo.ts', function: 'useAuctionTokenInfo' },
        extra: {
          chainId: CHAIN_ID,
          tokenAddress: TOKEN_ADDRESS,
          hadCorruptIndexedMetadata: true,
          contractError: undefined,
        },
      })
      // Stable message a Datadog monitor can count on
      const loggedError = vi.mocked(logger.error).mock.calls[0]?.[0] as Error
      expect(loggedError.message).toBe('Failed to resolve auction token decimals')

      rerender()
      expect(logger.error).toHaveBeenCalledTimes(1)
    })

    it('logs an error with the RPC error message when the fallback read fails', () => {
      mockUseCurrencyInfoWithLoading.mockReturnValue({ currencyInfo: undefined, loading: false, error: undefined })
      mockUseTokenInfoFromContract.mockReturnValue({
        tokenMetadata: undefined,
        loading: false,
        error: new Error('rpc unreachable'),
      })

      renderHook(() => useAuctionTokenInfo(TOKEN_ADDRESS, CHAIN_ID))

      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), {
        tags: { file: 'useAuctionTokenInfo.ts', function: 'useAuctionTokenInfo' },
        extra: {
          chainId: CHAIN_ID,
          tokenAddress: TOKEN_ADDRESS,
          hadCorruptIndexedMetadata: false,
          contractError: 'rpc unreachable',
        },
      })
    })

    it('does not log an error while the on-chain fallback is still loading', () => {
      mockUseCurrencyInfoWithLoading.mockReturnValue({ currencyInfo: undefined, loading: false, error: undefined })
      mockUseTokenInfoFromContract.mockReturnValue({ tokenMetadata: undefined, loading: true, error: null })

      renderHook(() => useAuctionTokenInfo(TOKEN_ADDRESS, CHAIN_ID))

      expect(logger.error).not.toHaveBeenCalled()
    })
  })

  it('keeps a legitimate 0-decimals token with real metadata', () => {
    const zeroDecimalsInfo = buildCurrencyInfoFixture({ decimals: 0, symbol: 'ZERO', name: 'Zero Decimals' })
    mockUseCurrencyInfoWithLoading.mockReturnValue({
      currencyInfo: zeroDecimalsInfo,
      loading: false,
      error: undefined,
    })

    const { result } = renderHook(() => useAuctionTokenInfo(TOKEN_ADDRESS, CHAIN_ID))

    expect(result.current.tokenInfo?.currency.decimals).toBe(0)
    expect(mockUseTokenInfoFromContract).toHaveBeenCalledWith(undefined, undefined)
  })
})
