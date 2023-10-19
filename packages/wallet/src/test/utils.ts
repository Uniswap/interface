import {
  formatCurrencyAmount,
  formatNumberOrString,
  formatPercent,
  NumberType,
} from 'utilities/src/format/format'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import { FiatConverter } from 'wallet/src/features/fiatCurrency/conversion'
import { LocalizedFormatter } from 'wallet/src/features/language/formatter'

export const noOpFunction = (): void => {
  return
}

export const mockLocalizedFormatter: LocalizedFormatter = {
  formatCurrencyAmount(input): string {
    return formatCurrencyAmount({ ...input, amount: input.value, locale: 'en-US' })
  },
  formatNumberOrString(input): string {
    return formatNumberOrString({
      ...input,
      price: input.value,
      locale: 'en-US',
      type: input.type || NumberType.TokenNonTx,
    })
  },
  formatPercent(value) {
    return formatPercent(value, 'en-US')
  },
}

export const mockFiatConverter: FiatConverter = {
  convertFiatAmount(amount): { amount: number; currency: FiatCurrency } {
    return { amount: amount ?? 1, currency: FiatCurrency.UnitedStatesDollar }
  },
  convertFiatAmountFormatted(fromAmount, numberType, placeholder) {
    return mockLocalizedFormatter.formatNumberOrString({
      value: fromAmount,
      type: numberType,
      placeholder,
    })
  },
}
