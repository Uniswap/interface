import { renderHook } from '@testing-library/react'
import { FeeType, TradingApi } from '@universe/api'
import { UNI, WBTC } from 'uniswap/src/constants/tokens'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { DEFAULT_GAS_STRATEGY } from 'uniswap/src/features/gas/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useTokenApprovalInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import type { TransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { useSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/hooks/useSwapTxAndGasInfo'
import { useTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/hooks/useTransactionRequestInfo'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { ClassicSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { createMockDerivedSwapInfo } from 'uniswap/src/test/fixtures/transactions/swap'

jest.mock('uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo')
jest.mock('uniswap/src/features/transactions/swap/stores/swapTxStore/hooks/useTransactionRequestInfo')

describe('useSwapTxAndGasInfo', () => {
  const mockDerivedSwapInfo: DerivedSwapInfo = createMockDerivedSwapInfo({
    inputCurrency: UNI[UniverseChainId.Mainnet],
    outputCurrency: WBTC,
    inputAmount: '1000000000000000000',
    outputAmount: '1000000000',
  })

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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return ClassicSwapTxAndGasInfo including gas estimates for classic trade', () => {
    const mockTokenApprovalInfo: ReturnType<typeof useTokenApprovalInfo>['tokenApprovalInfo'] = {
      action: ApprovalAction.RevokeAndPermit2Approve,
      txRequest: {
        to: '0x456',
        chainId: 1,
        gasLimit: '100000',
        maxFeePerGas: '300000',
        maxPriorityFeePerGas: '400000',
      },
      cancelTxRequest: {
        to: '0x789',
        chainId: 1,
        gasLimit: '100000',
        maxFeePerGas: '500000',
        maxPriorityFeePerGas: '600000',
      },
    }

    const mockApprovalGasFeeResult: GasFeeResult = {
      value: '200000',
      gasEstimate: {
        gasLimit: '100000',
        gasFee: '220000',
        maxFeePerGas: '300000',
        maxPriorityFeePerGas: '400000',
        type: FeeType.EIP1559,
        strategy: DEFAULT_GAS_STRATEGY,
      },
      isLoading: false,
      error: null,
    }

    const mockRevokeGasFeeResult: GasFeeResult = {
      value: '200000',
      gasEstimate: {
        gasLimit: '100000',
        gasFee: '220000',
        maxFeePerGas: '300000',
        maxPriorityFeePerGas: '400000',
        type: FeeType.EIP1559,
        strategy: DEFAULT_GAS_STRATEGY,
      },
      isLoading: false,
      error: null,
    }

    const mockSwapTxInfo: TransactionRequestInfo = {
      txRequests: [{ to: '0x456', chainId: 1 }],
      gasFeeResult: { value: '123', isLoading: false, error: null },
      gasEstimate: {
        swapEstimate: {
          gasLimit: '500000',
          gasFee: '600000',
          maxFeePerGas: '700000',
          maxPriorityFeePerGas: '800000',
          type: FeeType.EIP1559,
          strategy: DEFAULT_GAS_STRATEGY,
        },
      },
      swapRequestArgs: undefined,
    }

    ;(useTokenApprovalInfo as jest.Mock).mockReturnValue({
      tokenApprovalInfo: mockTokenApprovalInfo,
      approvalGasFeeResult: mockApprovalGasFeeResult,
      revokeGasFeeResult: mockRevokeGasFeeResult,
    })
    ;(useTransactionRequestInfo as jest.Mock).mockReturnValue(mockSwapTxInfo)

    const { result } = renderHook(() =>
      useSwapTxAndGasInfo({ derivedSwapInfo: mockDerivedSwapInfo, account: mockAccount }),
    )

    expect(result.current).toMatchObject<ClassicSwapTxAndGasInfo>({
      routing: TradingApi.Routing.CLASSIC,
      trade: expect.any(Object),
      txRequests: expect.any(Array),
      approveTxRequest: expect.any(Object),
      revocationTxRequest: expect.any(Object),
      gasFee: { value: '400123', isLoading: false, error: null },
      gasFeeEstimation: {
        swapEstimate: {
          gasLimit: '500000',
          gasFee: '600000',
          maxFeePerGas: '700000',
          maxPriorityFeePerGas: '800000',
          type: FeeType.EIP1559,
          strategy: DEFAULT_GAS_STRATEGY,
        },
        approvalEstimate: {
          gasLimit: '100000',
          gasFee: '220000',
          maxFeePerGas: '300000',
          maxPriorityFeePerGas: '400000',
          type: FeeType.EIP1559,
          strategy: DEFAULT_GAS_STRATEGY,
        },
      },
      permit: undefined,
      swapRequestArgs: undefined,
      unsigned: false,
      includesDelegation: undefined,
    })
  })
})
