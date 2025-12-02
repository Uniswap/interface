import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useDefaultInitialPrice } from 'components/Liquidity/Create/hooks/useDefaultInitialPrice'
import JSBI from 'jsbi'
import { renderHook } from 'test-utils/render'
import { PositionField } from 'types/position'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { USDC } from 'uniswap/src/constants/tokens'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { ETH } from 'uniswap/src/test/fixtures/lib/sdk'

vi.mock('uniswap/src/features/transactions/swap/hooks/useTrade', () => ({
  useTrade: vi.fn(),
}))

const useTradeMock = vi.mocked(useTrade)

describe('useDefaultInitialPrice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call useTrade with correct parameters', () => {
    useTradeMock.mockReturnValue({
      trade: null,
      isLoading: false,
      error: null,
      isIndicativeLoading: false,
      indicativeTrade: undefined,
      gasEstimate: undefined,
      quoteHash: '',
    })

    const currencies = {
      [PositionField.TOKEN0]: USDC,
      [PositionField.TOKEN1]: ETH,
    }

    renderHook(() => useDefaultInitialPrice({ currencies }))

    expect(useTrade).toHaveBeenNthCalledWith(1, {
      amountSpecified: CurrencyAmount.fromRawAmount(
        currencies[PositionField.TOKEN0],
        JSBI.BigInt(10 ** currencies[PositionField.TOKEN0].decimals),
      ),
      otherCurrency: currencies[PositionField.TOKEN1],
      tradeType: TradeType.EXACT_INPUT,
      pollInterval: PollingInterval.Slow,
      skip: undefined,
    })
  })

  it('should return undefined when useTrade returns an error', () => {
    useTradeMock.mockReturnValue({
      trade: null,
      isLoading: false,
      error: new Error('test error'),
      indicativeTrade: undefined,
      isIndicativeLoading: false,
      gasEstimate: undefined,
      quoteHash: '',
    })

    const currencies = {
      [PositionField.TOKEN0]: USDC,
      [PositionField.TOKEN1]: ETH,
    }

    const { result } = renderHook(() => useDefaultInitialPrice({ currencies }))

    expect(result.current).toEqual({ price: undefined, isLoading: false })
  })

  it('should return isLoading true when useTrade is loading', () => {
    useTradeMock.mockReturnValue({
      trade: null,
      isLoading: true,
      error: null,
      indicativeTrade: undefined,
      isIndicativeLoading: false,
      gasEstimate: undefined,
      quoteHash: '',
    })

    const currencies = {
      [PositionField.TOKEN0]: USDC,
      [PositionField.TOKEN1]: ETH,
    }

    const { result } = renderHook(() => useDefaultInitialPrice({ currencies }))

    expect(result.current).toEqual({ price: undefined, isLoading: true })
  })

  it('should return price when useTrade returns a trade', () => {
    useTradeMock.mockReturnValue({
      trade: {
        inputAmount: CurrencyAmount.fromRawAmount(ETH, JSBI.BigInt(1 * 10 ** ETH.decimals)),
        outputAmount: CurrencyAmount.fromRawAmount(USDC, JSBI.BigInt(2000 * 10 ** USDC.decimals)),
      } as any,
      isLoading: false,
      error: null,
      indicativeTrade: undefined,
      isIndicativeLoading: false,
      gasEstimate: undefined,
      quoteHash: '',
    })

    const currencies = {
      [PositionField.TOKEN0]: ETH,
      [PositionField.TOKEN1]: USDC,
    }

    const { result } = renderHook(() => useDefaultInitialPrice({ currencies }))

    expect(result.current.price?.toSignificant(8)).toEqual('2000')
    expect(result.current.price?.invert().toSignificant(8)).toEqual('0.0005')
    expect(result.current.isLoading).toEqual(false)
  })
})
