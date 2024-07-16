import { useFiatOnRampAggregatorTransferServiceProvidersQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'

export function useCexTransferProviders(isEnabled: boolean): FORServiceProvider[] {
  const { data, isLoading } = useFiatOnRampAggregatorTransferServiceProvidersQuery(undefined, {
    skip: !isEnabled,
  })

  if (isLoading || !data) {
    return []
  }

  return data.serviceProviders
}
