import { CurrencyAmount } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { DAI, nativeOnChain, USDC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { Locale } from 'uniswap/src/features/language/constants'
import { getSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import i18n from 'uniswap/src/i18n'
import { daiCurrencyInfo, ethCurrencyInfo } from 'uniswap/src/test/fixtures'
import { createGasEstimate } from 'uniswap/src/test/fixtures/tradingApi'
import { createEmptyTradeWithStatus } from 'uniswap/src/test/fixtures/transactions/swap'
import { mockLocalizedFormatter } from 'uniswap/src/test/mocks'
import { CurrencyField } from 'uniswap/src/types/currency'

const ETH = nativeOnChain(UniverseChainId.Mainnet)

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
  outputAmountUserWillReceive: undefined,
  exactCurrencyField: CurrencyField.INPUT,
  trade: createEmptyTradeWithStatus({ gasEstimate: createGasEstimate() }),
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
  outputAmountUserWillReceive: CurrencyAmount.fromRawAmount(DAI, '200000'),
  exactCurrencyField: CurrencyField.INPUT,
  trade: createEmptyTradeWithStatus({ gasEstimate: createGasEstimate() }),
}

const blockedTokenState: DerivedSwapInfo = {
  ...swapState,
  currencies: {
    ...swapState.currencies,
    [CurrencyField.INPUT]: {
      ...daiCurrencyInfo(),
      safetyInfo: { tokenList: TokenList.Blocked, protectionResult: GraphQLApi.ProtectionResult.Unknown },
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
  outputAmountUserWillReceive: null,
  exactCurrencyField: CurrencyField.INPUT,
  trade: createEmptyTradeWithStatus({ error: new Error('Generic error'), gasEstimate: createGasEstimate() }),
}
const { formatPercent } = mockLocalizedFormatter(Locale.EnglishUnitedStates)

describe(getSwapWarnings, () => {
  it('catches incomplete form errors', async () => {
    const warnings = getSwapWarnings({ t: i18n.t, formatPercent, derivedSwapInfo: swapState, offline: false })
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches blocked token errors', async () => {
    const warnings = getSwapWarnings({ t: i18n.t, formatPercent, derivedSwapInfo: blockedTokenState, offline: false })
    expect(warnings.map((w) => w.type)).toContain(WarningLabel.BlockedToken)
  })

  it('catches insufficient balance errors', () => {
    const warnings = getSwapWarnings({
      t: i18n.t,
      formatPercent,
      derivedSwapInfo: insufficientBalanceState,
      offline: false,
    })
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

    const warnings = getSwapWarnings({
      t: i18n.t,
      formatPercent,
      derivedSwapInfo: incompleteAndInsufficientBalanceState,
      offline: false,
    })
    expect(warnings.length).toBe(2)
  })

  it('catches errors returned by the trading api', () => {
    const warnings = getSwapWarnings({ t: i18n.t, formatPercent, derivedSwapInfo: tradeErrorState, offline: false })
    expect(warnings.find((warning) => warning.type === WarningLabel.SwapRouterError)).toBeTruthy()
  })

  it('errors if there is no internet', () => {
    const warnings = getSwapWarnings({ t: i18n.t, formatPercent, derivedSwapInfo: tradeErrorState, offline: true })
    expect(warnings.find((warning) => warning.type === WarningLabel.NetworkError)).toBeTruthy()
  })

  it('does not return a network error when offline is false', () => {
    const warnings = getSwapWarnings({ t: i18n.t, formatPercent, derivedSwapInfo: tradeErrorState, offline: false })
    expect(warnings.find((warning) => warning.type === WarningLabel.NetworkError)).toBeFalsy()
  })
})
