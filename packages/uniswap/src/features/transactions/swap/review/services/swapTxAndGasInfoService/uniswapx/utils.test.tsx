import { FeeType } from 'uniswap/src/data/tradingApi/types'
import { DEFAULT_GAS_STRATEGY } from 'uniswap/src/features/gas/hooks'
import { processUniswapXResponse } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/uniswapx/utils'
import { TransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'

describe('processUniswapXResponse', () => {
  const baseWrapTransactionRequestInfo = {
    gasFeeResult: {
      value: '1000',
      displayValue: '0.001',
      isLoading: false,
      error: null,
    },
    transactionRequest: {
      to: '0x123',
      data: '0x456',
    },
    gasEstimate: {
      wrapEstimates: {
        activeEstimate: {
          strategy: DEFAULT_GAS_STRATEGY,
          gasLimit: '21000',
          maxFeePerGas: '100000000000',
          maxPriorityFeePerGas: '1000000000',
          type: FeeType.EIP1559,
          gasFee: '1000',
        },
        shadowEstimates: [],
      },
    },
    swapRequestArgs: undefined,
    permitSignature: undefined,
  } satisfies TransactionRequestInfo

  it('should extend wrap response when wrap is needed', () => {
    // Given
    const permitSignature = '0x789'
    const permitData = { fakePermitField: 'hi' }

    // When
    const result = processUniswapXResponse({
      wrapTransactionRequestInfo: baseWrapTransactionRequestInfo,
      permitSignature,
      permitData,
      permitDataLoading: false,
      needsWrap: true,
    })

    // Then
    expect(result).toEqual({
      ...baseWrapTransactionRequestInfo,
      permitSignature,
      permitData,
      permitDataLoading: false,
    })
  })

  it('should return zero gas fee when no wrap is needed', () => {
    // Given
    const permitSignature = '0x789'
    const permitData = { fakePermitField: 'hi' }

    // When
    const result = processUniswapXResponse({
      wrapTransactionRequestInfo: baseWrapTransactionRequestInfo,
      permitSignature,
      permitData,
      permitDataLoading: false,
      needsWrap: false,
    })

    // Then
    expect(result).toEqual({
      gasFeeResult: {
        value: '0',
        displayValue: '0',
        error: null,
        isLoading: false,
      },
      gasEstimate: {},
      transactionRequest: undefined,
      swapRequestArgs: undefined,
      permitSignature,
      permitData,
      permitDataLoading: false,
    })
  })
})
