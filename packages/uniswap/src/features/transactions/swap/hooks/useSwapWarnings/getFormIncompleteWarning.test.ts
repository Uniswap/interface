import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { nativeOnChain, USDC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getFormIncompleteWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getFormIncompleteWarning'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

const ETH = nativeOnChain(UniverseChainId.Mainnet)

const mockCurrencyInfo = (currency: Currency): CurrencyInfo => ({
  currency,
  currencyId: currency.symbol ?? '',
  logoUrl: '',
})

const ETH_INFO = mockCurrencyInfo(ETH)
const USDC_INFO = mockCurrencyInfo(USDC)

describe('getFormIncompleteWarning', () => {
  const createMockDerivedSwapInfo = (overrides: Partial<DerivedSwapInfo> = {}): DerivedSwapInfo =>
    ({
      currencies: {
        [CurrencyField.INPUT]: ETH_INFO,
        [CurrencyField.OUTPUT]: USDC_INFO,
      },
      currencyAmounts: {
        [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000000000000000000'),
        [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(USDC, '1000000'),
      },
      exactCurrencyField: CurrencyField.INPUT,
      ...overrides,
    }) as DerivedSwapInfo

  it('returns undefined when form is complete', () => {
    const derivedSwapInfo = createMockDerivedSwapInfo()
    const result = getFormIncompleteWarning(derivedSwapInfo)
    expect(result).toBeUndefined()
  })

  it('returns warning when input currency is missing', () => {
    const derivedSwapInfo = createMockDerivedSwapInfo({
      currencies: {
        [CurrencyField.INPUT]: undefined,
        [CurrencyField.OUTPUT]: USDC_INFO,
      },
    })
    const result = getFormIncompleteWarning(derivedSwapInfo)
    expect(result).toEqual({
      type: WarningLabel.FormIncomplete,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
    })
  })

  it('returns warning when output currency is missing', () => {
    const derivedSwapInfo = createMockDerivedSwapInfo({
      currencies: {
        [CurrencyField.INPUT]: ETH_INFO,
        [CurrencyField.OUTPUT]: undefined,
      },
    })
    const result = getFormIncompleteWarning(derivedSwapInfo)
    expect(result).toEqual({
      type: WarningLabel.FormIncomplete,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
    })
  })

  it('returns warning when input amount is missing and exactCurrencyField is INPUT', () => {
    const derivedSwapInfo = createMockDerivedSwapInfo({
      currencyAmounts: {
        [CurrencyField.INPUT]: undefined,
        [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(USDC, '1000000'),
      },
      exactCurrencyField: CurrencyField.INPUT,
    })
    const result = getFormIncompleteWarning(derivedSwapInfo)
    expect(result).toEqual({
      type: WarningLabel.FormIncomplete,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
    })
  })

  it('returns warning when output amount is missing and exactCurrencyField is OUTPUT', () => {
    const derivedSwapInfo = createMockDerivedSwapInfo({
      currencyAmounts: {
        [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000000000000000000'),
        [CurrencyField.OUTPUT]: undefined,
      },
      exactCurrencyField: CurrencyField.OUTPUT,
    })
    const result = getFormIncompleteWarning(derivedSwapInfo)
    expect(result).toEqual({
      type: WarningLabel.FormIncomplete,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
    })
  })

  it('does not return warning when input amount is missing but exactCurrencyField is OUTPUT', () => {
    const derivedSwapInfo = createMockDerivedSwapInfo({
      currencyAmounts: {
        [CurrencyField.INPUT]: undefined,
        [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(USDC, '1000000'),
      },
      exactCurrencyField: CurrencyField.OUTPUT,
    })
    const result = getFormIncompleteWarning(derivedSwapInfo)
    expect(result).toBeUndefined()
  })

  it('does not return warning when output amount is missing but exactCurrencyField is INPUT', () => {
    const derivedSwapInfo = createMockDerivedSwapInfo({
      currencyAmounts: {
        [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000000000000000000'),
        [CurrencyField.OUTPUT]: undefined,
      },
      exactCurrencyField: CurrencyField.INPUT,
    })
    const result = getFormIncompleteWarning(derivedSwapInfo)
    expect(result).toBeUndefined()
  })
})
