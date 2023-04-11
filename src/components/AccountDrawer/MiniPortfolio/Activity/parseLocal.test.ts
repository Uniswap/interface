// jest unit tests for the parseLocalActivity function

import { SupportedChainId, Token, TradeType as MockTradeType } from '@uniswap/sdk-core'
import { DAI as MockDAI, USDC_MAINNET as MockUSDC_MAINNET } from 'constants/tokens'
import { TokenAddressMap } from 'state/lists/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'state/transactions/types'
import { renderHook } from 'test-utils'

import { parseLocalActivity, useLocalActivities } from './parseLocal'

const oneUSDCRaw = '1000000'
const oneDAIRaw = '1000000000000000000'

function mockSwapInfo(
  type: MockTradeType,
  inputCurrency: Token,
  inputCurrencyAmountRaw: string,
  outputCurrency: Token,
  outputCurrencyAmountRaw: string
): ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo {
  if (type === MockTradeType.EXACT_INPUT) {
    return {
      type: TransactionType.SWAP,
      tradeType: MockTradeType.EXACT_INPUT,
      inputCurrencyId: inputCurrency.address,
      inputCurrencyAmountRaw,
      outputCurrencyId: outputCurrency.address,
      expectedOutputCurrencyAmountRaw: outputCurrencyAmountRaw,
      minimumOutputCurrencyAmountRaw: outputCurrencyAmountRaw,
    }
  } else {
    return {
      type: TransactionType.SWAP,
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
const mockChainId = SupportedChainId.MAINNET

jest.mock('../../../../state/transactions/hooks', () => {
  return {
    useMultichainTransactions: () => {
      return [
        [
          {
            info: mockSwapInfo(MockTradeType.EXACT_INPUT, MockUSDC_MAINNET, oneUSDCRaw, MockDAI, oneDAIRaw),
            hash: '0x123',
            from: mockAccount1,
          } as TransactionDetails,
          mockChainId,
        ],
        [
          {
            info: mockSwapInfo(MockTradeType.EXACT_INPUT, MockUSDC_MAINNET, oneUSDCRaw, MockDAI, oneDAIRaw),
            hash: '0x456',
            from: mockAccount2,
          } as TransactionDetails,
          mockChainId,
        ],
        [
          {
            info: mockSwapInfo(MockTradeType.EXACT_INPUT, MockUSDC_MAINNET, oneUSDCRaw, MockDAI, oneDAIRaw),
            hash: '0x789',
            from: mockAccount2,
          } as TransactionDetails,
          mockChainId,
        ],
      ]
    },
  }
})

function mockTokenAddressMap(...tokens: WrappedTokenInfo[]): TokenAddressMap {
  return {
    [SupportedChainId.MAINNET]: Object.fromEntries(tokens.map((token) => [token.address, { token }])),
  }
}

describe('parseLocalActivity', () => {
  it('returns swap activity fields with known tokens, exact input', () => {
    const details = {
      info: mockSwapInfo(MockTradeType.EXACT_INPUT, MockUSDC_MAINNET, oneUSDCRaw, MockDAI, oneDAIRaw),
      receipt: {
        transactionHash: '0x123',
        status: 1,
      },
    } as TransactionDetails
    const chainId = SupportedChainId.MAINNET
    const tokens = mockTokenAddressMap(MockUSDC_MAINNET as WrappedTokenInfo, MockDAI as WrappedTokenInfo)
    expect(parseLocalActivity(details, chainId, tokens)).toEqual({
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
          inputCurrencyAmountRaw: oneUSDCRaw,
          outputCurrencyId: MockDAI.address,
          expectedOutputCurrencyAmountRaw: oneDAIRaw,
          minimumOutputCurrencyAmountRaw: oneDAIRaw,
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
      info: mockSwapInfo(MockTradeType.EXACT_OUTPUT, MockUSDC_MAINNET, oneUSDCRaw, MockDAI, oneDAIRaw),
      receipt: {
        transactionHash: '0x123',
        status: 1,
      },
    } as TransactionDetails
    const chainId = SupportedChainId.MAINNET
    const tokens = mockTokenAddressMap(MockUSDC_MAINNET as WrappedTokenInfo, MockDAI as WrappedTokenInfo)
    expect(parseLocalActivity(details, chainId, tokens)).toEqual({
      chainId: 1,
      currencies: [MockUSDC_MAINNET, MockDAI],
      descriptor: '1.00 USDC for 1.00 DAI',
      hash: undefined,
      receipt: {
        id: '0x123',
        info: {
          type: 1,
          tradeType: MockTradeType.EXACT_OUTPUT,
          inputCurrencyId: MockUSDC_MAINNET.address,
          expectedInputCurrencyAmountRaw: oneUSDCRaw,
          maximumInputCurrencyAmountRaw: oneUSDCRaw,
          outputCurrencyId: MockDAI.address,
          outputCurrencyAmountRaw: oneDAIRaw,
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

  it('returns swap activity fields with unknown tokens', () => {
    const details = {
      info: mockSwapInfo(MockTradeType.EXACT_INPUT, MockUSDC_MAINNET, oneUSDCRaw, MockDAI, oneDAIRaw),
      receipt: {
        transactionHash: '0x123',
        status: 1,
      },
    } as TransactionDetails
    const chainId = SupportedChainId.MAINNET
    const tokens = {} as TokenAddressMap
    expect(parseLocalActivity(details, chainId, tokens)).toEqual({
      chainId: 1,
      currencies: [undefined, undefined],
      descriptor: 'Unknown for Unknown',
      hash: undefined,
      receipt: {
        id: '0x123',
        info: {
          type: 1,
          tradeType: MockTradeType.EXACT_INPUT,
          inputCurrencyId: MockUSDC_MAINNET.address,
          inputCurrencyAmountRaw: oneUSDCRaw,
          outputCurrencyId: MockDAI.address,
          expectedOutputCurrencyAmountRaw: oneDAIRaw,
          minimumOutputCurrencyAmountRaw: oneDAIRaw,
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

  it('only returns activity for the current account', () => {
    const account1Activites = renderHook(() => useLocalActivities(mockAccount1)).result.current
    const account2Activites = renderHook(() => useLocalActivities(mockAccount2)).result.current

    expect(Object.values(account1Activites)).toHaveLength(1)
    expect(Object.values(account2Activites)).toHaveLength(2)
  })
})
