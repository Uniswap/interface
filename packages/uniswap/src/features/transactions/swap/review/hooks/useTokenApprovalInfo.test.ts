import { renderHook } from '@testing-library/react'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { FeeType, GasEstimate, TradingApi } from '@universe/api'
import { useFeatureFlag } from '@universe/gating'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { useCheckApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckApprovalQuery'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DEFAULT_GAS_STRATEGY } from 'uniswap/src/features/gas/consts'
import type { TokenApprovalInfoParams } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import { useTokenApprovalInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import type { Mock } from 'vitest'

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setDatadogEnabled: vi.fn(),
  },
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: mockLogger,
}))
// Mock the gating layer so we can drive the GasFeeOverrides flag per test
vi.mock('@universe/gating', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...mod,
    useFeatureFlag: vi.fn(),
  }
})
vi.mock('uniswap/src/data/apiClients/tradingApi/useCheckApprovalQuery')
const mockUseCheckApprovalQuery = useCheckApprovalQuery as Mock

describe('useTokenApprovalInfo', () => {
  const mockTokenIn = new Token(UniverseChainId.Mainnet, DAI.address, DAI.decimals, DAI.symbol, DAI.name)
  const mockTokenOut = new Token(UniverseChainId.Mainnet, USDC.address, USDC.decimals, USDC.symbol, USDC.name)

  const mockCurrencyInAmount = CurrencyAmount.fromRawAmount(mockTokenIn, '1000000000000000000') // 1 TKIN
  const mockCurrencyOutAmount = CurrencyAmount.fromRawAmount(mockTokenOut, '2000000000000000000') // 2 TKOUT

  const mockParams: TokenApprovalInfoParams = {
    chainId: UniverseChainId.Mainnet,
    wrapType: WrapType.NotApplicable,
    currencyInAmount: mockCurrencyInAmount,
    currencyOutAmount: mockCurrencyOutAmount,
    routing: TradingApi.Routing.CLASSIC,
    address: '0x123',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default the flag to OFF; flag-on cases override below
    vi.mocked(useFeatureFlag).mockReturnValue(false)
  })

  it('should return Permit2Approve action with correct txRequest and gas info', () => {
    const mockGasEstimate: GasEstimate = {
      gasLimit: '500000',
      gasFee: '600000',
      maxFeePerGas: '700000',
      maxPriorityFeePerGas: '800000',
      type: FeeType.EIP1559,
      strategy: DEFAULT_GAS_STRATEGY,
    }

    mockUseCheckApprovalQuery.mockReturnValue({
      data: {
        approval: {
          to: '0x456',
          chainId: UniverseChainId.Mainnet,
          gasLimit: '100000',
          maxFeePerGas: '300000',
          maxPriorityFeePerGas: '400000',
        },
        gasFee: '200000',
        gasEstimates: [mockGasEstimate],
      },
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useTokenApprovalInfo(mockParams))

    expect(result.current).toEqual({
      tokenApprovalInfo: {
        action: ApprovalAction.Permit2Approve,
        txRequest: {
          to: '0x456',
          chainId: UniverseChainId.Mainnet,
          gasLimit: '100000',
          maxFeePerGas: '300000',
          maxPriorityFeePerGas: '400000',
        },
        cancelTxRequest: null,
      },
      approvalGasFeeResult: {
        value: '200000',
        displayValue: '173913',
        isLoading: false,
        error: null,
        gasEstimate: mockGasEstimate,
      },
      revokeGasFeeResult: {
        value: '0',
        displayValue: '0',
        isLoading: false,
        error: null,
      },
    })
  })

  it('should handle undefined approval data gracefully', () => {
    mockUseCheckApprovalQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useTokenApprovalInfo(mockParams))

    expect(result.current).toEqual({
      tokenApprovalInfo: {
        action: ApprovalAction.Unknown,
        txRequest: null,
        cancelTxRequest: null,
      },
      approvalGasFeeResult: {
        value: undefined,
        displayValue: undefined,
        isLoading: false,
        error: new Error('Approval action unknown'),
        gasEstimate: undefined,
      },
      revokeGasFeeResult: {
        value: undefined,
        displayValue: undefined,
        isLoading: false,
        error: new Error('Approval action unknown'),
        gasEstimate: undefined,
      },
    })
  })

  it('should handle error state correctly', () => {
    const mockError = new Error('Approval check failed')
    mockUseCheckApprovalQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    })

    const { result } = renderHook(() => useTokenApprovalInfo(mockParams))

    expect(mockLogger.error).toHaveBeenCalledWith(mockError, {
      tags: { file: 'useTokenApprovalInfo', function: 'useTokenApprovalInfo' },
      extra: {
        approvalRequestArgs: expect.any(Object),
      },
    })
    expect(result.current).toEqual({
      tokenApprovalInfo: {
        action: ApprovalAction.Unknown,
        txRequest: null,
        cancelTxRequest: null,
      },
      approvalGasFeeResult: {
        value: undefined,
        displayValue: undefined,
        isLoading: false,
        error: new Error('Approval action unknown'),
        gasEstimate: undefined,
      },
      revokeGasFeeResult: {
        value: undefined,
        displayValue: undefined,
        isLoading: false,
        error: new Error('Approval action unknown'),
        gasEstimate: undefined,
      },
    })
  })

  describe('isTokenApprovalApplicable from quote', () => {
    it('skips the check_approval query and returns None when false', () => {
      mockUseCheckApprovalQuery.mockReturnValue({ data: undefined, isLoading: false, error: null })

      const { result } = renderHook(() => useTokenApprovalInfo({ ...mockParams, isTokenApprovalApplicable: false }))

      expect(mockUseCheckApprovalQuery.mock.calls[0]?.[0]?.params).toBeUndefined()
      expect(result.current.tokenApprovalInfo).toEqual({
        action: ApprovalAction.None,
        txRequest: null,
        cancelTxRequest: null,
      })
      expect(result.current.approvalGasFeeResult.value).toBe('0')
      expect(result.current.revokeGasFeeResult.value).toBe('0')
    })

    it('still queries when absent (assume applicable)', () => {
      mockUseCheckApprovalQuery.mockReturnValue({ data: undefined, isLoading: false, error: null })

      renderHook(() => useTokenApprovalInfo(mockParams))

      expect(mockUseCheckApprovalQuery.mock.calls[0]?.[0]?.params).toBeDefined()
    })

    it('still queries when true', () => {
      mockUseCheckApprovalQuery.mockReturnValue({ data: undefined, isLoading: false, error: null })

      renderHook(() => useTokenApprovalInfo({ ...mockParams, isTokenApprovalApplicable: true }))

      expect(mockUseCheckApprovalQuery.mock.calls[0]?.[0]?.params).toBeDefined()
    })
  })

  describe('GasFeeOverrides flag wire shape', () => {
    it('sends gasStrategies (no urgency) when flag is OFF', () => {
      vi.mocked(useFeatureFlag).mockReturnValue(false)
      mockUseCheckApprovalQuery.mockReturnValue({ data: undefined, isLoading: false, error: null })

      renderHook(() => useTokenApprovalInfo(mockParams))

      const requestArgs = mockUseCheckApprovalQuery.mock.calls[0]?.[0]?.params as TradingApi.ApprovalRequest
      expect(requestArgs.gasStrategies).toEqual([DEFAULT_GAS_STRATEGY])
      expect(requestArgs.urgency).toBeUndefined()
    })

    it('sends urgency (no gasStrategies) when flag is ON', () => {
      vi.mocked(useFeatureFlag).mockReturnValue(true)
      mockUseCheckApprovalQuery.mockReturnValue({ data: undefined, isLoading: false, error: null })

      renderHook(() => useTokenApprovalInfo(mockParams))

      const requestArgs = mockUseCheckApprovalQuery.mock.calls[0]?.[0]?.params as TradingApi.ApprovalRequest
      expect(requestArgs.gasStrategies).toBeUndefined()
      expect(requestArgs.urgency).toBe('urgent')
    })
  })
})
