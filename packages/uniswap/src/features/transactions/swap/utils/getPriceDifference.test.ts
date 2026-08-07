import { Percent } from '@uniswap/sdk-core'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { Trade, TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
import { getPriceDifference } from 'uniswap/src/features/transactions/swap/utils/getPriceDifference'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'

const MAINNET_CHAIN_ID = 1

describe('getPriceDifference', () => {
  const makeTradeWithStatus = (trade: Trade | null = null): TradeWithStatus => ({
    isLoading: false,
    error: null,
    trade,
    indicativeTrade: undefined,
    isIndicativeLoading: false,
    gasEstimate: undefined,
    quoteHash: '',
  })

  const makeDerivedSwapInfo = (trade: Trade | null | undefined): DerivedSwapInfo => ({
    chainId: MAINNET_CHAIN_ID as DerivedSwapInfo['chainId'],
    currencies: {
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: null,
    },
    currencyAmounts: {
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: null,
    },
    currencyBalances: {
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: null,
    },
    currencyAmountsUSDValue: {
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: null,
    },
    outputAmountUserWillReceive: null,
    focusOnCurrencyField: null,
    trade: makeTradeWithStatus(trade),
    wrapType: WrapType.NotApplicable,
    exactAmountToken: '',
    exactCurrencyField: CurrencyField.INPUT,
  })

  it('returns undefined when there is no trade', () => {
    expect(getPriceDifference(makeDerivedSwapInfo(undefined))).toBeUndefined()
  })

  it('returns the price difference carried on the trade', () => {
    const priceDifference = new Percent(7, 100)
    const result = getPriceDifference(makeDerivedSwapInfo({ priceDifference } as Trade))
    expect(result).toBe(priceDifference)
  })

  it('returns undefined when the trade carries no price difference', () => {
    expect(getPriceDifference(makeDerivedSwapInfo({} as Trade))).toBeUndefined()
  })
})
