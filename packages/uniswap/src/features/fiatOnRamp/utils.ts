import { FORLogo, FORQuote, FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { isAndroid, isIOS } from 'utilities/src/platform'

const APPLE_PAY = 'Apple Pay'
const GOOGLE_PAY = 'Google Pay'

export function transformPaymentMethods(paymentMethods: string[]): string[] {
  return paymentMethods.filter(
    (pm) => !(pm === APPLE_PAY && isAndroid) && !(pm === GOOGLE_PAY && isIOS)
  )
}

export function getCountryFlagSvgUrl(countryCode: string): string {
  return `https://images-country.meld.io/${countryCode}/flag.svg`
}

export function getOptionalServiceProviderLogo(
  logos: FORLogo | undefined,
  isDarkMode: boolean
): string | undefined {
  return isDarkMode ? logos?.darkLogo : logos?.lightLogo
}

export function getServiceProviderForQuote(
  quote: FORQuote | undefined,
  serviceProviders: FORServiceProvider[] | undefined
): FORServiceProvider | undefined {
  return serviceProviders?.find((sp) => sp.serviceProvider === quote?.serviceProvider)
}
