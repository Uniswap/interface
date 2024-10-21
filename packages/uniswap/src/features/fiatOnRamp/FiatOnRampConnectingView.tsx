import { PlatformSplitStubError } from 'utilities/src/errors'

export function FiatOnRampConnectingView(_props: {
  isOffRamp?: boolean
  amount?: string
  quoteCurrencyCode?: string
  serviceProviderName: string
  serviceProviderLogo?: JSX.Element
}): JSX.Element {
  throw new PlatformSplitStubError('FiatOnRampConnectingView')
}
