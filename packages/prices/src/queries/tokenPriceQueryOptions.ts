import { queryOptions, skipToken } from '@tanstack/react-query'
import { priceKeys } from '@universe/prices/src/queries/priceKeys'
import type { TokenPriceData } from '@universe/prices/src/types'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function tokenPriceQueryOptions(chainId: number, address: string) {
  return queryOptions<TokenPriceData>({
    queryKey: priceKeys.token(chainId, address),
    queryFn: skipToken,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    structuralSharing: false,
  })
}
