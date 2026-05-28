import { useCallback, useMemo } from 'react'
import { useMismatchContext } from 'uniswap/src/features/smartWallet/mismatch/MismatchContext'
import {
  getIsMismatchAccountQueryOptions,
  type MisMatchQueryOptions,
} from 'uniswap/src/features/smartWallet/mismatch/queryOptions'
/**
 * [public] useMakeAccountMismatchQueryOptions -- gets the query options for the mismatch account status for the current account
 * @returns a function that returns the query options for the mismatch account status for the passed in address
 */
export function useMakeAccountMismatchQueryOptions(ctx: {
  hasMismatch: (input: { address: string; chainId: number }) => Promise<boolean>
  account: { address?: string; chainId?: number }
}): (chainId?: number) => MisMatchQueryOptions {
  const { isTestnetModeEnabled, defaultChainId } = useMismatchContext()
  const getQueryOptions = useMemo(
    () => getIsMismatchAccountQueryOptions({ hasMismatch: ctx.hasMismatch, isMainnet: !isTestnetModeEnabled }),
    [ctx.hasMismatch, isTestnetModeEnabled],
  )
  return useCallback(
    (chainId?: number) =>
      getQueryOptions({
        address: ctx.account.address,
        chainId: chainId ?? ctx.account.chainId ?? defaultChainId,
      }),
    [ctx.account.address, ctx.account.chainId, defaultChainId, getQueryOptions],
  )
}
