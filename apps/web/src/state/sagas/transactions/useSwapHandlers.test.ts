import { FeeType, TradingApi } from '@universe/api'
import { useSwapCallback } from 'state/sagas/transactions/swapSaga'
import { useSwapHandlers, validateWrapParams } from 'state/sagas/transactions/useSwapHandlers'
import { renderHook } from 'test-utils/render'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { DEFAULT_GAS_STRATEGY } from 'uniswap/src/features/gas/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ExecuteSwapParams } from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import {
  ValidatedClassicSwapTxAndGasInfo,
  ValidatedSwapTxContext,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isWrap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

// Create mock functions in hoisted scope so they're available to vi.mock
const { mockSwapCallbackFn, mockWrapCallbackFn } = vi.hoisted(() => ({
  mockSwapCallbackFn: vi.fn(),
  mockWrapCallbackFn: vi.fn(),
}))

// Mock dependencies - only mock the hooks, not the sagas themselves
vi.mock('state/sagas/transactions/swapSaga', () => ({
  useSwapCallback: vi.fn(() => mockSwapCallbackFn),
  swapSaga: {
    wrappedSaga: vi.fn(),
    actions: {
      trigger: vi.fn(),
    },
  },
}))

vi.mock('state/sagas/transactions/wrapSaga', () => ({
  useWrapCallback: vi.fn(() => mockWrapCallbackFn),
  wrapSaga: {
    wrappedSaga: vi.fn(),
    actions: {
      trigger: vi.fn(),
    },
  },
}))

vi.mock('uniswap/src/features/transactions/swap/utils/routing', () => ({
  isWrap: vi.fn(),
}))

describe('validateWrapParams', () => {
  const mockInputCurrencyAmount = {
    currency: { symbol: 'ETH' },
    quotient: BigInt(1000000000000000000),
  } as any

  const mockAccount: SignerMnemonicAccountDetails = {
    platform: Platform.EVM,
    accountType: AccountType.SignerMnemonic,
    address: '0x123',
    walletMeta: {
      id: 'test-wallet-id',
      name: 'Test Wallet',
    },
  }

  const mockSwapTxContext: ValidatedClassicSwapTxAndGasInfo = {
    routing: TradingApi.Routing.CLASSIC,
    txRequests: [
      {
        chainId: 1,
        to: '0xabc',
        from: '0x123',
        data: '0x',
        value: '0',
      },
    ],
    gasFeeEstimation: {
      wrapEstimate: {
        gasLimit: '21000',
        maxFeePerGas: '1000000000',
        maxPriorityFeePerGas: '1000000000',
        type: FeeType.EIP1559,
        strategy: DEFAULT_GAS_STRATEGY,
        gasFee: '21000000000000',
      },
    },
    includesDelegation: false,
    unsigned: false,
    permit: undefined,
    trade: {} as any,
    approveTxRequest: undefined,
    revocationTxRequest: undefined,
    gasFee: {
      value: '21000',
      isLoading: false,
      error: null,
    },
    swapRequestArgs: undefined,
  }

  it('should return validated params when all required fields are present', () => {
    const params: ExecuteSwapParams = {
      account: mockAccount,
      swapTxContext: mockSwapTxContext,
      isAutoSlippage: true,
      onSuccess: vi.fn(),
      onFailure: vi.fn(),
      onPending: vi.fn(),
      setCurrentStep: vi.fn(),
      setSteps: vi.fn(),
      wrapType: WrapType.Wrap,
      inputCurrencyAmount: mockInputCurrencyAmount,
    }

    const result = validateWrapParams(params)

    expect(result).toEqual({
      inputCurrencyAmount: mockInputCurrencyAmount,
      wrapType: WrapType.Wrap,
    })
  })

  it('should throw error when inputCurrencyAmount is missing', () => {
    const params: ExecuteSwapParams = {
      account: mockAccount,
      swapTxContext: mockSwapTxContext,
      isAutoSlippage: true,
      onSuccess: vi.fn(),
      onFailure: vi.fn(),
      onPending: vi.fn(),
      setCurrentStep: vi.fn(),
      setSteps: vi.fn(),
      wrapType: WrapType.Wrap,
      inputCurrencyAmount: undefined,
    }

    expect(() => validateWrapParams(params)).toThrow('Missing required wrap parameters')
  })

  it('should throw error when wrapType is missing', () => {
    const params: ExecuteSwapParams = {
      account: mockAccount,
      swapTxContext: mockSwapTxContext,
      isAutoSlippage: true,
      onSuccess: vi.fn(),
      onFailure: vi.fn(),
      onPending: vi.fn(),
      setCurrentStep: vi.fn(),
      setSteps: vi.fn(),
      wrapType: undefined,
      inputCurrencyAmount: mockInputCurrencyAmount,
    }

    expect(() => validateWrapParams(params)).toThrow('Missing required wrap parameters')
  })

  it('should throw error when both wrapType and inputCurrencyAmount are missing', () => {
    const params: ExecuteSwapParams = {
      account: mockAccount,
      swapTxContext: mockSwapTxContext,
      isAutoSlippage: true,
      onSuccess: vi.fn(),
      onFailure: vi.fn(),
      onPending: vi.fn(),
      setCurrentStep: vi.fn(),
      setSteps: vi.fn(),
      wrapType: undefined,
      inputCurrencyAmount: undefined,
    }

    expect(() => validateWrapParams(params)).toThrow('Missing required wrap parameters')
  })
})

