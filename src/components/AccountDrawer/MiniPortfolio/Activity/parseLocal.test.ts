import { ChainId, Token, TradeType as MockTradeType } from '@thinkincoin-libs/sdk-core'
import { PERMIT2_ADDRESS } from '@thinkincoin/universal-router-sdk'
import { DAI as MockDAI, nativeOnChain, USDC_MAINNET as MockUSDC_MAINNET, USDT as MockUSDT } from 'constants/tokens'
import { TransactionStatus as MockTxStatus } from 'graphql/data/__generated__/types-and-hooks'
import { ChainTokenMap } from 'hooks/Tokens'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionDetails,
  TransactionInfo,
  TransactionType as MockTxType,
} from 'state/transactions/types'
import { renderHook } from 'test-utils/render'

import { parseLocalActivity, useLocalActivities } from './parseLocal'

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
    }
  }
}

const mockAccount1 = '0x000000000000000000000000000000000000000001'
const mockAccount2 = '0x000000000000000000000000000000000000000002'
const mockChainId = ChainId.MAINNET
const mockSpenderAddress = PERMIT2_ADDRESS[mockChainId]
const mockCurrencyAmountRaw = '1000000000000000000'
const mockCurrencyAmountRawUSDC = '1000000'
const mockApprovalAmountRaw = '10000000'

function mockHash(id: string, status: MockTxStatus = MockTxStatus.Confirmed) {
  return id + status
}

function mockCommonFields(id: string, account = mockAccount2, status: MockTxStatus) {
  const hash = mockHash(id, status)
  return {
    hash,
    from: account,
    receipt:
      status === MockTxStatus.Pending
        ? undefined
        : {
            transactionHash: hash,
            status: status === MockTxStatus.Confirmed ? 1 : 0,
          },
    addedTime: 0,
  }
}

function mockMultiStatus(info: TransactionInfo, id: string): [TransactionDetails, number][] {
  // Mocks a transaction with multiple statuses
  return [
    [
      { info, ...mockCommonFields(id, mockAccount2, MockTxStatus.Pending) } as unknown as TransactionDetails,
      mockChainId,
    ],
    [
      { info, ...mockCommonFields(id, mockAccount2, MockTxStatus.Confirmed) } as unknown as TransactionDetails,
      mockChainId,
    ],
    [
      { info, ...mockCommonFields(id, mockAccount2, MockTxStatus.Failed) } as unknown as TransactionDetails,
      mockChainId,
    ],
  ]
}

const mockTokenAddressMap: ChainTokenMap = {
  [mockChainId]: {
    [MockDAI.address]: MockDAI,
    [MockUSDC_MAINNET.address]: MockUSDC_MAINNET,
    [MockUSDT.address]: MockUSDT,
  },
}

jest.mock('../../../../hooks/Tokens', () => ({
  useAllTokensMultichain: () => mockTokenAddressMap,
}))

