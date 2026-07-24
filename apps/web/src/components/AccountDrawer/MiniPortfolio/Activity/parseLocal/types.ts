import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

export type FormatNumberFunctionType = ReturnType<typeof useLocalizationContext>['formatNumberOrString']
export type FormatFiatPriceFunctionType = ReturnType<typeof useLocalizationContext>['convertFiatAmountFormatted']
