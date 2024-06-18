import 'test-utils/tokens/mocks'

import { permit2Address } from '@uniswap/permit2-sdk'
import { ChainId, TradeType as MockTradeType, Token } from '@taraswap/sdk-core'
import { getCurrency } from 'components/AccountDrawer/MiniPortfolio/Activity/getCurrency'
import {
  signatureToActivity,
  transactionToActivity,
  useLocalActivities,
} from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { DAI as MockDAI, USDC_MAINNET as MockUSDC_MAINNET, USDT as MockUSDT, nativeOnChain } from 'constants/tokens'
import { SignatureDetails, SignatureType } from 'state/signatures/types'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionType as MockTxType,
  TransactionDetails,
  TransactionInfo,
} from 'state/transactions/types'
import { mocked } from 'test-utils/mocked'
import { act, renderHook } from 'test-utils/render'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useFormatter } from 'utils/formatNumbers'

function mockSwapInfo(
  type: MockTradeType,
  inputCurrency: Token,
  inputCurrencyAmountRaw: string,
  outputCurrency: Token,
  outputCurrencyAmountRaw: string
): ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo {
  if (type === MockTradeType.EXACT_INPUT) {
    return {
      type: MockTxType.SWAP,
      tradeType: MockTradeType.EXACT_INPUT,
      inputCurrencyId: inputCurrency.address,
      inputCurrencyAmountRaw,
      outputCurrencyId: outputCurrency.address,
      expectedOutputCurrencyAmountRaw: outputCurrencyAmountRaw,
      minimumOutputCurrencyAmountRaw: outputCurrencyAmountRaw,
      isUniswapXOrder: false,
    }
  } else {
    return {
      type: MockTxType.SWAP,
      tradeType: MockTradeType.EXACT_OUTPUT,
      inputCurrencyId: inputCurrency.address,
      expectedInputCurrencyAmountRaw: inputCurrencyAmountRaw,
      maximumInputCurrencyAmountRaw: inputCurrencyAmountRaw,
      outputCurrencyId: outputCurrency.address,
      outputCurrencyAmountRaw,
      isUniswapXOrder: false,
    }
  }
}

const mockAccount1 = '0x000000000000000000000000000000000000000001'
const mockAccount2 = '0x000000000000000000000000000000000000000002'
const mockChainId = ChainId.MAINNET
const mockSpenderAddress = permit2Address(mockChainId)
const mockCurrencyAmountRaw = '1000000000000000000'
const mockCurrencyAmountRawUSDC = '1000000'
const mockApprovalAmountRaw = '10000000'

function mockHash(id: string, status: TransactionStatus = TransactionStatus.Confirmed) {
  return id + status
}

function mockCommonFields(id: string, account = mockAccount2, status: TransactionStatus) {
  const hash = mockHash(id, status)
  return {
    status,
    hash,
    from: account,
    txHash: hash,
    addedTime: 0,
  }
}

function mockMultiStatus(info: TransactionInfo, id: string): [TransactionDetails, number][] {
  // Mocks a transaction with multiple statuses
  return [
    [
      { info, ...mockCommonFields(id, mockAccount2, TransactionStatus.Pending) } as unknown as TransactionDetails,
      mockChainId,
    ],
    [
      { info, ...mockCommonFields(id, mockAccount2, TransactionStatus.Confirmed) } as unknown as TransactionDetails,
      mockChainId,
    ],
    [
      { info, ...mockCommonFields(id, mockAccount2, TransactionStatus.Failed) } as unknown as TransactionDetails,
      mockChainId,
    ],
  ]
}

