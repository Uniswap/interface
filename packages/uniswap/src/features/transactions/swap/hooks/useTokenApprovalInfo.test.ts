import { renderHook } from '@testing-library/react-hooks'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { DAI } from 'uniswap/src/constants/tokens'
import { useCheckApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckApprovalQuery'
import { FeeType, Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta, AccountType } from 'uniswap/src/features/accounts/types'
import { DEFAULT_GAS_STRATEGY } from 'uniswap/src/features/gas/hooks'
import {
  TokenApprovalInfoParams,
  useTokenApprovalInfo,
} from 'uniswap/src/features/transactions/swap/hooks/useTokenApprovalInfo'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'

jest.mock('uniswap/src/data/apiClients/tradingApi/useCheckApprovalQuery')
jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))
const mockUseCheckApprovalQuery = useCheckApprovalQuery as jest.Mock

describe('useTokenApprovalInfo', () => {
  const mockAccount: AccountMeta = { address: '0x123', type: AccountType.SignerMnemonic }

  const mockTokenIn = new Token(UniverseChainId.Mainnet, DAI.address, DAI.decimals, DAI.symbol, DAI.name)

  const mockCurrencyInAmount = CurrencyAmount.fromRawAmount(mockTokenIn, '1000000000000000000') // 1 TKIN

  const mockParams: TokenApprovalInfoParams = {
    chainId: UniverseChainId.Mainnet,
    wrapType: WrapType.NotApplicable,
    currencyInAmount: mockCurrencyInAmount,
    routing: Routing.CLASSIC,
    account: mockAccount,
    skip: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return Permit2Approve action with correct txRequest and gas info', () => {
    const mockGasEstimates: GasFeeEstimates = {
      activeEstimate: {
        gasLimit: '500000',
        gasFee: '600000',
        maxFeePerGas: '700000',
        maxPriorityFeePerGas: '800000',
        type: FeeType.EIP1559,
        strategy: DEFAULT_GAS_STRATEGY,
      },
      shadowEstimates: [],
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
        gasEstimates: [mockGasEstimates.activeEstimate],
      },
      error: null,
    })

    const { result } = renderHook(() => useTokenApprovalInfo(mockParams))

    expect(result.current).toEqual({
      action: ApprovalAction.Permit2Approve,
      txRequest: {
        to: '0x456',
        chainId: UniverseChainId.Mainnet,
        gasLimit: '100000',
        maxFeePerGas: '300000',
        maxPriorityFeePerGas: '400000',
      },
      gasFee: '200000',
      gasEstimates: mockGasEstimates,
      cancelTxRequest: null,
    })
  })

  it('should handle undefined approval data gracefully', () => {
    mockUseCheckApprovalQuery.mockReturnValue({
      data: undefined,
      error: null,
    })

    const { result } = renderHook(() => useTokenApprovalInfo(mockParams))

    expect(result.current).toEqual({
      action: ApprovalAction.Unknown,
      txRequest: null,
      cancelTxRequest: null,
    })
  })

  it('should handle error state correctly', () => {
    const mockError = new Error('Approval check failed')
    mockUseCheckApprovalQuery.mockReturnValue({
      data: undefined,
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
      action: ApprovalAction.Unknown,
      txRequest: null,
      cancelTxRequest: null,
    })
  })
})
