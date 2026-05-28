import { queryOptions, type UseQueryResult } from '@tanstack/react-query'
import type { HasMismatchInput, HasMismatchUtil } from 'uniswap/src/features/smartWallet/mismatch/mismatch'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * [public] getIsMismatchAccountQueryOptions -- gets the query options for the mismatch account status for the current account
 * @param ctx - the context object: hasMismatch (callback)
 * @returns a function that returns the query options for the mismatch account status for the passed in address
 */
export const getIsMismatchAccountQueryOptions =
  (ctx: { hasMismatch: HasMismatchUtil; isMainnet: boolean }) =>
  (input: WithOptional<HasMismatchInput, 'address'>): MisMatchQueryOptions => {
    return queryOptions({
      queryKey: [ReactQueryCacheKey.MismatchAccountBulk, input.address, input.chainIds, ctx.isMainnet],
      queryFn: async (): Promise<MismatchResult> => {
        if (!input.address || !input.chainIds.length) {
          return Object.fromEntries(input.chainIds.map((chainId) => [String(chainId), false]))
        }
        const hasMismatch = await ctx.hasMismatch({ address: input.address, chainIds: input.chainIds })
        const result: MismatchResult = Object.fromEntries(
          input.chainIds.map((chainId) => [String(chainId), hasMismatch[String(chainId)] ?? false]),
        )
        return result
      },
      enabled: !!input.address && input.chainIds.length > 0,
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: false,
      retry: false,
    })
  }

export type MismatchResult = Record<string, boolean>

type QueryKey = [ReactQueryCacheKey.MismatchAccountBulk, string | undefined, number[], boolean]

export type MisMatchQueryOptions = QueryOptionsResult<MismatchResult, Error, MismatchResult, QueryKey>
export type MisMatchQueryResult<TData = MismatchResult> = UseQueryResult<TData, Error>
