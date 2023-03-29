// jest unit tests for the parseLocalActivity function

import { SupportedChainId, Token, TradeType } from '@uniswap/sdk-core'
import { DAI, USDC_MAINNET } from 'constants/tokens'
import { TokenAddressMap } from 'state/lists/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'state/transactions/types'

import { parseLocalActivity } from './parseLocal'

const oneUSDCRaw = '1000000'
const oneDAIRaw = '1000000000000000000'

function buildSwapInfo(
  type: TradeType,
  inputCurrency: Token,
  inputCurrencyAmountRaw: string,
  outputCurrency: Token,
  outputCurrencyAmountRaw: string
): ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo {
  if (type === TradeType.EXACT_INPUT) {
    return {
      type: TransactionType.SWAP,
      tradeType: TradeType.EXACT_INPUT,
      inputCurrencyId: inputCurrency.address,
      inputCurrencyAmountRaw,
      outputCurrencyId: outputCurrency.address,
      expectedOutputCurrencyAmountRaw: outputCurrencyAmountRaw,
      minimumOutputCurrencyAmountRaw: outputCurrencyAmountRaw,
    }
  } else {
    return {
      type: TransactionType.SWAP,
      tradeType: TradeType.EXACT_OUTPUT,
      inputCurrencyId: inputCurrency.address,
      expectedInputCurrencyAmountRaw: inputCurrencyAmountRaw,
      maximumInputCurrencyAmountRaw: inputCurrencyAmountRaw,
      outputCurrencyId: outputCurrency.address,
      outputCurrencyAmountRaw,
    }
  }
}

function buildTokenAddressMap(...tokens: WrappedTokenInfo[]): TokenAddressMap {
  return {
    [SupportedChainId.MAINNET]: Object.fromEntries(tokens.map((token) => [token.address, { token }])),
  }
}

describe('parseLocalActivity', () => {
  it('returns swap activity fields with known tokens, exact input', () => {
    const details = {
      info: buildSwapInfo(TradeType.EXACT_INPUT, USDC_MAINNET, oneUSDCRaw, DAI, oneDAIRaw),
      receipt: {
        transactionHash: '0x123',
        status: 1,
      },
    } as TransactionDetails
    const chainId = SupportedChainId.MAINNET
    const tokens = buildTokenAddressMap(USDC_MAINNET as WrappedTokenInfo, DAI as WrappedTokenInfo)
    expect(parseLocalActivity(details, chainId, tokens)).toEqual({
      chainId: 1,
      currencies: [USDC_MAINNET, DAI],
      descriptor: '1.00 USDC for 1.00 DAI',
      hash: undefined,
      receipt: {
        id: '0x123',
        info: {
          type: 1,
          tradeType: TradeType.EXACT_INPUT,
          inputCurrencyId: USDC_MAINNET.address,
          inputCurrencyAmountRaw: oneUSDCRaw,
          outputCurrencyId: DAI.address,
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
      info: buildSwapInfo(TradeType.EXACT_OUTPUT, USDC_MAINNET, oneUSDCRaw, DAI, oneDAIRaw),
      receipt: {
        transactionHash: '0x123',
        status: 1,
      },
    } as TransactionDetails
    const chainId = SupportedChainId.MAINNET
    const tokens = buildTokenAddressMap(USDC_MAINNET as WrappedTokenInfo, DAI as WrappedTokenInfo)
    expect(parseLocalActivity(details, chainId, tokens)).toEqual({
      chainId: 1,
      currencies: [USDC_MAINNET, DAI],
      descriptor: '1.00 USDC for 1.00 DAI',
      hash: undefined,
      receipt: {
        id: '0x123',
        info: {
          type: 1,
          tradeType: TradeType.EXACT_OUTPUT,
          inputCurrencyId: USDC_MAINNET.address,
          expectedInputCurrencyAmountRaw: oneUSDCRaw,
          maximumInputCurrencyAmountRaw: oneUSDCRaw,
          outputCurrencyId: DAI.address,
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
      info: buildSwapInfo(TradeType.EXACT_INPUT, USDC_MAINNET, oneUSDCRaw, DAI, oneDAIRaw),
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
          tradeType: TradeType.EXACT_INPUT,
          inputCurrencyId: USDC_MAINNET.address,
          inputCurrencyAmountRaw: oneUSDCRaw,
          outputCurrencyId: DAI.address,
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
})
