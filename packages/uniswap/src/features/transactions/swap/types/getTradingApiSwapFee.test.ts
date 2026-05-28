import { Percent } from '@uniswap/sdk-core'
import { ClassicQuoteResponse, DiscriminatedQuoteResponse, TradingApi } from '@universe/api'
import { getTradingApiSwapFee } from 'uniswap/src/features/transactions/swap/types/getTradingApiSwapFee'
import { CurrencyField } from 'uniswap/src/types/currency'

const PORTION_RECIPIENT_AGGREGATED_OUTPUTS = '0xPORTION_RECIPIENT_AGGREGATED_OUTPUTS'
const PORTION_AMOUNT_AGGREGATED_OUTPUTS = '25000000'
const PORTION_BIPS_AGGREGATED_OUTPUTS = 25
const PORTION_RECIPIENT_PORTION_FIELDS = '0xPORTION_RECIPIENT_PORTION_FIELDS'
const PORTION_AMOUNT_PORTION_FIELDS = '35000000'
const PORTION_BIPS_PORTION_FIELDS = 35

const CLASSIC_QUOTE_RESPONSE: ClassicQuoteResponse = {
  requestId: '5ae59692-7598-4aa8-a7d2-5e8f3d0c68e6',
  routing: TradingApi.Routing.CLASSIC,
  quote: {
    chainId: 8453,
    input: {
      amount: '3024260483543089590',
      token: '0x0000000000000000000000000000000000000000',
    },
    output: {
      amount: '10000000000',
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      recipient: '0xAAAA44272dc658575Ba38f43C438447dDED45358',
    },
    swapper: '0xAAAA44272dc658575Ba38f43C438447dDED45358',
    slippage: 2.5,
    tradeType: TradingApi.TradeType.EXACT_OUTPUT,
    quoteId: 'b9cb77f5-eee9-4ef9-9016-74710d18419b',
    gasFeeUSD: '0.00499',
    gasFeeQuote: '1508616120023',
    gasUseEstimate: '133000',
    priceImpact: 0.06,
    txFailureReasons: [],
    gasPrice: '5629546',
    gasFee: '2609240163336',
    gasEstimates: [],
    aggregatedOutputs: [
      {
        amount: '10000000000',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        recipient: '0xAAAA44272dc658575Ba38f43C438447dDED45358',
        bps: 9975,
      },
      {
        amount: PORTION_AMOUNT_AGGREGATED_OUTPUTS,
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        recipient: PORTION_RECIPIENT_AGGREGATED_OUTPUTS,
        bps: PORTION_BIPS_AGGREGATED_OUTPUTS,
      },
    ],
    portionAmount: PORTION_AMOUNT_PORTION_FIELDS,
    portionBips: PORTION_BIPS_PORTION_FIELDS,
    portionRecipient: PORTION_RECIPIENT_PORTION_FIELDS,
  },
  permitData: null,
}

describe(getTradingApiSwapFee, () => {
  it('returns undefined if no quote provided', () => {
    expect(getTradingApiSwapFee(undefined)).toBeUndefined()
  })

  it('returns undefined if quote has no aggregatedOutputs and no portionAmount or portionBips', () => {
    const quote: DiscriminatedQuoteResponse = {
      ...CLASSIC_QUOTE_RESPONSE,
      quote: {
        ...CLASSIC_QUOTE_RESPONSE.quote,
        portionAmount: undefined,
        portionBips: undefined,
        aggregatedOutputs: undefined,
      },
    }

    expect(getTradingApiSwapFee(quote as DiscriminatedQuoteResponse)).toBeUndefined()
  })

  it('returns fee info using legacy portion fields when aggregatedOutputs is not present', () => {
    const quote: DiscriminatedQuoteResponse = {
      ...CLASSIC_QUOTE_RESPONSE,
      quote: {
        ...CLASSIC_QUOTE_RESPONSE.quote,
        aggregatedOutputs: undefined,
      },
    }

    expect(getTradingApiSwapFee(quote)).toEqual({
      recipient: PORTION_RECIPIENT_PORTION_FIELDS,
      percent: new Percent(PORTION_BIPS_PORTION_FIELDS, '10000'),
      amount: PORTION_AMOUNT_PORTION_FIELDS,
      feeField: CurrencyField.OUTPUT,
    })
  })

  it('returns fee info from aggregatedOutputs when both portion fields and aggregatedOutputs are present', () => {
    const quote: DiscriminatedQuoteResponse = {
      ...CLASSIC_QUOTE_RESPONSE,
    }

    expect(getTradingApiSwapFee(quote)).toEqual({
      recipient: PORTION_RECIPIENT_AGGREGATED_OUTPUTS,
      percent: new Percent(PORTION_BIPS_AGGREGATED_OUTPUTS, '10000'),
      amount: PORTION_AMOUNT_AGGREGATED_OUTPUTS,
      feeField: CurrencyField.OUTPUT,
    })
  })

  it('returns fee info from aggregatedOutputs when aggregatedOutputs is present andportion fields are undefined', () => {
    const quote: DiscriminatedQuoteResponse = {
      ...CLASSIC_QUOTE_RESPONSE,
      quote: {
        ...CLASSIC_QUOTE_RESPONSE.quote,
        portionAmount: undefined,
        portionBips: undefined,
        portionRecipient: undefined,
      },
    }

    expect(getTradingApiSwapFee(quote)).toEqual({
      recipient: PORTION_RECIPIENT_AGGREGATED_OUTPUTS,
      percent: new Percent(PORTION_BIPS_AGGREGATED_OUTPUTS, '10000'),
      amount: PORTION_AMOUNT_AGGREGATED_OUTPUTS,
      feeField: CurrencyField.OUTPUT,
    })
  })

  it('returns undefined if no fee found in aggregatedOutputs', () => {
    const quote: DiscriminatedQuoteResponse = {
      ...CLASSIC_QUOTE_RESPONSE,
      quote: {
        ...CLASSIC_QUOTE_RESPONSE.quote,
        aggregatedOutputs: [
          {
            amount: '10000000000',
            token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            recipient: '0xAAAA44272dc658575Ba38f43C438447dDED45358',
            bps: 10000,
          },
        ],
      },
    }

    expect(getTradingApiSwapFee(quote)).toBeUndefined()
  })

  it('returns undefined if fee in aggregatedOutputs has no amount or bps', () => {
    const quote: DiscriminatedQuoteResponse = {
      ...CLASSIC_QUOTE_RESPONSE,
      quote: {
        ...CLASSIC_QUOTE_RESPONSE.quote,
        aggregatedOutputs: [
          {
            amount: '10000000000',
            token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            recipient: '0xAAAA44272dc658575Ba38f43C438447dDED45358',
            bps: 10000,
          },
          {
            amount: undefined,
            token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            recipient: PORTION_RECIPIENT_AGGREGATED_OUTPUTS,
            bps: undefined,
          },
        ],
      },
    }

    expect(getTradingApiSwapFee(quote)).toBeUndefined()
  })
})
