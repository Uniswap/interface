import { CurrencyAmount } from '@uniswap/sdk-core'
import { WarningLabel } from 'src/components/warnings/types'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { getSwapWarnings, PartialDerivedSwapInfo } from 'src/features/transactions/swap/validate'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'

const ETH = NativeCurrency.onChain(ChainId.Mainnet)

const partialSwapState: PartialDerivedSwapInfo = {
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
    [CurrencyField.OUTPUT]: undefined,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '20000'),
    [CurrencyField.OUTPUT]: undefined,
  },
  currencies: {
    [CurrencyField.INPUT]: ETH,
    [CurrencyField.OUTPUT]: undefined,
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: { loading: false, error: undefined, trade: null },
  nativeCurrencyBalance: CurrencyAmount.fromRawAmount(ETH, '11000'),
  gasFee: '100',
}

const insufficientBalanceState: PartialDerivedSwapInfo = {
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
    [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(DAI, '200000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000'),
    [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(DAI, '0'),
  },
  currencies: {
    [CurrencyField.INPUT]: ETH,
    [CurrencyField.OUTPUT]: DAI,
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: { loading: false, error: undefined, trade: null },
  nativeCurrencyBalance: CurrencyAmount.fromRawAmount(ETH, '11000'),
  gasFee: '100',
}

const insufficientGasBalanceState: PartialDerivedSwapInfo = {
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(DAI, '1000'),
    [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(ETH, '2'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(DAI, '10000'),
    [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(ETH, '0'),
  },
  currencies: {
    [CurrencyField.INPUT]: DAI,
    [CurrencyField.OUTPUT]: ETH,
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: { loading: false, error: undefined, trade: null },
  nativeCurrencyBalance: CurrencyAmount.fromRawAmount(ETH, '0'),
  gasFee: '100',
}

const tradeErrorState: PartialDerivedSwapInfo = {
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(DAI, '1000'),
    [CurrencyField.OUTPUT]: null,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(DAI, '10000'),
    [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(ETH, '0'),
  },
  currencies: {
    [CurrencyField.INPUT]: DAI,
    [CurrencyField.OUTPUT]: ETH,
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: {
    loading: false,
    error: { status: 404, data: { errorCode: 'GENERIC_ERROR' } },
    trade: null,
  },
  nativeCurrencyBalance: CurrencyAmount.fromRawAmount(ETH, '0'),
  gasFee: undefined,
}

const mockTranslate = jest.fn()

describe(getSwapWarnings, () => {
  it('catches incomplete form errors', async () => {
    const warnings = getSwapWarnings(mockTranslate, partialSwapState)
    expect(warnings.length).toBe(1)
    expect(warnings[0].type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches insufficient balance errors', () => {
    const warnings = getSwapWarnings(mockTranslate, insufficientBalanceState)
    expect(warnings.length).toBe(1)
    expect(warnings[0].type).toEqual(WarningLabel.InsufficientFunds)
  })

  it('catches insufficient gas errors', () => {
    const warnings = getSwapWarnings(mockTranslate, insufficientGasBalanceState)
    expect(
      warnings.find((warning) => warning.type === WarningLabel.InsufficientGasFunds)
    ).toBeTruthy()
  })

  it('catches multiple errors', () => {
    const incompleteAndInsufficientBalanceState = {
      ...partialSwapState,
      currencyAmounts: {
        ...partialSwapState.currencyAmounts,
        [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '30000'),
      },
    }

    const warnings = getSwapWarnings(mockTranslate, incompleteAndInsufficientBalanceState)
    expect(warnings.length).toBe(2)
  })

  it('catches errors returned by the routing api', () => {
    const warnings = getSwapWarnings(mockTranslate, tradeErrorState)
    expect(warnings.find((warning) => warning.type === WarningLabel.SwapRouterError)).toBeTruthy()
  })
})
