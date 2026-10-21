import { Price, type Token } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { USDC } from 'uniswap/src/constants/tokens'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { ETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { useUSDTokenUpdater } from '~/hooks/useUSDTokenUpdater'
import { renderHook } from '~/test-utils/render'

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/transactions/hooks/useUSDCPrice')>()
  return { ...actual, useUSDCPrice: vi.fn(() => ({ price: undefined, isLoading: false, isStaleRefreshing: false })) }
})

const useUSDCPriceMock = vi.mocked(useUSDCPrice)

function usdcPrice(token: Token, usdPerToken: number): Price<Token, Token> {
  return new Price(
    token,
    USDC,
    JSBI.BigInt(10 ** token.decimals),
    JSBI.BigInt(Math.round(usdPerToken * 10 ** USDC.decimals)),
  )
}

describe('useUSDTokenUpdater', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports loading while a withheld stale price is being refetched', () => {
    useUSDCPriceMock.mockReturnValue({ price: undefined, isLoading: false, isStaleRefreshing: true })

    const { result } = renderHook(() =>
      useUSDTokenUpdater({ isFiatInput: false, exactAmount: '0.1', exactCurrency: ETH }),
    )

    expect(result.current).toEqual({ formattedAmount: undefined, loading: true })
  })

  it('reports loading while the first price is pending', () => {
    useUSDCPriceMock.mockReturnValue({ price: undefined, isLoading: true, isStaleRefreshing: false })

    const { result } = renderHook(() =>
      useUSDTokenUpdater({ isFiatInput: false, exactAmount: '0.1', exactCurrency: ETH }),
    )

    expect(result.current).toEqual({ formattedAmount: undefined, loading: true })
  })

  it('is not loading when the price is settled as missing', () => {
    useUSDCPriceMock.mockReturnValue({ price: undefined, isLoading: false, isStaleRefreshing: false })

    const { result } = renderHook(() =>
      useUSDTokenUpdater({ isFiatInput: false, exactAmount: '0.1', exactCurrency: ETH }),
    )

    expect(result.current).toEqual({ formattedAmount: undefined, loading: false })
  })

  it('converts a token amount to fiat once the price is available', () => {
    useUSDCPriceMock.mockReturnValue({ price: usdcPrice(ETH, 2000), isLoading: false, isStaleRefreshing: false })

    const { result } = renderHook(() =>
      useUSDTokenUpdater({ isFiatInput: false, exactAmount: '0.1', exactCurrency: ETH }),
    )

    expect(result.current).toEqual({ formattedAmount: '200.00', loading: false })
  })
})
