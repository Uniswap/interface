import { CurrencyAmount } from '@uniswap/sdk-core'
import { WarningLabel } from 'src/components/modals/WarningModal/types'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { getSwapWarnings } from 'src/features/transactions/swap/useSwapWarnings'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { account } from 'src/test/fixtures'

const ETH = NativeCurrency.onChain(ChainId.Mainnet)

const emptySwapInfo: Pick<
  DerivedSwapInfo,
  'exactAmountToken' | 'exactAmountUSD' | 'chainId' | 'wrapType' | 'focusOnCurrencyField'
> = {
  chainId: 1,
  wrapType: WrapType.NotApplicable,
  exactAmountToken: '1000',
  exactAmountUSD: '1000',
  focusOnCurrencyField: CurrencyField.INPUT,
}

const swapState: DerivedSwapInfo = {
  ...emptySwapInfo,
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
}

const insufficientBalanceState: DerivedSwapInfo = {
  ...emptySwapInfo,
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
}

const tradeErrorState: DerivedSwapInfo = {
  ...emptySwapInfo,
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
}

const insufficientGasBalanceState: DerivedSwapInfo = {
  ...emptySwapInfo,
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
}

const mockTranslate = jest.fn()

describe(getSwapWarnings, () => {
  it('catches incomplete form errors', async () => {
    const warnings = getSwapWarnings(mockTranslate, account, swapState, undefined)
    expect(warnings.length).toBe(1)
    expect(warnings[0].type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches insufficient balance errors', () => {
    const warnings = getSwapWarnings(mockTranslate, account, insufficientBalanceState, undefined)
    expect(warnings.length).toBe(1)
    expect(warnings[0].type).toEqual(WarningLabel.InsufficientFunds)
  })

  it('catches insufficient gas errors', () => {
    const warnings = getSwapWarnings(mockTranslate, account, insufficientGasBalanceState, '100')
    expect(
      warnings.find((warning) => warning.type === WarningLabel.InsufficientGasFunds)
    ).toBeTruthy()
  })

  it('catches multiple errors', () => {
    const incompleteAndInsufficientBalanceState = {
      ...swapState,
      currencyAmounts: {
        ...swapState.currencyAmounts,
        [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '30000'),
      },
    }

    const warnings = getSwapWarnings(mockTranslate, account, incompleteAndInsufficientBalanceState)
    expect(warnings.length).toBe(2)
  })

  it('catches errors returned by the routing api', () => {
    const warnings = getSwapWarnings(mockTranslate, account, tradeErrorState)
    expect(warnings.find((warning) => warning.type === WarningLabel.SwapRouterError)).toBeTruthy()
  })
})
