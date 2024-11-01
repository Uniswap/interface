import { useMemo } from 'react'
import { useFiatOnRampAggregatorTransferServiceProvidersQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'

export function useCexTransferProviders(params?: { isDisabled?: boolean }): FORServiceProvider[] {
  const { data } = useFiatOnRampAggregatorTransferServiceProvidersQuery(undefined, {
    skip: params?.isDisabled,
  })

  return useMemo(() => {
    if (!data) {
      return []
    }

    return data.serviceProviders
  }, [data])
}
