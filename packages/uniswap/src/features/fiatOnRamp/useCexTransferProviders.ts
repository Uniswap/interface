import { useMemo } from 'react'
import { getFiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'

export function useCexTransferProviders(params?: { isDisabled?: boolean }): FORServiceProvider[] {
  const { useFiatOnRampAggregatorTransferServiceProvidersQuery } = getFiatOnRampAggregatorApi()
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
