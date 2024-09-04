import { renderHook } from '@testing-library/react-hooks'
import { UNI, WBTC } from 'uniswap/src/constants/tokens'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountType, SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import { createMockDerivedSwapInfo } from 'uniswap/src/test/fixtures/transactions/swap'
import { UniverseChainId } from 'uniswap/src/types/chains'
import {
  ClassicSwapTxAndGasInfo,
  useSwapTxAndGasInfo,
} from 'wallet/src/features/transactions/swap/trade/api/hooks/useSwapTxAndGasInfo'
import { useTokenApprovalInfo } from 'wallet/src/features/transactions/swap/trade/api/hooks/useTokenApprovalInfo'
import {
  TransactionRequestInfo,
  useTransactionRequestInfo,
} from 'wallet/src/features/transactions/swap/trade/api/hooks/useTransactionRequestInfo'

jest.mock('wallet/src/features/transactions/swap/trade/api/hooks/useTokenApprovalInfo')
jest.mock('wallet/src/features/transactions/swap/trade/api/hooks/useTransactionRequestInfo')

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
    const mockTokenApprovalInfo = {
      action: ApprovalAction.Approve,
      txRequest: {
        to: '0x456',
        chainId: 1,
        gasLimit: '100000',
        maxFeePerGas: '300000',
        maxPriorityFeePerGas: '400000',
      },
      gasFee: '200000',
    }
    const mockSwapTxInfo: TransactionRequestInfo = {
      transactionRequest: { to: '0x456', chainId: 1 },
      gasFeeResult: { value: '123', isLoading: false, error: null },
      gasFeeEstimation: {
        gasUseEstimate: '500000',
        gasFee: '600000',
        maxFeePerGas: '700000',
        maxPriorityFeePerGas: '800000',
      },
      permitSignature: undefined,
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
      gasFee: { value: '200123', isLoading: false, error: null },
      gasFeeEstimation: {
        swapFee: {
          gasUseEstimate: '500000',
          gasFee: '600000',
          maxFeePerGas: '700000',
          maxPriorityFeePerGas: '800000',
        },
        approvalFee: {
          gasUseEstimate: '100000',
          gasFee: '200000',
          maxFeePerGas: '300000',
          maxPriorityFeePerGas: '400000',
        },
      },
      approvalError: false,
    })
  })
})
