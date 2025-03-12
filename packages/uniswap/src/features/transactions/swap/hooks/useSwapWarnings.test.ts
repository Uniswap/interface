import { CurrencyAmount } from '@uniswap/sdk-core'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { ProtectionResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { Locale } from 'uniswap/src/features/language/constants'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { getSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import i18n from 'uniswap/src/i18n'
import { daiCurrencyInfo, ethCurrencyInfo } from 'uniswap/src/test/fixtures'
import { createGasFeeEstimates } from 'uniswap/src/test/fixtures/tradingApi'
import { mockLocalizedFormatter } from 'uniswap/src/test/mocks'
import { CurrencyField } from 'uniswap/src/types/currency'

const ETH = NativeCurrency.onChain(UniverseChainId.Mainnet)

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
    [CurrencyField.INPUT]: ethCurrencyInfo(),
    [CurrencyField.OUTPUT]: undefined,
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: {
    isLoading: false,
    error: null,
    trade: null,
    indicativeTrade: undefined,
    isIndicativeLoading: false,
    gasEstimates: createGasFeeEstimates(),
  },
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
    [CurrencyField.INPUT]: ethCurrencyInfo(),
    [CurrencyField.OUTPUT]: daiCurrencyInfo(),
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: {
    isLoading: false,
    error: null,
    trade: null,
    indicativeTrade: undefined,
    isIndicativeLoading: false,
    gasEstimates: createGasFeeEstimates(),
  },
}

const blockedTokenState: DerivedSwapInfo = {
  ...swapState,
  currencies: {
    ...swapState.currencies,
    [CurrencyField.INPUT]: {
      ...daiCurrencyInfo(),
      safetyInfo: { tokenList: TokenList.Blocked, protectionResult: ProtectionResult.Unknown },
    },
  },
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
    [CurrencyField.INPUT]: daiCurrencyInfo(),
    [CurrencyField.OUTPUT]: ethCurrencyInfo(),
  },
  exactCurrencyField: CurrencyField.INPUT,
  trade: {
    isLoading: false,
    error: new Error('Generic error'),
    trade: null,
    indicativeTrade: undefined,
    isIndicativeLoading: false,
    gasEstimates: createGasFeeEstimates(),
  },
}
const { formatPercent } = mockLocalizedFormatter(Locale.EnglishUnitedStates)

describe(getSwapWarnings, () => {
  it('catches incomplete form errors', async () => {
    const warnings = getSwapWarnings(i18n.t, formatPercent, swapState, false)
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches blocked token errors', async () => {
    const warnings = getSwapWarnings(i18n.t, formatPercent, blockedTokenState, false)
    expect(warnings.map((w) => w.type)).toContain(WarningLabel.BlockedToken)
  })

  it('catches insufficient balance errors', () => {
    const warnings = getSwapWarnings(i18n.t, formatPercent, insufficientBalanceState, false)
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

    const warnings = getSwapWarnings(i18n.t, formatPercent, incompleteAndInsufficientBalanceState, false)
    expect(warnings.length).toBe(2)
  })

  it('catches errors returned by the trading api', () => {
    const warnings = getSwapWarnings(i18n.t, formatPercent, tradeErrorState, false)
    expect(warnings.find((warning) => warning.type === WarningLabel.SwapRouterError)).toBeTruthy()
  })

  it('errors if there is no internet', () => {
    const warnings = getSwapWarnings(i18n.t, formatPercent, tradeErrorState, true)
    expect(warnings.find((warning) => warning.type === WarningLabel.NetworkError)).toBeTruthy()
  })

  it('does not return a network error when offline is false', () => {
    const warnings = getSwapWarnings(i18n.t, formatPercent, tradeErrorState, false)
    expect(warnings.find((warning) => warning.type === WarningLabel.NetworkError)).toBeFalsy()
  })
})
