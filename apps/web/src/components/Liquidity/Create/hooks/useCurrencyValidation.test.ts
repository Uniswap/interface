import { useCurrencyValidation } from 'components/Liquidity/Create/hooks/useCurrencyValidation'
import { createCurrencyParsersWithValidation } from 'components/Liquidity/parsers/urlParsers'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrencyWithLoading } from 'hooks/Tokens'
import { renderHook } from 'test-utils/render'
import { nativeOnChain, USDC, USDC_UNICHAIN } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const ETH = nativeOnChain(UniverseChainId.Mainnet)

vi.mock('components/Liquidity/parsers/urlParsers', () => ({
  createCurrencyParsersWithValidation: vi.fn(),
}))

vi.mock('hooks/Tokens', () => ({
  useCurrencyWithLoading: vi.fn(),
}))

const createCurrencyParsersWithValidationMock = vi.mocked(createCurrencyParsersWithValidation)
const useCurrencyWithLoadingMock = vi.mocked(useCurrencyWithLoading)

describe('useCurrencyValidation', () => {
  const mockChainId = UniverseChainId.Mainnet
  const mockTokenAddressA = '0x123abc456def789'
  const mockTokenAddressB = '0x456def789abc123'
  const mockValidateCurrencies = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    createCurrencyParsersWithValidationMock.mockReturnValue({
      currencyA: {} as any,
      currencyB: {} as any,
      validateCurrencies: mockValidateCurrencies,
    })

    useCurrencyWithLoadingMock.mockReturnValue({
      currency: undefined,
      loading: false,
    })
  })

  describe('no currencies provided', () => {
    it('should return default initial token when no currencies provided', () => {
      mockValidateCurrencies.mockReturnValue({
        currencyAddressA: undefined,
        currencyAddressB: undefined,
      })

      const { result } = renderHook(() =>
        useCurrencyValidation({
          currencyA: undefined,
          currencyB: undefined,
          defaultInitialToken: ETH,
          chainId: mockChainId,
        }),
      )

      expect(result.current).toEqual({
        currencyAddressA: NATIVE_CHAIN_ID,
        currencyAddressB: undefined,
        currencyALoaded: ETH,
        currencyBLoaded: undefined,
        loadingA: false,
        loadingB: false,
        loading: false,
      })
    })
  })

  describe('no valid currencies provided', () => {
    it('should return default initial token when no valid currencies provided', () => {
      mockValidateCurrencies.mockReturnValue({
        currencyAddressA: USDC_UNICHAIN.address,
        currencyAddressB: undefined,
      })

      const { result } = renderHook(() =>
        useCurrencyValidation({
          currencyA: USDC_UNICHAIN.address,
          currencyB: undefined,
          defaultInitialToken: ETH,
          chainId: UniverseChainId.Mainnet,
        }),
      )

      expect(result.current).toEqual({
        currencyAddressA: NATIVE_CHAIN_ID,
        currencyAddressB: undefined,
        currencyALoaded: ETH,
        currencyBLoaded: undefined,
        loadingA: false,
        loadingB: false,
        loading: false,
      })
    })
  })

  describe('currencyA provided', () => {
    it('should validate and load when only currencyA provided', () => {
      mockValidateCurrencies.mockReturnValue({
        currencyAddressA: mockTokenAddressA,
        currencyAddressB: undefined,
      })

      // Mock the first call (currencyA) to return ETH, second call (currencyB) to return undefined
      useCurrencyWithLoadingMock
        .mockReturnValueOnce({
          currency: ETH,
          loading: false,
        })
        .mockReturnValueOnce({
          currency: undefined,
          loading: false,
        })

      const { result } = renderHook(() =>
        useCurrencyValidation({
          currencyA: mockTokenAddressA,
          currencyB: undefined,
          defaultInitialToken: USDC,
          chainId: mockChainId,
        }),
      )

      expect(createCurrencyParsersWithValidationMock).toHaveBeenCalledWith(mockChainId)
      expect(mockValidateCurrencies).toHaveBeenCalledWith(mockTokenAddressA, undefined)
      expect(result.current).toEqual({
        currencyAddressA: mockTokenAddressA,
        currencyAddressB: undefined,
        currencyALoaded: ETH,
        currencyBLoaded: undefined,
        loadingA: false,
        loadingB: false,
        loading: false,
      })
    })

    it('should validate and load when only currencyB provided', () => {
      mockValidateCurrencies.mockReturnValue({
        currencyAddressA: undefined,
        currencyAddressB: mockTokenAddressB,
      })

      // Mock the first call (currencyA) to return undefined, second call (currencyB) to return USDC
      useCurrencyWithLoadingMock
        .mockReturnValueOnce({
          currency: undefined,
          loading: false,
        })
        .mockReturnValueOnce({
          currency: USDC,
          loading: false,
        })

      const { result } = renderHook(() =>
        useCurrencyValidation({
          currencyA: undefined,
          currencyB: mockTokenAddressB,
          defaultInitialToken: ETH,
          chainId: mockChainId,
        }),
      )

      expect(mockValidateCurrencies).toHaveBeenCalledWith(undefined, mockTokenAddressB)
      expect(result.current).toEqual({
        currencyAddressA: NATIVE_CHAIN_ID,
        currencyAddressB: mockTokenAddressB,
        currencyALoaded: ETH,
        currencyBLoaded: USDC,
        loadingA: false,
        loadingB: false,
        loading: false,
      })
    })
  })

  describe('both currencies provided', () => {
    it('should validate and load both currencies successfully', () => {
      mockValidateCurrencies.mockReturnValue({
        currencyAddressA: mockTokenAddressA,
        currencyAddressB: mockTokenAddressB,
      })

      useCurrencyWithLoadingMock
        .mockReturnValueOnce({
          currency: ETH,
          loading: false,
        })
        .mockReturnValueOnce({
          currency: USDC,
          loading: false,
        })

      const { result } = renderHook(() =>
        useCurrencyValidation({
          currencyA: mockTokenAddressA,
          currencyB: mockTokenAddressB,
          defaultInitialToken: ETH,
          chainId: mockChainId,
        }),
      )

      expect(mockValidateCurrencies).toHaveBeenCalledWith(mockTokenAddressA, mockTokenAddressB)
      expect(useCurrencyWithLoadingMock).toHaveBeenCalledTimes(2)
      expect(result.current).toEqual({
        currencyAddressA: mockTokenAddressA,
        currencyAddressB: mockTokenAddressB,
        currencyALoaded: ETH,
        currencyBLoaded: USDC,
        loadingA: false,
        loadingB: false,
        loading: false,
      })
    })

    it('should return loading true when currencies are loading', () => {
      mockValidateCurrencies.mockReturnValue({
        currencyAddressA: mockTokenAddressA,
        currencyAddressB: mockTokenAddressB,
      })

      // Mock first call loading, second call loaded
      useCurrencyWithLoadingMock
        .mockReturnValueOnce({
          currency: undefined,
          loading: true,
        })
        .mockReturnValueOnce({
          currency: USDC,
          loading: false,
        })

      const { result } = renderHook(() =>
        useCurrencyValidation({
          currencyA: mockTokenAddressA,
          currencyB: mockTokenAddressB,
          defaultInitialToken: ETH,
          chainId: mockChainId,
        }),
      )

      expect(result.current.loading).toBe(true)
    })
  })
})
