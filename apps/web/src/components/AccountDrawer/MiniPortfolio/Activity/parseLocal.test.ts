import 'test-utils/tokens/mocks'

import { permit2Address } from '@uniswap/permit2-sdk'
import type { Token } from '@uniswap/sdk-core'
import { TradeType as MockTradeType } from '@uniswap/sdk-core'
import { getCurrencyFromCurrencyId } from 'components/AccountDrawer/MiniPortfolio/Activity/getCurrency'
import {
  signatureToActivity,
  transactionToActivity,
  useLocalActivities,
} from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import type { SignatureDetails } from 'state/signatures/types'
import { SignatureType } from 'state/signatures/types'
import type { TransactionDetails, TransactionInfo } from 'state/transactions/types'
import { mocked } from 'test-utils/mocked'
import { act, renderHook } from 'test-utils/render'
import { UniswapXOrderStatus } from 'types/uniswapx'
import {
  DAI,
  DAI as MockDAI,
  USDC_MAINNET as MockUSDC_MAINNET,
  USDT as MockUSDT,
  nativeOnChain,
} from 'uniswap/src/constants/tokens'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyId } from 'uniswap/src/utils/currencyId'

function mockSwapInfo({
  type,
  inputCurrency,
  inputCurrencyAmountRaw,
  outputCurrency,
  outputCurrencyAmountRaw,
}: {
  type: MockTradeType
  inputCurrency: Token
  inputCurrencyAmountRaw: string
  outputCurrency: Token
  outputCurrencyAmountRaw: string
}): ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo {
  if (type === MockTradeType.EXACT_INPUT) {
    return {
      type: TransactionType.Swap,
      tradeType: MockTradeType.EXACT_INPUT,
      inputCurrencyId: currencyId(inputCurrency),
      inputCurrencyAmountRaw,
      outputCurrencyId: currencyId(outputCurrency),
      expectedOutputCurrencyAmountRaw: outputCurrencyAmountRaw,
      minimumOutputCurrencyAmountRaw: outputCurrencyAmountRaw,
      isUniswapXOrder: false,
    }
  } else {
    return {
      type: TransactionType.Swap,
      tradeType: MockTradeType.EXACT_OUTPUT,
      inputCurrencyId: currencyId(inputCurrency),
      expectedInputCurrencyAmountRaw: inputCurrencyAmountRaw,
      maximumInputCurrencyAmountRaw: inputCurrencyAmountRaw,
      outputCurrencyId: currencyId(outputCurrency),
      outputCurrencyAmountRaw,
      isUniswapXOrder: false,
    }
  }
}

const mockAccount1 = '0x000000000000000000000000000000000000000001'
const mockAccount2 = '0x000000000000000000000000000000000000000002'
const mockChainId = UniverseChainId.Mainnet
const mockSpenderAddress = permit2Address(mockChainId)
const mockCurrencyAmountRaw = '1000000000000000000'
const mockCurrencyAmountRawUSDC = '1000000'
const mockApprovalAmountRaw = '10000000'

function mockHash(id: string, status: TransactionStatus = TransactionStatus.Success) {
  return id + status
}

function mockCommonFields({
  id,
  account = mockAccount2,
  status,
}: {
  id: string
  account?: string
  status: TransactionStatus
}) {
  const hash = mockHash(id, status)
  return {
    id: hash,
    chainId: mockChainId,
    transactionOriginType: TransactionOriginType.Internal,
    status,
    hash,
    from: account,
    txHash: hash,
    addedTime: 0,
    routing: Routing.CLASSIC,
    options: {},
  }
}

function mockMultiStatus(info: TransactionInfo, id: string): [TransactionDetails, number][] {
  // Mocks a transaction with multiple statuses
  return [
    [
      {
        typeInfo: info,
        ...mockCommonFields({ id, status: TransactionStatus.Pending }),
      } as unknown as TransactionDetails,
      mockChainId,
    ],
    [
      {
        typeInfo: info,
        ...mockCommonFields({ id, status: TransactionStatus.Success }),
      } as unknown as TransactionDetails,
      mockChainId,
    ],
    [
      {
        typeInfo: info,
        ...mockCommonFields({ id, status: TransactionStatus.Failed }),
      } as unknown as TransactionDetails,
      mockChainId,
    ],
  ]
}

