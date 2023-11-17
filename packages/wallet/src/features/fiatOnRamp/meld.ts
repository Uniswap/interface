// Meld related types
type BaseCountry = {
  countryCode: string
  displayName: string
}

type PaymentMethodLogo = {
  darkLogo: string
  lightLogo: string
}

type PaymentMethod = {
  type: string
  subtype: string
  displayName: string
  logos: PaymentMethodLogo
}

export type CountryPaymentMethodsResponse = Array<{
  country: BaseCountry
  paymentMethods: PaymentMethod[]
}>

export function getCountryFlagSvgUrl(countryCode: string): string {
  return `https://images-country.meld.io/${countryCode}/flag.svg`
}