jest.mock('../../../../state/transactions/hooks', () => {
  return {
    ...jest.requireActual('../../../../state/transactions/hooks'),
    useMultichainTransactions: (): [TransactionDetails, number][] => {
      return [
        [
          {
            info: mockSwapInfo(
              MockTradeType.EXACT_INPUT,
              MockUSDC_MAINNET,
              mockCurrencyAmountRawUSDC,
              MockDAI,
              mockCurrencyAmountRaw
            ),
            ...mockCommonFields('0x123', mockAccount1, TransactionStatus.Confirmed),
          } as TransactionDetails,
          mockChainId,
        ],
        ...mockMultiStatus(
          mockSwapInfo(
            MockTradeType.EXACT_OUTPUT,
            MockUSDC_MAINNET,
            mockCurrencyAmountRawUSDC,
            MockDAI,
            mockCurrencyAmountRaw
          ),
          '0xswap_exact_input'
        ),
        ...mockMultiStatus(
          mockSwapInfo(
            MockTradeType.EXACT_INPUT,
            MockUSDC_MAINNET,
            mockCurrencyAmountRawUSDC,
            MockDAI,
            mockCurrencyAmountRaw
          ),
          '0xswap_exact_output'
        ),
        ...mockMultiStatus(
          {
            type: MockTxType.APPROVAL,
            tokenAddress: MockDAI.address,
            spender: mockSpenderAddress,
            amount: mockApprovalAmountRaw,
          },
          '0xapproval'
        ),
        ...mockMultiStatus(
          {
            type: MockTxType.APPROVAL,
            tokenAddress: MockUSDT.address,
            spender: mockSpenderAddress,
            amount: '0',
          },
          '0xrevoke_approval'
        ),
        ...mockMultiStatus(
          {
            type: MockTxType.WRAP,
            unwrapped: false,
            currencyAmountRaw: mockCurrencyAmountRaw,
            chainId: mockChainId,
          },
          '0xwrap'
        ),
        ...mockMultiStatus(
          {
            type: MockTxType.WRAP,
            unwrapped: true,
            currencyAmountRaw: mockCurrencyAmountRaw,
            chainId: mockChainId,
          },
          '0xunwrap'
        ),
        ...mockMultiStatus(
          {
            type: MockTxType.ADD_LIQUIDITY_V3_POOL,
            createPool: false,
            baseCurrencyId: MockUSDC_MAINNET.address,
            quoteCurrencyId: MockDAI.address,
            feeAmount: 500,
            expectedAmountBaseRaw: mockCurrencyAmountRawUSDC,
            expectedAmountQuoteRaw: mockCurrencyAmountRaw,
          },
          '0xadd_liquidity_v3'
        ),
        ...mockMultiStatus(
          {
            type: MockTxType.REMOVE_LIQUIDITY_V3,
            baseCurrencyId: MockUSDC_MAINNET.address,
            quoteCurrencyId: MockDAI.address,
            expectedAmountBaseRaw: mockCurrencyAmountRawUSDC,
            expectedAmountQuoteRaw: mockCurrencyAmountRaw,
          },
          '0xremove_liquidity_v3'
        ),
        ...mockMultiStatus(
          {
            type: MockTxType.ADD_LIQUIDITY_V2_POOL,
            baseCurrencyId: MockUSDC_MAINNET.address,
            quoteCurrencyId: MockDAI.address,
            expectedAmountBaseRaw: mockCurrencyAmountRawUSDC,
            expectedAmountQuoteRaw: mockCurrencyAmountRaw,
          },
          '0xadd_liquidity_v2'
        ),
        ...mockMultiStatus(
          {
            type: MockTxType.COLLECT_FEES,
            currencyId0: MockUSDC_MAINNET.address,
            currencyId1: MockDAI.address,
            expectedCurrencyOwed0: mockCurrencyAmountRawUSDC,
            expectedCurrencyOwed1: mockCurrencyAmountRaw,
          },
          '0xcollect_fees'
        ),
        ...mockMultiStatus(
          {
            type: MockTxType.MIGRATE_LIQUIDITY_V3,
            baseCurrencyId: MockUSDC_MAINNET.address,
            quoteCurrencyId: MockDAI.address,
            isFork: false,
          },
          '0xmigrate_v3_liquidity'
        ),
      ]
    },
  }
})