vi.mock('../../../../state/transactions/hooks', async () => {
  const actual = await vi.importActual('../../../../state/transactions/hooks')
  return {
    ...actual,
    useMultichainTransactions: (accountAddress?: string): [TransactionDetails, number][] => {
      // Return transactions for the specified account
      const mockData: Record<string, [TransactionDetails, number][]> = {
        [mockAccount1]: [
          [
            {
              typeInfo: mockSwapInfo({
                type: MockTradeType.EXACT_INPUT,
                inputCurrency: MockUSDC_MAINNET,
                inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
                outputCurrency: MockDAI,
                outputCurrencyAmountRaw: mockCurrencyAmountRaw,
              }),
              ...mockCommonFields({ id: '0x123', account: mockAccount1, status: TransactionStatus.Success }),
            } as TransactionDetails,
            mockChainId,
          ],
        ],
        [mockAccount2]: [
          ...mockMultiStatus(
            mockSwapInfo({
              type: MockTradeType.EXACT_OUTPUT,
              inputCurrency: MockUSDC_MAINNET,
              inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
              outputCurrency: MockDAI,
              outputCurrencyAmountRaw: mockCurrencyAmountRaw,
            }),
            '0xswap_exact_input',
          ),
          ...mockMultiStatus(
            mockSwapInfo({
              type: MockTradeType.EXACT_INPUT,
              inputCurrency: MockUSDC_MAINNET,
              inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
              outputCurrency: MockDAI,
              outputCurrencyAmountRaw: mockCurrencyAmountRaw,
            }),
            '0xswap_exact_output',
          ),
          ...mockMultiStatus(
            {
              type: TransactionType.Approve,
              tokenAddress: MockDAI.address,
              spender: mockSpenderAddress,
              approvalAmount: mockApprovalAmountRaw,
            },
            '0xapproval',
          ),
          ...mockMultiStatus(
            {
              type: TransactionType.Approve,
              tokenAddress: MockUSDT.address,
              spender: mockSpenderAddress,
              approvalAmount: '0',
            },
            '0xrevoke_approval',
          ),
          ...mockMultiStatus(
            {
              type: TransactionType.Wrap,
              unwrapped: false,
              currencyAmountRaw: mockCurrencyAmountRaw,
            },
            '0xwrap',
          ),
          ...mockMultiStatus(
            {
              type: TransactionType.Wrap,
              unwrapped: true,
              currencyAmountRaw: mockCurrencyAmountRaw,
            },
            '0xunwrap',
          ),
          ...mockMultiStatus(
            {
              type: TransactionType.CollectFees,
              currency0Id: currencyId(MockUSDC_MAINNET),
              currency1Id: currencyId(MockDAI),
              currency0AmountRaw: mockCurrencyAmountRawUSDC,
              currency1AmountRaw: mockCurrencyAmountRaw,
            },
            '0xcollect_fees',
          ),
          ...mockMultiStatus(
            {
              type: TransactionType.MigrateLiquidityV2ToV3,
              baseCurrencyId: currencyId(MockUSDC_MAINNET),
              quoteCurrencyId: currencyId(MockDAI),
              isFork: false,
            },
            '0xmigrate_v3_liquidity',
          ),
        ],
      }
      if (!accountAddress) {
        return []
      }
      return mockData[accountAddress]
    },
  }
})

