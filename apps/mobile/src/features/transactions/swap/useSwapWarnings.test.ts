import { CurrencyAmount } from '@uniswap/sdk-core'
import { WarningLabel } from 'src/components/modals/WarningModal/types'
import { getSwapWarnings } from 'src/features/transactions/swap/useSwapWarnings'
import { ChainId } from 'wallet/src/constants/chains'
import { DAI, USDC } from 'wallet/src/constants/tokens'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { WrapType } from 'wallet/src/features/transactions/types'
import { isOffline } from 'wallet/src/features/transactions/utils'
import {
  daiCurrencyInfo,
  ethCurrencyInfo,
  networkDown,
  networkUnknown,
  networkUp,
} from 'wallet/src/test/fixtures'
import { DerivedSwapInfo } from './types'

const ETH = NativeCurrency.onChain(ChainId.Mainnet)

const emptySwapInfo: Pick<
  DerivedSwapInfo,
  'exactAmountToken' | 'exactAmountFiat' | 'chainId' | 'wrapType' | 'focusOnCurrencyField'
> = {
  chainId: 1,
  wrapType: WrapType.NotApplicable,
  exactAmountToken: '1000',
  exactAmountFiat: '1000',
  focusOnCurrencyField: CurrencyField.INPUT,
}

const swapState: DerivedSwapInfo = {
  ...emptySwapInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
    [CurrencyField.OUTPUT]: undefined,
  },
  currencyAmountsUSDValue: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(USDC, '100000'),
    [CurrencyField.OUTPUT]: undefined,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '20000'),
    [CurrencyField.OUTPUT]: undefined,
  },
  currencies: {
    [CurrencyField.INPUT]: ethCurrencyInfo,
    [CurrencyField.OUTPUT]: undefined,
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: { loading: false, error: undefined, trade: null },
}

const insufficientBalanceState: DerivedSwapInfo = {
  ...emptySwapInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
    [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(DAI, '200000'),
  },
  currencyAmountsUSDValue: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(USDC, '100000'),
    [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(USDC, '200000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000'),
    [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(DAI, '0'),
  },
  currencies: {
    [CurrencyField.INPUT]: ethCurrencyInfo,
    [CurrencyField.OUTPUT]: daiCurrencyInfo,
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: { loading: false, error: undefined, trade: null },
}

const tradeErrorState: DerivedSwapInfo = {
  ...emptySwapInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(DAI, '1000'),
    [CurrencyField.OUTPUT]: null,
  },
  currencyAmountsUSDValue: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(USDC, '1000'),
    [CurrencyField.OUTPUT]: null,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(DAI, '10000'),
    [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(ETH, '0'),
  },
  currencies: {
    [CurrencyField.INPUT]: daiCurrencyInfo,
    [CurrencyField.OUTPUT]: ethCurrencyInfo,
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: {
    loading: false,
    error: { status: 404, data: { errorCode: 'GENERIC_ERROR' } },
    trade: null,
  },
}

const mockTranslate = jest.fn()

describe(getSwapWarnings, () => {
  it('catches incomplete form errors', async () => {
    const warnings = getSwapWarnings(mockTranslate, swapState, isOffline(networkUp))
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches insufficient balance errors', () => {
    const warnings = getSwapWarnings(
      mockTranslate,

      insufficientBalanceState,
      isOffline(networkUp)
    )
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.InsufficientFunds)
  })

  it('catches multiple errors', () => {
    const incompleteAndInsufficientBalanceState = {
      ...swapState,
      currencyAmounts: {
        ...swapState.currencyAmounts,
        [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '30000'),
      },
    }

    const warnings = getSwapWarnings(
      mockTranslate,

      incompleteAndInsufficientBalanceState,
      isOffline(networkUp)
    )
    expect(warnings.length).toBe(2)
  })

  it('catches errors returned by the routing api', () => {
    const warnings = getSwapWarnings(mockTranslate, tradeErrorState, isOffline(networkUp))
    expect(warnings.find((warning) => warning.type === WarningLabel.SwapRouterError)).toBeTruthy()
  })

  it('errors if there is no internet', () => {
    const warnings = getSwapWarnings(mockTranslate, tradeErrorState, isOffline(networkDown))
    expect(warnings.find((warning) => warning.type === WarningLabel.NetworkError)).toBeTruthy()
  })

  it('does not error when network state is unknown', () => {
    const warnings = getSwapWarnings(mockTranslate, tradeErrorState, isOffline(networkUnknown))
    expect(warnings.find((warning) => warning.type === WarningLabel.NetworkError)).toBeFalsy()
  })
})
