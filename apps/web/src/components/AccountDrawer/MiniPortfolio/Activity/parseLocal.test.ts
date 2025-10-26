import 'test-utils/tokens/mocks'

import type { Token } from '@uniswap/sdk-core'
import { TradeType as MockTradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { transactionToActivity, useLocalActivities } from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import type { TransactionInfo } from 'state/transactions/types'
import { act, renderHook, waitFor } from 'test-utils/render'
import { DAI as MockDAI, USDC_MAINNET as MockUSDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  InterfaceTransactionDetails,
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
const mockCurrencyAmountRaw = '1000000000000000000'
const mockCurrencyAmountRawUSDC = '1000000'

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
    routing: TradingApi.Routing.CLASSIC,
    options: {},
  }
}

function mockMultiStatus(info: TransactionInfo, id: string): [InterfaceTransactionDetails, number][] {
  // Mocks a transaction with multiple statuses
  return [
    [
      {
        typeInfo: info,
        ...mockCommonFields({ id, status: TransactionStatus.Pending }),
      } as InterfaceTransactionDetails,
      mockChainId,
    ],
    [
      {
        typeInfo: info,
        ...mockCommonFields({ id, status: TransactionStatus.Success }),
      } as InterfaceTransactionDetails,
      mockChainId,
    ],
    [
      {
        typeInfo: info,
        ...mockCommonFields({ id, status: TransactionStatus.Failed }),
      } as InterfaceTransactionDetails,
      mockChainId,
    ],
  ]
}

