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
