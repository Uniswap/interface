import { useFiatOnRampAggregatorTransferServiceProvidersQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'

export function useCexTransferProviders(params?: { isDisabled?: boolean }): FORServiceProvider[] {
  const { data, isLoading } = useFiatOnRampAggregatorTransferServiceProvidersQuery(undefined, {
    skip: params?.isDisabled,
  })

  if (isLoading || !data) {
    return []
  }

  return data.serviceProviders
}
