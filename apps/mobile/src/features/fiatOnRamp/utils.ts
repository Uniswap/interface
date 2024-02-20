import { FORLogo, FORQuote, FORServiceProvider } from 'wallet/src/features/fiatOnRamp/types'

export function getServiceProviderForQuote(
  quote: FORQuote | undefined,
  serviceProviders: FORServiceProvider[] | undefined
): FORServiceProvider | undefined {
  return serviceProviders?.find((sp) => sp.serviceProvider === quote?.serviceProvider)
}

export function getServiceProviderLogo(
  logos: FORLogo | undefined,
  isDarkMode: boolean
): string | undefined {
  if (!logos) {
    return
  }

  return isDarkMode ? logos.darkLogo : logos.lightLogo
}
