import { TransactionRequest } from '@ethersproject/providers'
import { renderHook } from '@testing-library/react'
import { useTransactionGasEstimation } from 'src/app/features/dappRequests/hooks/useTransactionGasEstimation'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { logger } from 'utilities/src/logger/logger'

// Mock dependencies
jest.mock('uniswap/src/features/gas/hooks', () => ({
  useTransactionGasFee: jest.fn(),
}))

jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

const mockUseTransactionGasFee = useTransactionGasFee as jest.MockedFunction<typeof useTransactionGasFee>
const mockLogger = logger as jest.Mocked<typeof logger>

describe('useTransactionGasEstimation', () => {
  const mockBaseTx: TransactionRequest = {
    to: '0x1234567890123456789012345678901234567890',
    value: '1000000000000000000', // 1 ETH
    data: '0x',
  }

  const mockChainId = UniverseChainId.Mainnet
  const mockSmartContractDelegationAddress = '0xabcdef1234567890123456789012345678901234'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('successful gas estimation', () => {
    it('should return valid gas fee result when estimation succeeds', () => {
      const mockGasFeeResult: GasFeeResult = {
        value: '21000000000000000', // 0.021 ETH
        displayValue: '21000000000000000',
        isLoading: false,
        error: null,
        params: {
          gasLimit: '21000',
          gasPrice: '1000000000', // 1 gwei
        },
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      const { result } = renderHook(() =>
        useTransactionGasEstimation({
          baseTx: mockBaseTx,
          chainId: mockChainId,
        }),
      )

      expect(result.current.gasFeeResult).toEqual(mockGasFeeResult)
      expect(result.current.isInvalidGasFeeResult).toBe(false)
      expect(mockUseTransactionGasFee).toHaveBeenCalledWith({
        tx: { ...mockBaseTx, chainId: mockChainId },
        skip: false,
        refetchInterval: PollingInterval.LightningMcQueen,
      })
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should include smart contract delegation address when provided', () => {
      const mockGasFeeResult: GasFeeResult = {
        value: '21000000000000000',
        displayValue: '21000000000000000',
        isLoading: false,
        error: null,
        params: {
          gasLimit: '21000',
          gasPrice: '1000000000',
        },
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      renderHook(() =>
        useTransactionGasEstimation({
          baseTx: mockBaseTx,
          chainId: mockChainId,
          smartContractDelegationAddress: mockSmartContractDelegationAddress,
        }),
      )

      expect(mockUseTransactionGasFee).toHaveBeenCalledWith({
        tx: { ...mockBaseTx, chainId: mockChainId },
        skip: false,
        refetchInterval: PollingInterval.LightningMcQueen,
        smartContractDelegationAddress: mockSmartContractDelegationAddress,
      })
    })
  })

  describe('loading state', () => {
    it('should handle loading state correctly', () => {
      const mockGasFeeResult: GasFeeResult = {
        isLoading: true,
        error: null,
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      const { result } = renderHook(() =>
        useTransactionGasEstimation({
          baseTx: mockBaseTx,
          chainId: mockChainId,
        }),
      )

      expect(result.current.gasFeeResult).toEqual(mockGasFeeResult)
      expect(result.current.isInvalidGasFeeResult).toBe(false) // Loading state is valid
      expect(mockLogger.error).not.toHaveBeenCalled() // No error should be logged during loading
    })
  })

  describe('error handling', () => {
    it('should handle gas fee estimation error and log it', () => {
      const mockError = new Error('Gas estimation failed')
      const mockGasFeeResult: GasFeeResult = {
        isLoading: false,
        error: mockError,
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      const { result } = renderHook(() =>
        useTransactionGasEstimation({
          baseTx: mockBaseTx,
          chainId: mockChainId,
        }),
      )

      expect(result.current.gasFeeResult).toEqual(mockGasFeeResult)
      expect(result.current.isInvalidGasFeeResult).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith(mockError, {
        tags: { file: 'useTransactionGasEstimation', function: 'useEffect' },
        extra: { request: { ...mockBaseTx, chainId: mockChainId } },
      })
    })

    it('should handle missing params as invalid result', () => {
      const mockGasFeeResult: GasFeeResult = {
        value: '21000000000000000',
        displayValue: '21000000000000000',
        isLoading: false,
        error: null,
        // params intentionally missing
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      const { result } = renderHook(() =>
        useTransactionGasEstimation({
          baseTx: mockBaseTx,
          chainId: mockChainId,
        }),
      )

      expect(result.current.isInvalidGasFeeResult).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith(new Error('Invalid gas fee result for dapp request.'), {
        tags: { file: 'useTransactionGasEstimation', function: 'useEffect' },
        extra: { request: { ...mockBaseTx, chainId: mockChainId } },
      })
    })

    it('should handle missing value as invalid result', () => {
      const mockGasFeeResult: GasFeeResult = {
        isLoading: false,
        error: null,
        params: {
          gasLimit: '21000',
          gasPrice: '1000000000',
        },
        // value intentionally missing
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      const { result } = renderHook(() =>
        useTransactionGasEstimation({
          baseTx: mockBaseTx,
          chainId: mockChainId,
        }),
      )

      expect(result.current.isInvalidGasFeeResult).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith(new Error('Invalid gas fee result for dapp request.'), {
        tags: { file: 'useTransactionGasEstimation', function: 'useEffect' },
        extra: { request: { ...mockBaseTx, chainId: mockChainId } },
      })
    })
  })

  describe('skip functionality', () => {
    it('should skip gas estimation when skip is true', () => {
      const mockGasFeeResult: GasFeeResult = {
        isLoading: false,
        error: null,
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      renderHook(() =>
        useTransactionGasEstimation({
          baseTx: mockBaseTx,
          chainId: mockChainId,
          skip: true,
        }),
      )

      expect(mockUseTransactionGasFee).toHaveBeenCalledWith({
        tx: { ...mockBaseTx, chainId: mockChainId },
        skip: true,
        refetchInterval: PollingInterval.LightningMcQueen,
      })
    })
  })

  describe('memoization', () => {
    it('should not recreate formatted tx when baseTx and chainId remain the same', () => {
      const mockGasFeeResult: GasFeeResult = {
        value: '21000000000000000',
        displayValue: '21000000000000000',
        isLoading: false,
        error: null,
        params: {
          gasLimit: '21000',
          gasPrice: '1000000000',
        },
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      const { rerender } = renderHook(
        ({ baseTx, chainId }) =>
          useTransactionGasEstimation({
            baseTx,
            chainId,
          }),
        {
          initialProps: {
            baseTx: mockBaseTx,
            chainId: mockChainId,
          },
        },
      )

      const firstCallArgs = mockUseTransactionGasFee.mock.calls[0]![0]

      // Rerender with same props
      rerender({
        baseTx: mockBaseTx,
        chainId: mockChainId,
      })

      const secondCallArgs = mockUseTransactionGasFee.mock.calls[1]![0]

      // The tx object should be the same reference due to memoization
      expect(firstCallArgs.tx).toBe(secondCallArgs.tx)
    })

    it('should recreate formatted tx when baseTx changes', () => {
      const mockGasFeeResult: GasFeeResult = {
        value: '21000000000000000',
        displayValue: '21000000000000000',
        isLoading: false,
        error: null,
        params: {
          gasLimit: '21000',
          gasPrice: '1000000000',
        },
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      const newBaseTx = { ...mockBaseTx, value: '2000000000000000000' } // 2 ETH

      const { rerender } = renderHook(
        ({ baseTx, chainId }) =>
          useTransactionGasEstimation({
            baseTx,
            chainId,
          }),
        {
          initialProps: {
            baseTx: mockBaseTx,
            chainId: mockChainId,
          },
        },
      )

      const firstCallArgs = mockUseTransactionGasFee.mock.calls[0]![0]

      // Rerender with different baseTx
      rerender({
        baseTx: newBaseTx,
        chainId: mockChainId,
      })

      const secondCallArgs = mockUseTransactionGasFee.mock.calls[1]![0]

      // The tx object should be different due to baseTx change
      expect(firstCallArgs.tx).not.toBe(secondCallArgs.tx)
      expect(secondCallArgs.tx!.value).toBe('2000000000000000000')
    })
  })

  describe('isInvalidGasFeeResultHelper', () => {
    it('should return false for valid gas fee results', () => {
      const mockGasFeeResult: GasFeeResult = {
        value: '21000000000000000',
        displayValue: '21000000000000000',
        isLoading: false,
        error: null,
        params: {
          gasLimit: '21000',
          gasPrice: '1000000000',
        },
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      const { result } = renderHook(() =>
        useTransactionGasEstimation({
          baseTx: mockBaseTx,
          chainId: mockChainId,
        }),
      )

      expect(result.current.isInvalidGasFeeResult).toBe(false)
    })

    it('should return true when there is an error', () => {
      const mockGasFeeResult: GasFeeResult = {
        isLoading: false,
        error: new Error('Test error'),
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      const { result } = renderHook(() =>
        useTransactionGasEstimation({
          baseTx: mockBaseTx,
          chainId: mockChainId,
        }),
      )

      expect(result.current.isInvalidGasFeeResult).toBe(true)
    })

    it('should return true when not loading but missing params', () => {
      const mockGasFeeResult: GasFeeResult = {
        value: '21000000000000000',
        isLoading: false,
        error: null,
        // params missing
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      const { result } = renderHook(() =>
        useTransactionGasEstimation({
          baseTx: mockBaseTx,
          chainId: mockChainId,
        }),
      )

      expect(result.current.isInvalidGasFeeResult).toBe(true)
    })

    it('should return true when not loading but missing value', () => {
      const mockGasFeeResult: GasFeeResult = {
        isLoading: false,
        error: null,
        params: {
          gasLimit: '21000',
          gasPrice: '1000000000',
        },
        // value missing
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      const { result } = renderHook(() =>
        useTransactionGasEstimation({
          baseTx: mockBaseTx,
          chainId: mockChainId,
        }),
      )

      expect(result.current.isInvalidGasFeeResult).toBe(true)
    })

    it('should return false when loading even with missing data', () => {
      const mockGasFeeResult: GasFeeResult = {
        isLoading: true,
        error: null,
        // params and value missing, but loading is true
      }

      mockUseTransactionGasFee.mockReturnValue(mockGasFeeResult)

      const { result } = renderHook(() =>
        useTransactionGasEstimation({
          baseTx: mockBaseTx,
          chainId: mockChainId,
        }),
      )

      expect(result.current.isInvalidGasFeeResult).toBe(false) // Should be false because loading state means data is still being fetched
    })
  })
})
