import { MeldQuote, MeldServiceProvider } from 'wallet/src/features/fiatOnRamp/meld'

export function getServiceProviderForQuote(
  quote: MeldQuote | undefined,
  serviceProviders: MeldServiceProvider[] | undefined
): MeldServiceProvider | undefined {
  return serviceProviders?.find((sp) => sp.serviceProvider === quote?.serviceProvider)
}