describe('parseLocalActivity', () => {
  it('returns swap activity fields with known tokens, exact input', async () => {
    const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

    const details = {
      typeInfo: mockSwapInfo({
        type: MockTradeType.EXACT_INPUT,
        inputCurrency: MockUSDC_MAINNET,
        inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
        outputCurrency: MockDAI,
        outputCurrencyAmountRaw: mockCurrencyAmountRaw,
      }),
      hash: '0x123',
      status: TransactionStatus.Success,
      chainId: 1,
    } as TransactionDetails
    const result = await transactionToActivity({ details, formatNumber: formatNumberOrString })
    expect(result).toEqual({
      cancelled: undefined,
      prefixIconSrc: undefined,
      chainId: 1,
      currencies: [MockUSDC_MAINNET, MockDAI],
      descriptor: '1.00 USDC for 1.00 DAI',
      hash: '0x123',
      from: undefined,
      status: TransactionStatus.Success,
      timestamp: NaN,
      title: 'Swapped',
    })
  })

  it('returns swap activity fields with known tokens, exact output', async () => {
    const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

    const details = {
      typeInfo: mockSwapInfo({
        type: MockTradeType.EXACT_OUTPUT,
        inputCurrency: MockUSDC_MAINNET,
        inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
        outputCurrency: MockDAI,
        outputCurrencyAmountRaw: mockCurrencyAmountRaw,
      }),
      hash: '0x123',
      status: TransactionStatus.Success,
      chainId: 1,
    } as TransactionDetails
    const result = await transactionToActivity({ details, formatNumber: formatNumberOrString })
    expect(result).toMatchObject({
      cancelled: undefined,
      prefixIconSrc: undefined,
      chainId: 1,
      currencies: [MockUSDC_MAINNET, MockDAI],
      descriptor: '1.00 USDC for 1.00 DAI',
      status: TransactionStatus.Success,
      title: 'Swapped',
    })
  })

  it('returns swap activity fields with unknown tokens', async () => {
    mocked(getCurrencyFromCurrencyId).mockImplementation(async () => undefined)

    const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

    const details = {
      typeInfo: mockSwapInfo({
        type: MockTradeType.EXACT_INPUT,
        inputCurrency: MockUSDC_MAINNET,
        inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
        outputCurrency: MockDAI,
        outputCurrencyAmountRaw: mockCurrencyAmountRaw,
      }),
      hash: '0x123',
      status: TransactionStatus.Success,
      chainId: 1,
    } as TransactionDetails
    const result = await transactionToActivity({ details, formatNumber: formatNumberOrString })
    expect(result).toMatchObject({
      chainId: 1,
      currencies: [undefined, undefined],
      descriptor: 'Unknown for Unknown',
      status: TransactionStatus.Success,
      title: 'Swapped',
    })
  })

  it('only returns activity for the current account', async () => {
    const { result: result1, waitFor } = renderHook(() => useLocalActivities(mockAccount1))
    const { result: result2 } = renderHook(() => useLocalActivities(mockAccount2))

    await waitFor(() => {
      expect(Object.values(result1.current)).toHaveLength(1)
      expect(Object.values(result2.current)).toHaveLength(24)
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
    expect(result.current[mockHash('0xswap_exact_input', TransactionStatus.Success)]?.title).toEqual('Swapped')
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
      status: TransactionStatus.Success,
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
      status: TransactionStatus.Success,
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
      status: TransactionStatus.Success,
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
      status: TransactionStatus.Success,
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
      status: TransactionStatus.Success,
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
      status: TransactionStatus.Success,
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
      status: TransactionStatus.Success,
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
      status: TransactionStatus.Success,
      from: mockAccount2,
    })
  })

  it('Signature to activity - returns undefined if is filled onchain order', async () => {
    const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

    expect(
      await signatureToActivity(
        {
          type: SignatureType.SIGN_UNISWAPX_ORDER,
          status: UniswapXOrderStatus.FILLED,
        } as SignatureDetails,
        formatNumberOrString,
      ),
    ).toBeUndefined()
  })

  it('Signature to activity - returns activity if is cancelled onchain order', async () => {
    const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

    expect(
      await signatureToActivity(
        {
          type: SignatureType.SIGN_UNISWAPX_ORDER,
          status: UniswapXOrderStatus.CANCELLED,
          chainId: UniverseChainId.Mainnet,
          swapInfo: mockSwapInfo({
            type: MockTradeType.EXACT_INPUT,
            inputCurrency: MockUSDC_MAINNET,
            inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
            outputCurrency: MockDAI,
            outputCurrencyAmountRaw: mockCurrencyAmountRaw,
          }),
        } as SignatureDetails,
        formatNumberOrString,
      ),
    ).toEqual({
      chainId: 1,
      currencies: [MockUSDC_MAINNET, MockDAI],
      descriptor: '1.00 USDC for 1.00 DAI',
      from: undefined,
      hash: undefined,
      offchainOrderDetails: {
        chainId: 1,
        status: 'cancelled',
        swapInfo: {
          expectedOutputCurrencyAmountRaw: '1000000000000000000',
          inputCurrencyAmountRaw: '1000000',
          inputCurrencyId: '1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          isUniswapXOrder: false,
          minimumOutputCurrencyAmountRaw: '1000000000000000000',
          outputCurrencyId: currencyId(DAI),
          tradeType: 0,
          type: TransactionType.Swap,
        },
        type: 'signUniswapXOrder',
      },
      prefixIconSrc: undefined,
      status: TransactionStatus.Failed,
      statusMessage: undefined,
      timestamp: undefined,
      title: 'Swap canceled',
    })
  })
})
