import { renderHook } from '@testing-library/react'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { FeeType, GasEstimate, TradingApi } from '@universe/api'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { useCheckApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckApprovalQuery'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DEFAULT_GAS_STRATEGY } from 'uniswap/src/features/gas/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { TokenApprovalInfoParams } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import { useTokenApprovalInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { logger } from 'utilities/src/logger/logger'

jest.mock('uniswap/src/data/apiClients/tradingApi/useCheckApprovalQuery')
jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))
const mockUseCheckApprovalQuery = useCheckApprovalQuery as jest.Mock

describe('useTokenApprovalInfo', () => {
  const mockAccount: SignerMnemonicAccountDetails = {
    platform: Platform.EVM,
    address: '0x123',
    accountType: AccountType.SignerMnemonic,
    walletMeta: {
      id: '1',
      name: 'Test Wallet',
      icon: 'test-icon',
    },
  }

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
    account: mockAccount,
  }

  beforeEach(() => {
    jest.clearAllMocks()
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

    expect(logger.error).toHaveBeenCalledWith(mockError, {
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
})
