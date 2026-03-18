import type { UseQueryResult } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { TradingApi } from '@universe/api'
import type { TypedDataField } from 'ethers/lib/ethers'
import { useCallback } from 'react'
import { useSigner } from 'uniswap/src/contexts/UniswapContext'

import { signTypedData } from 'uniswap/src/features/transactions/signing'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { queryWithoutCache } from 'utilities/src/reactQuery/queryOptions'

// Used to sign permit messages where we already have the domain, types, and values.
export function usePermit2SignatureWithData({
  permitData,
  skip,
}: {
  permitData: Maybe<TradingApi.Permit>
  skip?: boolean
}): UseQueryResult<string | null> {
  const signer = useSigner()

  const { domain, types, values } = permitData || {}

  const permitSignatureFetcher = useCallback(async () => {
    if (skip || !signer || !domain || !types || !values) {
      return null
    }

    return await signTypedData({
      domain,
      types: types as Record<string, TypedDataField[]>,
      value: values as Record<string, unknown>,
      signer,
    })
  }, [domain, signer, skip, types, values])

  return useQuery(
    queryWithoutCache({
      queryKey: [ReactQueryCacheKey.Permit2SignatureWithData, permitData],
      queryFn: permitSignatureFetcher,
      enabled: !skip,
    }),
  )
}
