import { processUniswapXResponse } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/uniswapx/utils'
import { createMockPermitData } from 'uniswap/src/test/fixtures/transactions/swap'

describe('processUniswapXResponse', () => {
  it('should return swapTxAndGasInfo with zero gas fee', () => {
    // Given
    const permitData = createMockPermitData('USDC')

    // When
    const result = processUniswapXResponse({
      permitData,
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
      permitData,
    })
  })
})
