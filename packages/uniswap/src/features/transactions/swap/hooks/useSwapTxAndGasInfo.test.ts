import { renderHook } from '@testing-library/react-hooks'
import { UNI, WBTC } from 'uniswap/src/constants/tokens'
import { FeeType, Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountType, SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { DEFAULT_GAS_STRATEGY } from 'uniswap/src/features/gas/hooks'
import { useSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/hooks/useSwapTxAndGasInfo'
import { useTokenApprovalInfo } from 'uniswap/src/features/transactions/swap/hooks/useTokenApprovalInfo'
import {
  TransactionRequestInfo,
  useTransactionRequestInfo,
} from 'uniswap/src/features/transactions/swap/hooks/useTransactionRequestInfo'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { ClassicSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import { createMockDerivedSwapInfo } from 'uniswap/src/test/fixtures/transactions/swap'
import { UniverseChainId } from 'uniswap/src/types/chains'

jest.mock('uniswap/src/features/transactions/swap/hooks/useTokenApprovalInfo')
jest.mock('uniswap/src/features/transactions/swap/hooks/useTransactionRequestInfo')

describe('useSwapTxAndGasInfo', () => {
  const mockDerivedSwapInfo: DerivedSwapInfo = createMockDerivedSwapInfo(
    UNI[UniverseChainId.Mainnet],
    WBTC,
    '1000000000000000000',
    '1000000000',
  )

  const mockAccount: SignerMnemonicAccountMeta = { address: '0x123', type: AccountType.SignerMnemonic }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return ClassicSwapTxAndGasInfo including gas estimates for classic trade', () => {
    const mockTokenApprovalInfo: ReturnType<typeof useTokenApprovalInfo> = {
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
      gasEstimates: {
        activeEstimate: {
          gasLimit: '100000',
          gasFee: '200000',
          maxFeePerGas: '300000',
          maxPriorityFeePerGas: '400000',
          type: FeeType.EIP1559,
          strategy: DEFAULT_GAS_STRATEGY,
        },
      },
    }
    const mockSwapTxInfo: TransactionRequestInfo = {
      transactionRequest: { to: '0x456', chainId: 1 },
      gasFeeResult: { value: '123', isLoading: false, error: null },
      gasEstimates: {
        activeEstimate: {
          gasLimit: '500000',
          gasFee: '600000',
          maxFeePerGas: '700000',
          maxPriorityFeePerGas: '800000',
          type: FeeType.EIP1559,
          strategy: DEFAULT_GAS_STRATEGY,
        },
      },
      permitSignature: undefined,
      swapRequestArgs: undefined,
    }

    ;(useTokenApprovalInfo as jest.Mock).mockReturnValue(mockTokenApprovalInfo)
    ;(useTransactionRequestInfo as jest.Mock).mockReturnValue(mockSwapTxInfo)

    const { result } = renderHook(() =>
      useSwapTxAndGasInfo({ derivedSwapInfo: mockDerivedSwapInfo, account: mockAccount }),
    )

    expect(result.current).toMatchObject<ClassicSwapTxAndGasInfo>({
      routing: Routing.CLASSIC,
      trade: expect.any(Object),
      txRequest: expect.any(Object),
      approveTxRequest: expect.any(Object),
      revocationTxRequest: expect.any(Object),
      gasFee: { value: '200123', isLoading: false, error: null },
      gasFeeEstimation: {
        swapEstimates: {
          activeEstimate: {
            gasLimit: '500000',
            gasFee: '600000',
            maxFeePerGas: '700000',
            maxPriorityFeePerGas: '800000',
            type: FeeType.EIP1559,
            strategy: DEFAULT_GAS_STRATEGY,
          },
        },
        approvalEstimates: {
          activeEstimate: {
            gasLimit: '100000',
            gasFee: '200000',
            maxFeePerGas: '300000',
            maxPriorityFeePerGas: '400000',
            type: FeeType.EIP1559,
            strategy: DEFAULT_GAS_STRATEGY,
          },
        },
      },
      approvalError: false,
      indicativeTrade: undefined,
      permitSignature: undefined,
      permitData: undefined,
      permitDataLoading: undefined,
      swapRequestArgs: undefined,
    })
  })
})