describe('useSwapHandlers', () => {
  const mockOnSuccess = vi.fn()
  const mockOnFailure = vi.fn()
  const mockOnPending = vi.fn()
  const mockSetCurrentStep = vi.fn()
  const mockSetSteps = vi.fn()

  const mockAccount: SignerMnemonicAccountDetails = {
    platform: Platform.EVM,
    accountType: AccountType.SignerMnemonic,
    address: '0x123',
    walletMeta: {
      id: 'test-wallet-id',
      name: 'Test Wallet',
    },
  }

  const mockSwapTxContext: ValidatedClassicSwapTxAndGasInfo = {
    routing: TradingApi.Routing.CLASSIC,
    txRequests: [
      {
        chainId: 1,
        to: '0xabc',
        from: '0x123',
        data: '0x',
        value: '0',
      },
    ],
    gasFeeEstimation: {
      wrapEstimate: {
        gasLimit: '21000',
        maxFeePerGas: '1000000000',
        maxPriorityFeePerGas: '1000000000',
        type: FeeType.EIP1559,
        strategy: DEFAULT_GAS_STRATEGY,
        gasFee: '21000000000000',
      },
    },
    includesDelegation: false,
    unsigned: false,
    permit: undefined,
    trade: {} as any,
    approveTxRequest: undefined,
    revocationTxRequest: undefined,
    gasFee: {
      value: '21000',
      isLoading: false,
      error: null,
    },
    swapRequestArgs: undefined,
  }

  const baseExecuteParams: ExecuteSwapParams = {
    account: mockAccount,
    swapTxContext: mockSwapTxContext,
    isAutoSlippage: true,
    onSuccess: mockOnSuccess,
    onFailure: mockOnFailure,
    onPending: mockOnPending,
    setCurrentStep: mockSetCurrentStep,
    setSteps: mockSetSteps,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('prepareAndSign', () => {
    it('should be a no-op callback that returns a promise', async () => {
      const { result } = renderHook(() => useSwapHandlers())

      await expect(result.current.prepareAndSign({ swapTxContext: mockSwapTxContext })).resolves.toBeUndefined()
    })

    it('should not call any callbacks', async () => {
      const { result } = renderHook(() => useSwapHandlers())

      await result.current.prepareAndSign({ swapTxContext: mockSwapTxContext })

      expect(mockSwapCallbackFn).not.toHaveBeenCalled()
      expect(mockWrapCallbackFn).not.toHaveBeenCalled()
    })
  })

  describe('execute', () => {
    describe('when transaction is a wrap', () => {
      beforeEach(() => {
        vi.mocked(isWrap).mockReturnValue(true)
      })

      it('should call wrapCallback with correct parameters', async () => {
        const mockInputCurrencyAmount = {
          currency: { symbol: 'ETH' },
          quotient: BigInt(1000000000000000000),
        } as any

        const params: ExecuteSwapParams = {
          ...baseExecuteParams,
          wrapType: WrapType.Wrap,
          inputCurrencyAmount: mockInputCurrencyAmount,
          txId: 'test-tx-id',
        }

        const { result } = renderHook(() => useSwapHandlers())
        await result.current.execute(params)

        expect(mockWrapCallbackFn).toHaveBeenCalledWith({
          account: mockAccount,
          inputCurrencyAmount: mockInputCurrencyAmount,
          txRequest: mockSwapTxContext.txRequests![0],
          txId: 'test-tx-id',
          wrapType: WrapType.Wrap,
          gasEstimate: mockSwapTxContext.gasFeeEstimation.wrapEstimate,
          onSuccess: mockOnSuccess,
          onFailure: mockOnFailure,
        })
        expect(mockSwapCallbackFn).not.toHaveBeenCalled()
      })

      it('should call onFailure when inputCurrencyAmount is missing', async () => {
        const params: ExecuteSwapParams = {
          ...baseExecuteParams,
          wrapType: WrapType.Wrap,
          inputCurrencyAmount: undefined,
        }

        const { result } = renderHook(() => useSwapHandlers())
        await result.current.execute(params)

        expect(mockOnFailure).toHaveBeenCalledWith(new Error('Missing required wrap parameters'))
        expect(mockWrapCallbackFn).not.toHaveBeenCalled()
        expect(mockSwapCallbackFn).not.toHaveBeenCalled()
      })

      it('should call onFailure when wrapType is missing', async () => {
        const mockInputCurrencyAmount = {
          currency: { symbol: 'ETH' },
          quotient: BigInt(1000000000000000000),
        } as any

        const params: ExecuteSwapParams = {
          ...baseExecuteParams,
          wrapType: undefined,
          inputCurrencyAmount: mockInputCurrencyAmount,
        }

        const { result } = renderHook(() => useSwapHandlers())
        await result.current.execute(params)

        expect(mockOnFailure).toHaveBeenCalledWith(new Error('Missing required wrap parameters'))
        expect(mockWrapCallbackFn).not.toHaveBeenCalled()
        expect(mockSwapCallbackFn).not.toHaveBeenCalled()
      })

      it('should call onFailure when both wrapType and inputCurrencyAmount are missing', async () => {
        const params: ExecuteSwapParams = {
          ...baseExecuteParams,
          wrapType: undefined,
          inputCurrencyAmount: undefined,
        }

        const { result } = renderHook(() => useSwapHandlers())
        await result.current.execute(params)

        expect(mockOnFailure).toHaveBeenCalledWith(new Error('Missing required wrap parameters'))
        expect(mockWrapCallbackFn).not.toHaveBeenCalled()
        expect(mockSwapCallbackFn).not.toHaveBeenCalled()
      })
    })

    describe('when transaction is a regular swap', () => {
      beforeEach(() => {
        vi.mocked(isWrap).mockReturnValue(false)
      })

      it('should call swapCallback with correct parameters', async () => {
        const mockCurrencyInAmountUSD = {
          currency: { symbol: 'USD' },
          quotient: BigInt(1000),
        } as any

        const mockCurrencyOutAmountUSD = {
          currency: { symbol: 'USD' },
          quotient: BigInt(2000),
        } as any

        const params: ExecuteSwapParams = {
          ...baseExecuteParams,
          currencyInAmountUSD: mockCurrencyInAmountUSD,
          currencyOutAmountUSD: mockCurrencyOutAmountUSD,
          isAutoSlippage: false,
          presetPercentage: 50,
          preselectAsset: true,
          txId: 'test-swap-tx-id',
          isFiatInputMode: true,
        }

        const { result } = renderHook(() => useSwapHandlers())
        await result.current.execute(params)

        expect(mockSwapCallbackFn).toHaveBeenCalledWith({
          account: mockAccount,
          swapTxContext: mockSwapTxContext,
          currencyInAmountUSD: mockCurrencyInAmountUSD,
          currencyOutAmountUSD: mockCurrencyOutAmountUSD,
          isAutoSlippage: false,
          presetPercentage: 50,
          preselectAsset: true,
          onSuccess: mockOnSuccess,
          onFailure: mockOnFailure,
          onPending: mockOnPending,
          txId: 'test-swap-tx-id',
          setCurrentStep: mockSetCurrentStep,
          setSteps: mockSetSteps,
          isFiatInputMode: true,
          includesDelegation: false,
        })
        expect(mockWrapCallbackFn).not.toHaveBeenCalled()
      })

      it('should call swapCallback with optional parameters as undefined', async () => {
        const params: ExecuteSwapParams = {
          ...baseExecuteParams,
        }

        const { result } = renderHook(() => useSwapHandlers())
        await result.current.execute(params)

        expect(mockSwapCallbackFn).toHaveBeenCalledWith({
          account: mockAccount,
          swapTxContext: mockSwapTxContext,
          currencyInAmountUSD: undefined,
          currencyOutAmountUSD: undefined,
          isAutoSlippage: true,
          presetPercentage: undefined,
          preselectAsset: undefined,
          onSuccess: mockOnSuccess,
          onFailure: mockOnFailure,
          onPending: mockOnPending,
          txId: undefined,
          setCurrentStep: mockSetCurrentStep,
          setSteps: mockSetSteps,
          isFiatInputMode: undefined,
          includesDelegation: false,
        })
        expect(mockWrapCallbackFn).not.toHaveBeenCalled()
      })

      it('should pass includesDelegation from swapTxContext', async () => {
        const txContextWithDelegation = {
          ...mockSwapTxContext,
          includesDelegation: true,
        } as unknown as ValidatedSwapTxContext

        const params: ExecuteSwapParams = {
          ...baseExecuteParams,
          swapTxContext: txContextWithDelegation,
        }

        const { result } = renderHook(() => useSwapHandlers())
        await result.current.execute(params)

        expect(mockSwapCallbackFn).toHaveBeenCalledWith(
          expect.objectContaining({
            includesDelegation: true,
          }),
        )
      })
    })
  })

  describe('memoization', () => {
    it('should memoize the returned handlers object', () => {
      const { result, rerender } = renderHook(() => useSwapHandlers())
      const firstResult = result.current

      rerender()
      const secondResult = result.current

      expect(firstResult).toBe(secondResult)
    })

    it('should update handlers when dependencies change', () => {
      const { result, rerender } = renderHook(() => useSwapHandlers())
      const firstResult = result.current

      // Change the mock implementation - clear and set new value
      mockSwapCallbackFn.mockClear()
      const newMockSwapCallback = vi.fn()
      vi.mocked(useSwapCallback).mockReturnValueOnce(newMockSwapCallback)

      rerender()
      const secondResult = result.current

      expect(firstResult).not.toBe(secondResult)
    })
  })
})
