import { useMemo } from 'react'
import { useMismatchContext } from 'uniswap/src/features/smartWallet/mismatch/MismatchContext'
import {
  getIsMismatchAccountQueryOptions,
  type MisMatchQueryOptions,
} from 'uniswap/src/features/smartWallet/mismatch/queryOptions'
/**
 * [public] useMakeAccountMismatchQueryOptions -- gets the query options for the mismatch account status for the current account
 * @returns a function that returns the query options for the mismatch account status for the passed in address
 */
export function useMakeAccountMismatchQueryOptions(): MisMatchQueryOptions {
  const { isTestnetModeEnabled, account, chains, mismatchCallback } = useMismatchContext()
  return useMemo(() => {
    const getQueryOptions = getIsMismatchAccountQueryOptions({
      hasMismatch: mismatchCallback,
      isMainnet: !isTestnetModeEnabled,
    })
    return getQueryOptions({
      address: account.address,
      chainIds: chains.map((chain) => chain.valueOf()),
    })
  }, [mismatchCallback, isTestnetModeEnabled, account.address, chains])
}
