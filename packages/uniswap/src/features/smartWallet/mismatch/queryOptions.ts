import { queryOptions, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
/**
 * [public] getIsMismatchAccountQueryOptions -- gets the query options for the mismatch account status for the current account
 * @param ctx - the context object: hasMismatch (callback)
 * @returns a function that returns the query options for the mismatch account status for the passed in address
 */
export const getIsMismatchAccountQueryOptions =
  (ctx: { hasMismatch: (input: { address: string; chainId: number }) => Promise<boolean>; isMainnet: boolean }) =>
  (input: { address?: string; chainId?: number }): MisMatchQueryOptions => {
    return queryOptions({
      queryKey: [ReactQueryCacheKey.MismatchAccount, input.address, input.chainId, ctx.isMainnet],
      queryFn: async (): Promise<MismatchResult> => {
        if (!input.address || !input.chainId) {
          return {
            chainId: input.chainId,
            hasMismatch: false,
          }
        }
        const hasMismatch = await ctx.hasMismatch({ address: input.address, chainId: input.chainId })

        const result: MismatchResult = {
          chainId: input.chainId,
          hasMismatch,
        }
        return result
      },
      enabled: !!input.address,
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: false,
      retry: false,
    })
  }

export interface MismatchResult {
  chainId?: number
  hasMismatch: boolean
}

type OptionalString = string | undefined
type OptionalNumber = number | undefined
type QueryKey = [ReactQueryCacheKey.MismatchAccount, OptionalString, OptionalNumber, boolean]

export type MisMatchQueryOptions = UseQueryOptions<MismatchResult, Error, MismatchResult, QueryKey>
export type MisMatchQueryResult = UseQueryResult<MismatchResult, Error>