describe('parseLocalActivity', () => {
  it('returns swap activity fields with known tokens, exact input', async () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    const details = {
      info: mockSwapInfo(
        MockTradeType.EXACT_INPUT,
        MockUSDC_MAINNET,
        mockCurrencyAmountRawUSDC,
        MockDAI,
        mockCurrencyAmountRaw
      ),
      hash: '0x123',
      status: TransactionStatus.Confirmed,
    } as TransactionDetails
    const chainId = ChainId.MAINNET
    const result = await transactionToActivity(details, chainId, formatNumber)
    expect(result).toEqual({
      chainId: 1,
      currencies: [MockUSDC_MAINNET, MockDAI],
      descriptor: '1.00 USDC for 1.00 DAI',
      hash: '0x123',
      from: undefined,
      status: 'CONFIRMED',
      timestamp: NaN,
      title: 'Swapped',
    })
  })

  it('returns swap activity fields with known tokens, exact output', async () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    const details = {
      info: mockSwapInfo(
        MockTradeType.EXACT_OUTPUT,
        MockUSDC_MAINNET,
        mockCurrencyAmountRawUSDC,
        MockDAI,
        mockCurrencyAmountRaw
      ),
      hash: '0x123',
      status: TransactionStatus.Confirmed,
    } as TransactionDetails
    const chainId = ChainId.MAINNET
    const result = await transactionToActivity(details, chainId, formatNumber)
    expect(result).toMatchObject({
      chainId: 1,
      currencies: [MockUSDC_MAINNET, MockDAI],
      descriptor: '1.00 USDC for 1.00 DAI',
      status: 'CONFIRMED',
      title: 'Swapped',
    })
  })

  it('returns swap activity fields with unknown tokens', async () => {
    mocked(getCurrency).mockImplementation(async () => undefined)

    const { formatNumber } = renderHook(() => useFormatter()).result.current

    const details = {
      info: mockSwapInfo(
        MockTradeType.EXACT_INPUT,
        MockUSDC_MAINNET,
        mockCurrencyAmountRawUSDC,
        MockDAI,
        mockCurrencyAmountRaw
      ),
      hash: '0x123',
      status: TransactionStatus.Confirmed,
    } as TransactionDetails
    const chainId = ChainId.MAINNET
    const result = await transactionToActivity(details, chainId, formatNumber)
    expect(result).toMatchObject({
      chainId: 1,
      currencies: [undefined, undefined],
      descriptor: 'Unknown for Unknown',
      status: 'CONFIRMED',
      title: 'Swapped',
    })
  })

  it('only returns activity for the current account', async () => {
    const { result: result1, waitFor } = renderHook(() => useLocalActivities(mockAccount1))
    const { result: result2 } = renderHook(() => useLocalActivities(mockAccount2))

    await waitFor(() => {
      expect(Object.values(result1.current)).toHaveLength(1)
      expect(Object.values(result2.current)).toHaveLength(33)
    })
  })

  it('Properly uses correct tense of activity title based on tx status', async () => {
    const { result, waitFor } = renderHook(() => useLocalActivities(mockAccount2))

    await act(async () => {
      await waitFor(() => {
        expect(result.current[mockHash('0xswap_exact_input')]).toBeDefined()
      })
    })

    expect(result.current[mockHash('0xswap_exact_input', TransactionStatus.Pending)]?.title).toEqual('Swapping')
    expect(result.current[mockHash('0xswap_exact_input', TransactionStatus.Confirmed)]?.title).toEqual('Swapped')
    expect(result.current[mockHash('0xswap_exact_input', TransactionStatus.Failed)]?.title).toEqual('Swap failed')
  })

  it('Adapts Swap exact input to Activity type', async () => {
    const hash = mockHash('0xswap_exact_input')
    const { result, waitFor } = renderHook(() => useLocalActivities(mockAccount2))

    await act(async () => {
      await waitFor(() => {
        expect(result.current[hash]).toBeDefined()
      })
    })

    expect(result.current[hash]).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Swapped',
      descriptor: `1.00 ${MockUSDC_MAINNET.symbol} for 1.00 ${MockDAI.symbol}`,
      hash,
      status: TransactionStatus.Confirmed,
      from: mockAccount2,
    })
  })

  it('Adapts Swap exact output to Activity type', async () => {
    const hash = mockHash('0xswap_exact_output')
    const { result, waitFor } = renderHook(() => useLocalActivities(mockAccount2))

    await act(async () => {
      await waitFor(() => {
        expect(result.current[hash]).toBeDefined()
      })
    })

    expect(result.current[hash]).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Swapped',
      descriptor: `1.00 ${MockUSDC_MAINNET.symbol} for 1.00 ${MockDAI.symbol}`,
      hash,
      status: TransactionStatus.Confirmed,
      from: mockAccount2,
    })
  })

  it('Adapts Approval to Activity type', async () => {
    const hash = mockHash('0xapproval')
    const { result, waitFor } = renderHook(() => useLocalActivities(mockAccount2))

    await act(async () => {
      await waitFor(() => {
        expect(result.current[hash]).toBeDefined()
      })
    })

    expect(result.current[hash]).toMatchObject({
      chainId: mockChainId,
      currencies: [MockDAI],
      title: 'Approved',
      descriptor: MockDAI.symbol,
      hash,
      status: TransactionStatus.Confirmed,
      from: mockAccount2,
    })
  })

  it('Adapts Revoke Approval to Activity type', async () => {
    const hash = mockHash('0xrevoke_approval')
    const { result, waitFor } = renderHook(() => useLocalActivities(mockAccount2))

    await act(async () => {
      await waitFor(() => {
        expect(result.current[hash]).toBeDefined()
      })
    })

    expect(result.current[hash]).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDT],
      title: 'Revoked approval',
      descriptor: MockUSDT.symbol,
      hash,
      status: TransactionStatus.Confirmed,
    })
  })

  it('Adapts Wrap to Activity type', async () => {
    const hash = mockHash('0xwrap')
    const { result, waitFor } = renderHook(() => useLocalActivities(mockAccount2))

    const native = nativeOnChain(mockChainId)

    await act(async () => {
      await waitFor(() => {
        expect(result.current[hash]).toBeDefined()
      })
    })

    expect(result.current[hash]).toMatchObject({
      chainId: mockChainId,
      currencies: [native, native.wrapped],
      title: 'Wrapped',
      descriptor: `1.00 ${native.symbol} for 1.00 ${native.wrapped.symbol}`,
      hash,
      status: TransactionStatus.Confirmed,
      from: mockAccount2,
    })
  })

  it('Adapts Unwrap to Activity type', async () => {
    const hash = mockHash('0xunwrap')
    const { result, waitFor } = renderHook(() => useLocalActivities(mockAccount2))

    const native = nativeOnChain(mockChainId)

    await act(async () => {
      await waitFor(() => {
        expect(result.current[hash]).toBeDefined()
      })
    })

    expect(result.current[hash]).toMatchObject({
      chainId: mockChainId,
      currencies: [native.wrapped, native],
      title: 'Unwrapped',
      descriptor: `1.00 ${native.wrapped.symbol} for 1.00 ${native.symbol}`,
      hash,
      status: TransactionStatus.Confirmed,
      from: mockAccount2,
    })
  })

  it('Adapts AddLiquidityV3 to Activity type', async () => {
    const hash = mockHash('0xadd_liquidity_v3')
    const { result, waitFor } = renderHook(() => useLocalActivities(mockAccount2))

    await act(async () => {
      await waitFor(() => {
        expect(result.current[hash]).toBeDefined()
      })
    })

    expect(result.current[hash]).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Added liquidity',
      descriptor: `1.00 ${MockUSDC_MAINNET.symbol} and 1.00 ${MockDAI.symbol}`,
      hash,
      status: TransactionStatus.Confirmed,
      from: mockAccount2,
    })
  })

  it('Adapts RemoveLiquidityV3 to Activity type', async () => {
    const hash = mockHash('0xremove_liquidity_v3')
    const { result, waitFor } = renderHook(() => useLocalActivities(mockAccount2))

    await act(async () => {
      await waitFor(() => {
        expect(result.current[hash]).toBeDefined()
      })
    })

    expect(result.current[hash]).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Removed liquidity',
      descriptor: `1.00 ${MockUSDC_MAINNET.symbol} and 1.00 ${MockDAI.symbol}`,
      hash,
      status: TransactionStatus.Confirmed,
      from: mockAccount2,
    })
  })

  it('Adapts RemoveLiquidityV2 to Activity type', async () => {
    const hash = mockHash('0xadd_liquidity_v2')
    const { result, waitFor } = renderHook(() => useLocalActivities(mockAccount2))

    await act(async () => {
      await waitFor(() => {
        expect(result.current[hash]).toBeDefined()
      })
    })

    expect(result.current[hash]).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Added V2 liquidity',
      descriptor: `1.00 ${MockUSDC_MAINNET.symbol} and 1.00 ${MockDAI.symbol}`,
      hash,
      status: TransactionStatus.Confirmed,
      from: mockAccount2,
    })
  })

  it('Adapts CollectFees to Activity type', async () => {
    const hash = mockHash('0xcollect_fees')
    const { result, waitFor } = renderHook(() => useLocalActivities(mockAccount2))

    await act(async () => {
      await waitFor(() => {
        expect(result.current[hash]).toBeDefined()
      })
    })

    expect(result.current[hash]).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Collected fees',
      descriptor: `1.00 ${MockUSDC_MAINNET.symbol} and 1.00 ${MockDAI.symbol}`,
      hash,
      status: TransactionStatus.Confirmed,
      from: mockAccount2,
    })
  })

  it('Adapts MigrateLiquidityV3 to Activity type', async () => {
    const hash = mockHash('0xmigrate_v3_liquidity')
    const { result, waitFor } = renderHook(() => useLocalActivities(mockAccount2))

    await act(async () => {
      await waitFor(() => {
        expect(result.current[hash]).toBeDefined()
      })
    })

    expect(result.current[hash]).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Migrated liquidity',
      descriptor: `${MockUSDC_MAINNET.symbol} and ${MockDAI.symbol}`,
      hash,
      status: TransactionStatus.Confirmed,
      from: mockAccount2,
    })
  })

  it('Signature to activity - returns undefined if is filled onchain order', async () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(
      await signatureToActivity(
        {
          type: SignatureType.SIGN_UNISWAPX_ORDER,
          status: UniswapXOrderStatus.FILLED,
        } as SignatureDetails,
        formatNumber
      )
    ).toBeUndefined()
  })

  it('Signature to activity - returns activity if is cancelled onchain order', async () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(
      await signatureToActivity(
        {
          type: SignatureType.SIGN_UNISWAPX_ORDER,
          status: UniswapXOrderStatus.CANCELLED,
          chainId: ChainId.MAINNET,
          swapInfo: mockSwapInfo(
            MockTradeType.EXACT_INPUT,
            MockUSDC_MAINNET,
            mockCurrencyAmountRawUSDC,
            MockDAI,
            mockCurrencyAmountRaw
          ),
        } as SignatureDetails,
        formatNumber
      )
    ).toEqual({
      chainId: 1,
      currencies: [MockUSDC_MAINNET, MockDAI],
      descriptor: '1.00 USDC for 1.00 DAI',
      from: undefined,
      hash: undefined,
      offchainOrderDetails: {
        addedTime: undefined,
        chainId: 1,
        encodedOrder: undefined,
        expiry: undefined,
        id: undefined,
        offerer: undefined,
        orderHash: undefined,
        status: 'cancelled',
        swapInfo: {
          expectedOutputCurrencyAmountRaw: '1000000000000000000',
          inputCurrencyAmountRaw: '1000000',
          inputCurrencyId: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          isUniswapXOrder: false,
          minimumOutputCurrencyAmountRaw: '1000000000000000000',
          outputCurrencyId: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          tradeType: 0,
          type: 1,
        },
        txHash: undefined,
        type: 'signUniswapXOrder',
      },
      prefixIconSrc: undefined,
      status: 'FAILED',
      statusMessage: undefined,
      timestamp: undefined,
      title: 'Swap cancelled',
    })
  })
})
