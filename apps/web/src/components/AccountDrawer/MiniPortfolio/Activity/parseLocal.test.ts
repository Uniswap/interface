import '~/test-utils/tokens/mocks'
import type { Token } from '@uniswap/sdk-core'
import { TradeType as MockTradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
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
import { transactionToActivity, useLocalActivities } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import type { TransactionInfo } from '~/state/transactions/types'
import { act, renderHook, waitFor } from '~/test-utils/render'

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

  it('shows the auction token ticker in the submitted bid descriptor', async () => {
    const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current
    const auctionContractAddress = '0xffdab1083fcbbcee300000000000000000000000'

    const details = {
      typeInfo: {
        type: TransactionType.ToucanBid,
        amountRaw: '10000000000000000',
        maxPriceQ96: '1',
        auctionContractAddress,
        bidTokenAddress: ZERO_ADDRESS,
        auctionTokenAddress: MockDAI.address,
        requestId: 'request-id',
      },
      ...mockCommonFields({ id: '0xtoucan_bid', account: mockAccount1, status: TransactionStatus.Success }),
    } as InterfaceTransactionDetails

    const result = await transactionToActivity({ details, formatNumber: formatNumberOrString })

    expect(result).toMatchObject({
      descriptor: '0.010 ETH bid on DAI',
      title: 'Bid submitted',
    })
    expect(result?.descriptor).not.toContain(auctionContractAddress)
  })

  describe('auction launch', () => {
    const predictedTokenAddress = '0xffdab1083fcbbcee300000000000000000000000'
    const baseTypeInfo = {
      type: TransactionType.AuctionLaunch,
      requestId: 'request-id',
      predictedAuctionAddress: '0xaaaab1083fcbbcee300000000000000000000000',
      predictedTokenAddress,
    }

    it('shows the launched token name and logo captured at submit time', async () => {
      const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

      const details = {
        typeInfo: {
          ...baseTypeInfo,
          tokenName: 'My New Token',
          tokenSymbol: 'MNT',
          tokenLogoUrl: 'https://gateway.pinata.cloud/ipfs/some-cid',
        },
        ...mockCommonFields({ id: '0xauction_launch', account: mockAccount1, status: TransactionStatus.Success }),
      } as InterfaceTransactionDetails

      const result = await transactionToActivity({ details, formatNumber: formatNumberOrString })

      expect(result).toMatchObject({
        title: 'Auction launched',
        descriptor: 'My New Token',
        logos: ['https://gateway.pinata.cloud/ipfs/some-cid'],
        fallbackSymbols: ['MNT'],
      })
    })

    it('falls back to symbol then shortened token address when metadata is missing', async () => {
      const { formatNumberOrString } = renderHook(() => useLocalizationContext()).result.current

      const symbolOnly = {
        typeInfo: { ...baseTypeInfo, tokenSymbol: 'MNT' },
        ...mockCommonFields({
          id: '0xauction_launch_symbol',
          account: mockAccount1,
          status: TransactionStatus.Success,
        }),
      } as InterfaceTransactionDetails
      const symbolResult = await transactionToActivity({ details: symbolOnly, formatNumber: formatNumberOrString })
      expect(symbolResult).toMatchObject({ descriptor: 'MNT', fallbackSymbols: ['MNT'] })

      const bare = {
        typeInfo: baseTypeInfo,
        ...mockCommonFields({ id: '0xauction_launch_bare', account: mockAccount1, status: TransactionStatus.Success }),
      } as InterfaceTransactionDetails
      const bareResult = await transactionToActivity({ details: bare, formatNumber: formatNumberOrString })
      expect(bareResult?.descriptor).toContain('0x')
      expect(bareResult?.descriptor).not.toEqual(predictedTokenAddress)
    })
  })

  describe('UniswapX Orders', () => {
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
      })
      expect(result?.isUniswapX).toBe(true)
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
        offchainOrderDetails: expect.objectContaining({
          routing: TradingApi.Routing.DUTCH_LIMIT,
          orderHash: '0xlimit123',
        }),
      })
      expect(result?.isUniswapX).toBe(true)
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
      })
      expect(result?.isUniswapX).toBe(true)
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
