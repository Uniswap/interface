import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route } from '@uniswap/v3-sdk'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { ClassicTrade, TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'

export const createMockCurrencyAmount = (token: Token, amount: string): CurrencyAmount<Token> =>
  CurrencyAmount.fromRawAmount(token, amount)

export const createMockTradeWithStatus = (
  inputAmount: CurrencyAmount<Token>,
  outputAmount: CurrencyAmount<Token>,
): TradeWithStatus => ({
  trade: new ClassicTrade({
    tradeType: TradeType.EXACT_INPUT,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
    slippageTolerance: 0.5,
    v2Routes: [],
    v3Routes: [
      {
        routev3: new Route<Currency, Currency>(
          [
            new Pool(
              inputAmount.currency,
              outputAmount.currency,
              FeeAmount.HIGH,
              '2437312313659959819381354528',
              '10272714736694327408',
              -69633,
            ),
          ],
          inputAmount.currency,
          outputAmount.currency,
        ),
        inputAmount,
        outputAmount,
      },
    ],
    mixedRoutes: [],
  }),
  isLoading: false,
  error: null,
})

export const createMockDerivedSwapInfo = (
  inputCurrency: Token,
  outputCurrency: Token,
  inputAmount: string,
  outputAmount: string,
): DerivedSwapInfo => ({
  chainId: UniverseChainId.Mainnet,
  currencies: {
    [CurrencyField.INPUT]: {
      currency: inputCurrency,
      currencyId: inputCurrency.symbol ?? '',
      safetyLevel: SafetyLevel.Verified,
      logoUrl: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
    },
    [CurrencyField.OUTPUT]: {
      currency: outputCurrency,
      currencyId: outputCurrency.symbol ?? '',
      safetyLevel: SafetyLevel.Verified,
      logoUrl: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
    },
  },
  currencyAmounts: {
    [CurrencyField.INPUT]: createMockCurrencyAmount(inputCurrency, inputAmount),
    [CurrencyField.OUTPUT]: createMockCurrencyAmount(outputCurrency, outputAmount),
  },
  currencyAmountsUSDValue: {
    [CurrencyField.INPUT]: createMockCurrencyAmount(inputCurrency, '1000000000000000000'),
    [CurrencyField.OUTPUT]: createMockCurrencyAmount(outputCurrency, '1000000000000000000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: createMockCurrencyAmount(inputCurrency, '10000000000000000000'),
    [CurrencyField.OUTPUT]: createMockCurrencyAmount(outputCurrency, '10000000000000000000'),
  },
  focusOnCurrencyField: CurrencyField.INPUT,
  trade: createMockTradeWithStatus(
    createMockCurrencyAmount(inputCurrency, inputAmount),
    createMockCurrencyAmount(outputCurrency, outputAmount),
  ),
  wrapType: WrapType.NotApplicable,
  exactAmountToken: CurrencyField.INPUT,
  exactCurrencyField: CurrencyField.INPUT,
})