jest.mock('../../../../state/transactions/hooks', () => {
  return {
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
            ...mockCommonFields('0x123', mockAccount1, MockTxStatus.Confirmed),
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
  it('returns swap activity fields with known tokens, exact input', () => {
    const details = {
      info: mockSwapInfo(
        MockTradeType.EXACT_INPUT,
        MockUSDC_MAINNET,
        mockCurrencyAmountRawUSDC,
        MockDAI,
        mockCurrencyAmountRaw
      ),
      receipt: {
        transactionHash: '0x123',
        status: 1,
      },
    } as TransactionDetails
    const chainId = ChainId.MAINNET
    expect(parseLocalActivity(details, chainId, mockTokenAddressMap)).toEqual({
      chainId: 1,
      currencies: [MockUSDC_MAINNET, MockDAI],
      descriptor: '1.00 USDC for 1.00 DAI',
      hash: undefined,
      receipt: {
        id: '0x123',
        info: {
          type: 1,
          tradeType: MockTradeType.EXACT_INPUT,
          inputCurrencyId: MockUSDC_MAINNET.address,
          inputCurrencyAmountRaw: mockCurrencyAmountRawUSDC,
          outputCurrencyId: MockDAI.address,
          expectedOutputCurrencyAmountRaw: mockCurrencyAmountRaw,
          minimumOutputCurrencyAmountRaw: mockCurrencyAmountRaw,
        },
        receipt: { status: 1, transactionHash: '0x123' },
        status: 'CONFIRMED',
        transactionHash: '0x123',
      },
      status: 'CONFIRMED',
      timestamp: NaN,
      title: 'Swapped',
    })
  })

  it('returns swap activity fields with known tokens, exact output', () => {
    const details = {
      info: mockSwapInfo(
        MockTradeType.EXACT_OUTPUT,
        MockUSDC_MAINNET,
        mockCurrencyAmountRawUSDC,
        MockDAI,
        mockCurrencyAmountRaw
      ),
      receipt: {
        transactionHash: '0x123',
        status: 1,
      },
    } as TransactionDetails
    const chainId = ChainId.MAINNET
    expect(parseLocalActivity(details, chainId, mockTokenAddressMap)).toMatchObject({
      chainId: 1,
      currencies: [MockUSDC_MAINNET, MockDAI],
      descriptor: '1.00 USDC for 1.00 DAI',
      status: 'CONFIRMED',
      title: 'Swapped',
    })
  })

  it('returns swap activity fields with unknown tokens', () => {
    const details = {
      info: mockSwapInfo(
        MockTradeType.EXACT_INPUT,
        MockUSDC_MAINNET,
        mockCurrencyAmountRawUSDC,
        MockDAI,
        mockCurrencyAmountRaw
      ),
      receipt: {
        transactionHash: '0x123',
        status: 1,
      },
    } as TransactionDetails
    const chainId = ChainId.MAINNET
    const tokens = {} as ChainTokenMap
    expect(parseLocalActivity(details, chainId, tokens)).toMatchObject({
      chainId: 1,
      currencies: [undefined, undefined],
      descriptor: 'Unknown for Unknown',
      status: 'CONFIRMED',
      title: 'Swapped',
    })
  })

  it('only returns activity for the current account', () => {
    const account1Activites = renderHook(() => useLocalActivities(mockAccount1)).result.current
    const account2Activites = renderHook(() => useLocalActivities(mockAccount2)).result.current

    expect(Object.values(account1Activites)).toHaveLength(1)
    expect(Object.values(account2Activites)).toHaveLength(33)
  })

  it('Properly uses correct tense of activity title based on tx status', () => {
    const activities = renderHook(() => useLocalActivities(mockAccount2)).result.current

    expect(activities[mockHash('0xswap_exact_input', MockTxStatus.Pending)]?.title).toEqual('Swapping')
    expect(activities[mockHash('0xswap_exact_input', MockTxStatus.Confirmed)]?.title).toEqual('Swapped')
    expect(activities[mockHash('0xswap_exact_input', MockTxStatus.Failed)]?.title).toEqual('Swap failed')
  })

  it('Adapts Swap exact input to Activity type', () => {
    const hash = mockHash('0xswap_exact_input')
    const activity = renderHook(() => useLocalActivities(mockAccount2)).result.current[hash]

    expect(activity).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Swapped',
      descriptor: `1.00 ${MockUSDC_MAINNET.symbol} for 1.00 ${MockDAI.symbol}`,
      hash,
      status: MockTxStatus.Confirmed,
      receipt: {
        id: hash,
        status: MockTxStatus.Confirmed,
      },
    })
  })

  it('Adapts Swap exact output to Activity type', () => {
    const hash = mockHash('0xswap_exact_output')
    const activity = renderHook(() => useLocalActivities(mockAccount2)).result.current[hash]

    expect(activity).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Swapped',
      descriptor: `1.00 ${MockUSDC_MAINNET.symbol} for 1.00 ${MockDAI.symbol}`,
      hash,
      status: MockTxStatus.Confirmed,
      receipt: {
        id: hash,
        status: MockTxStatus.Confirmed,
      },
    })
  })

  it('Adapts Approval to Activity type', () => {
    const hash = mockHash('0xapproval')
    const activity = renderHook(() => useLocalActivities(mockAccount2)).result.current[hash]

    expect(activity).toMatchObject({
      chainId: mockChainId,
      currencies: [MockDAI],
      title: 'Approved',
      descriptor: MockDAI.symbol,
      hash,
      status: MockTxStatus.Confirmed,
      receipt: {
        id: hash,
        status: MockTxStatus.Confirmed,
      },
    })
  })

  it('Adapts Revoke Approval to Activity type', () => {
    const hash = mockHash('0xrevoke_approval')
    const activity = renderHook(() => useLocalActivities(mockAccount2)).result.current[hash]
    expect(activity).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDT],
      title: 'Revoked approval',
      descriptor: MockUSDT.symbol,
      hash,
      status: MockTxStatus.Confirmed,
      receipt: {
        id: hash,
        status: MockTxStatus.Confirmed,
      },
    })
  })

  it('Adapts Wrap to Activity type', () => {
    const hash = mockHash('0xwrap')
    const activity = renderHook(() => useLocalActivities(mockAccount2)).result.current[hash]

    const native = nativeOnChain(mockChainId)

    expect(activity).toMatchObject({
      chainId: mockChainId,
      currencies: [native, native.wrapped],
      title: 'Wrapped',
      descriptor: `1.00 ${native.symbol} for 1.00 ${native.wrapped.symbol}`,
      hash,
      status: MockTxStatus.Confirmed,
      receipt: {
        id: hash,
        status: MockTxStatus.Confirmed,
      },
    })
  })

  it('Adapts Unwrap to Activity type', () => {
    const hash = mockHash('0xunwrap')
    const activity = renderHook(() => useLocalActivities(mockAccount2)).result.current[hash]

    const native = nativeOnChain(mockChainId)

    expect(activity).toMatchObject({
      chainId: mockChainId,
      currencies: [native.wrapped, native],
      title: 'Unwrapped',
      descriptor: `1.00 ${native.wrapped.symbol} for 1.00 ${native.symbol}`,
      hash,
      status: MockTxStatus.Confirmed,
      receipt: {
        id: hash,
        status: MockTxStatus.Confirmed,
      },
    })
  })

  it('Adapts AddLiquidityV3 to Activity type', () => {
    const hash = mockHash('0xadd_liquidity_v3')
    const activity = renderHook(() => useLocalActivities(mockAccount2)).result.current[hash]

    expect(activity).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Added liquidity',
      descriptor: `1.00 ${MockUSDC_MAINNET.symbol} and 1.00 ${MockDAI.symbol}`,
      hash,
      status: MockTxStatus.Confirmed,
      receipt: {
        id: hash,
        status: MockTxStatus.Confirmed,
      },
    })
  })

  it('Adapts RemoveLiquidityV3 to Activity type', () => {
    const hash = mockHash('0xremove_liquidity_v3')
    const activity = renderHook(() => useLocalActivities(mockAccount2)).result.current[hash]

    expect(activity).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Removed liquidity',
      descriptor: `1.00 ${MockUSDC_MAINNET.symbol} and 1.00 ${MockDAI.symbol}`,
      hash,
      status: MockTxStatus.Confirmed,
      receipt: {
        id: hash,
        status: MockTxStatus.Confirmed,
      },
    })
  })

  it('Adapts RemoveLiquidityV2 to Activity type', () => {
    const hash = mockHash('0xadd_liquidity_v2')
    const activity = renderHook(() => useLocalActivities(mockAccount2)).result.current[hash]

    expect(activity).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Added V2 liquidity',
      descriptor: `1.00 ${MockUSDC_MAINNET.symbol} and 1.00 ${MockDAI.symbol}`,
      hash,
      status: MockTxStatus.Confirmed,
      receipt: {
        id: hash,
        status: MockTxStatus.Confirmed,
      },
    })
  })

  it('Adapts CollectFees to Activity type', () => {
    const hash = mockHash('0xcollect_fees')
    const activity = renderHook(() => useLocalActivities(mockAccount2)).result.current[hash]

    expect(activity).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Collected fees',
      descriptor: `1.00 ${MockUSDC_MAINNET.symbol} and 1.00 ${MockDAI.symbol}`,
      hash,
      status: MockTxStatus.Confirmed,
      receipt: {
        id: hash,
        status: MockTxStatus.Confirmed,
      },
    })
  })

  it('Adapts MigrateLiquidityV3 to Activity type', () => {
    const hash = mockHash('0xmigrate_v3_liquidity')
    const activity = renderHook(() => useLocalActivities(mockAccount2)).result.current[hash]

    expect(activity).toMatchObject({
      chainId: mockChainId,
      currencies: [MockUSDC_MAINNET, MockDAI],
      title: 'Migrated liquidity',
      descriptor: `${MockUSDC_MAINNET.symbol} and ${MockDAI.symbol}`,
      hash,
      status: MockTxStatus.Confirmed,
      receipt: {
        id: hash,
        status: MockTxStatus.Confirmed,
      },
    })
  })
})