vi.mock('../../../../state/transactions/hooks', async () => {
  const actual = await vi.importActual('../../../../state/transactions/hooks')
  return {
    ...actual,
    useMultichainTransactions: (accountAddress?: string): [InterfaceTransactionDetails, number][] => {
      // Return transactions for the specified account
      const mockData: Record<string, [InterfaceTransactionDetails, number][]> = {
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
            } as InterfaceTransactionDetails,
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
  it('only returns activity for the current account', async () => {
    const { result: result1 } = renderHook(() => useLocalActivities(mockAccount1))
    const { result: result2 } = renderHook(() => useLocalActivities(mockAccount2))

    await waitFor(() => {
      expect(Object.values(result1.current)).toHaveLength(1)
      expect(Object.values(result2.current)).toHaveLength(6)
    })
  })

  it('Properly uses correct tense of activity title based on tx status', async () => {
    const { result } = renderHook(() => useLocalActivities(mockAccount2))

    await act(async () => {
      await waitFor(() => {
        expect(result.current[mockHash('0xswap_exact_input')]).toBeDefined()
      })
    })

    expect(result.current[mockHash('0xswap_exact_input', TransactionStatus.Pending)]?.title).toEqual('Swapping')
    expect(result.current[mockHash('0xswap_exact_input', TransactionStatus.Success)]?.title).toEqual('Swapped')
    expect(result.current[mockHash('0xswap_exact_input', TransactionStatus.Failed)]?.title).toEqual('Swap failed')
  })

  describe('UniswapX Orders', () => {
    const UniswapXBoltIcon =
      "data:image/svg+xml,%3csvg%20width='10'%20height='14'%20viewBox='0%200%2010%2014'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M9.97119%206.19815C9.91786%206.07749%209.79854%206.00016%209.66654%206.00016H6.66654V1.00016C6.66654%200.862156%206.58189%200.738159%206.45255%200.688826C6.32255%200.638826%206.17787%200.674818%206.0852%200.776818L0.0852016%207.44349C-0.00279838%207.54149%20-0.025439%207.68149%200.028561%207.80216C0.0818943%207.92283%200.201208%208.00016%200.333208%208.00016H3.33321V13.0002C3.33321%2013.1382%203.41786%2013.2622%203.5472%2013.3115C3.58653%2013.3262%203.62654%2013.3335%203.66654%2013.3335C3.75921%2013.3335%203.84988%2013.2948%203.91455%2013.2228L9.91455%206.55616C10.0025%206.45882%2010.0245%206.31815%209.97119%206.19815Z'%20fill='url(%23paint0_linear_1816_1801)'/%3e%3cdefs%3e%3clinearGradient%20id='paint0_linear_1816_1801'%20x1='-10.1808'%20y1='-12.0005'%20x2='10.6572'%20y2='-11.6015'%20gradientUnits='userSpaceOnUse'%3e%3cstop%20stop-color='%234673FA'/%3e%3cstop%20offset='1'%20stop-color='%239646FA'/%3e%3c/linearGradient%3e%3c/defs%3e%3c/svg%3e"

    it('handles UniswapX order with legacy isUniswapXOrder flag', async () => {
      const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

      const details = {
        typeInfo: {
          ...mockSwapInfo({
            type: MockTradeType.EXACT_INPUT,
            inputCurrency: MockUSDC_MAINNET,
            inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
            outputCurrency: MockDAI,
            outputCurrencyAmountRaw: mockCurrencyAmountRaw,
          }),
          isUniswapXOrder: true,
        },
        hash: '0xuniswapx_legacy',
        status: TransactionStatus.Pending,
        chainId: 1,
        from: mockAccount1,
      } as InterfaceTransactionDetails

      const result = await transactionToActivity({ details, formatNumber: formatNumberOrString })

      expect(result).toMatchObject({
        chainId: 1,
        currencies: [MockUSDC_MAINNET, MockDAI],
        descriptor: '1.00 USDC for 1.00 DAI',
        hash: '0xuniswapx_legacy',
        from: mockAccount1,
        status: TransactionStatus.Pending,
        title: 'Swapping',
        prefixIconSrc: UniswapXBoltIcon,
      })
    })

    it('handles limit order (DUTCH_LIMIT routing)', async () => {
      const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

      const details = {
        typeInfo: mockSwapInfo({
          type: MockTradeType.EXACT_INPUT,
          inputCurrency: MockUSDC_MAINNET,
          inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
          outputCurrency: MockDAI,
          outputCurrencyAmountRaw: mockCurrencyAmountRaw,
        }),
        routing: TradingApi.Routing.DUTCH_LIMIT,
        orderHash: '0xlimit123',
        hash: '0xlimit_order',
        status: TransactionStatus.Pending,
        chainId: 1,
        from: mockAccount1,
      } as InterfaceTransactionDetails

      const result = await transactionToActivity({ details, formatNumber: formatNumberOrString })

      expect(result).toMatchObject({
        chainId: 1,
        currencies: [MockUSDC_MAINNET, MockDAI],
        descriptor: '1.00 USDC for 1.00 DAI',
        hash: '0xlimit_order',
        from: mockAccount1,
        status: TransactionStatus.Pending,
        title: 'Limit opened',
        prefixIconSrc: UniswapXBoltIcon,
        offchainOrderDetails: expect.objectContaining({
          routing: TradingApi.Routing.DUTCH_LIMIT,
          orderHash: '0xlimit123',
        }),
      })
    })

    it('handles limit order with Success status', async () => {
      const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

      const details = {
        typeInfo: mockSwapInfo({
          type: MockTradeType.EXACT_INPUT,
          inputCurrency: MockUSDC_MAINNET,
          inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
          outputCurrency: MockDAI,
          outputCurrencyAmountRaw: mockCurrencyAmountRaw,
        }),
        routing: TradingApi.Routing.DUTCH_LIMIT,
        orderHash: '0xlimit_success',
        hash: '0xlimit_executed',
        status: TransactionStatus.Success,
        chainId: 1,
        from: mockAccount1,
      } as InterfaceTransactionDetails

      const result = await transactionToActivity({ details, formatNumber: formatNumberOrString })

      expect(result).toMatchObject({
        status: TransactionStatus.Success,
        title: 'Limit executed',
      })
    })

    it('handles limit order with InsufficientFunds status', async () => {
      const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

      const details = {
        typeInfo: {
          ...mockSwapInfo({
            type: MockTradeType.EXACT_INPUT,
            inputCurrency: MockUSDC_MAINNET,
            inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
            outputCurrency: MockDAI,
            outputCurrencyAmountRaw: mockCurrencyAmountRaw,
          }),
          isUniswapXOrder: true,
        },
        routing: TradingApi.Routing.DUTCH_LIMIT,
        orderHash: '0xlimit_insufficient',
        hash: '0xlimit_insufficient_funds',
        status: TransactionStatus.InsufficientFunds,
        chainId: 1,
        from: mockAccount1,
      } as InterfaceTransactionDetails

      const result = await transactionToActivity({ details, formatNumber: formatNumberOrString })

      expect(result).toMatchObject({
        status: TransactionStatus.Pending,
        title: 'Limit opened',
        statusMessage: expect.stringContaining('insufficient funds'),
        prefixIconSrc: UniswapXBoltIcon,
      })
    })

    it('handles UniswapX order without trade type info', async () => {
      const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

      // Mock console.warn since we expect parsing to fail for swaps without tradeType
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const details = {
        typeInfo: {
          type: TransactionType.Swap,
          isUniswapXOrder: true,
          inputCurrencyId: '1-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          outputCurrencyId: '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          // Missing tradeType - so it won't be handled as UniswapX
        },
        routing: TradingApi.Routing.DUTCH_V2,
        orderHash: '0xno_trade_type',
        hash: '0xno_trade',
        status: TransactionStatus.Pending,
        chainId: 1,
        from: mockAccount1,
        addedTime: Date.now(),
      } as InterfaceTransactionDetails

      const result = await transactionToActivity({ details, formatNumber: formatNumberOrString })

      // Without tradeType, it's not considered UniswapX and returns undefined
      // because regular swap parsing also requires tradeType
      expect(result).toBeUndefined()

      // Verify the warning was called (the test framework wraps console.warn, so we just check it was called)
      expect(warnSpy).toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it('handles limit order with orderHash fallback to hash', async () => {
      const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

      const details = {
        typeInfo: mockSwapInfo({
          type: MockTradeType.EXACT_INPUT,
          inputCurrency: MockUSDC_MAINNET,
          inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
          outputCurrency: MockDAI,
          outputCurrencyAmountRaw: mockCurrencyAmountRaw,
        }),
        routing: TradingApi.Routing.DUTCH_LIMIT,
        // No orderHash provided
        hash: '0xfallback_hash',
        status: TransactionStatus.Pending,
        chainId: 1,
        from: mockAccount1,
      } as InterfaceTransactionDetails

      const result = await transactionToActivity({ details, formatNumber: formatNumberOrString })

      expect(result?.offchainOrderDetails).toMatchObject({
        routing: TradingApi.Routing.DUTCH_LIMIT,
        orderHash: '0xfallback_hash', // Should use hash as fallback
      })
    })
  })
})
