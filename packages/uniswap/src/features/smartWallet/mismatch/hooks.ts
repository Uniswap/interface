import { UseMutationResult, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useMismatchContext } from 'uniswap/src/features/smartWallet/mismatch/MismatchContext'
import {
  MisMatchQueryOptions,
  MisMatchQueryResult,
  MismatchResult,
} from 'uniswap/src/features/smartWallet/mismatch/queryOptions'
import { useMakeAccountMismatchQueryOptions } from 'uniswap/src/features/smartWallet/mismatch/useMakeAccountMismatchQueryOptions'
import { getLogger } from 'utilities/src/logger/logger'
import { useEvent, usePrevious } from 'utilities/src/react/hooks'

/**
 * [public] useIsMismatchAccountQuery -- gets the mismatch account status for the current account, specific to a chain
 * @returns the mismatch account status for the current account (useQuery result)
 */
export function useIsMismatchAccountQuery(input?: { chainId?: number }): MisMatchQueryResult {
  const getQueryOptions = useCurrentAccountMismatchQueryOptions()
  return useQuery(getQueryOptions(input?.chainId))
}

/**
 * [public] useHasAccountMismatchOnAnyChain -- gets the mismatch account status for the current account
 * @returns the mismatch account status for the current account
 */
export function useHasAccountMismatchOnAnyChain(): boolean {
  const queries = useAllChainMismatchQueries()
  return useMemo(() => {
    return queries.some((query) => query.data?.hasMismatch)
  }, [queries])
}

/**
 * [public] useHasAccountMismatchCallback --
 * @returns a callback that checks if the current account has a mismatch for a given chain
 */
export function useHasAccountMismatchCallback(): (chainId?: UniverseChainId) => boolean {
  const queries = useAllChainMismatchQueries()
  return useEvent((chainId?: UniverseChainId) => {
    if (!chainId) {
      return queries.some((query) => query.data?.hasMismatch)
    }
    return Boolean(queries.find((query) => query.data?.chainId === chainId)?.data?.hasMismatch)
  })
}

/**
 * [public] useCurrentAccountChainMismatchEffect -- invalidates the current account chain mismatch query on chain change
 * NB: only call this once per app instance, eg in the root component
 */
export function useCurrentAccountChainMismatchEffect(): void {
  const account = useMismatchContext().account
  const getQueryOptions = useCurrentAccountMismatchQueryOptions()
  const queryOptions = getQueryOptions(account.chainId)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!account.address || !account.chainId) {
      return
    }
    // invalidate on chain change so we ensure we are always checking the latest chain results
    queryClient.invalidateQueries({ queryKey: queryOptions.queryKey }).catch(() => {})
  }, [account.address, account.chainId, queryOptions, queryClient])
}

/**
 * [public] useAllAccountChainMismatchEffect -- checks all account chain mismatch queries on wallet connect
 * NB: only call this once per app instance, eg in the root component
 */
export function useOnConnectCheckAllAccountChainMismatchEffect(): void {
  const { account, onHasAnyMismatch, isTestnetModeEnabled } = useMismatchContext()
  const currentMode = isTestnetModeEnabled ? 'testnet' : 'mainnet'
  const previousMode = usePrevious(currentMode)
  const { mutate, isPending, isSuccess, isError } = useAllAcountChainMismatchMutation({ onHasAnyMismatch })
  const checkedAddress = useRef<string | undefined>(undefined)
  const checkAllAccountChainMismatch = useEvent(() => {
    if (isPending || isSuccess || isError) {
      return
    }
    mutate()
  })

  useEffect(() => {
    // handle mainnet -> testnet mode change and vice versa
    if (previousMode !== currentMode) {
      checkAllAccountChainMismatch()
      return
    }
  }, [currentMode, previousMode, checkAllAccountChainMismatch])

  useEffect(() => {
    if (account.address && account.address !== checkedAddress.current) {
      checkAllAccountChainMismatch()
      checkedAddress.current = account.address
    }
  }, [account.address, checkAllAccountChainMismatch])
}

/**
 * [private] useAllChainMismatchQueries -- gets the mismatch account status for all chains
 * @returns the mismatch account status for all chains (useQueries result)
 */
function useAllChainMismatchQueries(): MisMatchQueryResult[] {
  const queryOptions = useAllAccountChainMismatchQueryOptions()
  return useQueries({ queries: queryOptions })
}

/**
 * [private] useCurrentAccountMismatchQueryOptions -- gets the query options for the mismatch account status for the current account
 * @returns a function that returns the query options for the mismatch account status for the passed in address
 */
function useCurrentAccountMismatchQueryOptions(): (chainId?: number) => MisMatchQueryOptions {
  const mismatchContext = useMismatchContext()
  return useMakeAccountMismatchQueryOptions({
    hasMismatch: mismatchContext.mismatchCallback,
    account: { address: mismatchContext.account.address, chainId: mismatchContext.account.chainId },
  })
}

/**
 * [private] useAllAccountChainMismatchQueryOptions -- gets the query options for all account chain mismatch queries
 * @returns an array of query options for all account chain mismatch queries
 */
function useAllAccountChainMismatchQueryOptions(): MisMatchQueryOptions[] {
  const chains = useMismatchContext().chains
  const getQueryOptions = useCurrentAccountMismatchQueryOptions()
  return useMemo(() => {
    return chains.map((chainId) => getQueryOptions(chainId))
  }, [getQueryOptions, chains])
}

/**
 * [private] useAllAcountChainMismatchMutation -- checks all account chain mismatch queries
 * @returns a mutation that checks all account chain mismatch queries
 */
const useAllAcountChainMismatchMutation = (ctx: {
  onHasAnyMismatch: () => void
}): UseMutationResult<MismatchResult[], Error, void> => {
  const queryOptions = useAllAccountChainMismatchQueryOptions()
  const queryClient = useQueryClient()
  const logger = getLogger()
  const account = useMismatchContext().account
  return useMutation({
    retry: (failureCount, error) => {
      const isRetryable = isRetryableError(error)
      switch (isRetryable) {
        case 'retry':
          return true
        case 'noRetry':
          return false
        default:
          return failureCount < 3
      }
    },
    mutationFn: async () => {
      if (!account.address) {
        return []
      }
      return Promise.all(
        queryOptions.map((query) =>
          // we fetch via the query so we can cache the result in RQ
          // staleTime is set to 0 so we don't use cached data
          queryClient.fetchQuery({ ...query, staleTime: 0 }),
        ),
      )
    },
    onSuccess: (data) => {
      if (!account.address) {
        return
      }
      const hasMismatch = data.some((result) => result.hasMismatch)
      if (hasMismatch) {
        ctx.onHasAnyMismatch()
        for (const result of data) {
          if (result.hasMismatch) {
            logger?.info(
              'useMismatchAccount.ts',
              'useAllAcountChainMismatchMutation',
              `mismatch found on chain ${result.chainId}`,
            )
          }
        }
      }
    },
  })
}

function isRetryableError(error: Error): 'retry' | 'noRetry' | 'unknown' {
  const errorMessage = error.message
  const found = errorMessage
    ? Object.keys(ERROR_MAP).find((key) => errorMessage.toLowerCase().includes(key.toLowerCase()))
    : undefined
  const existing = found ? ERROR_MAP[found] : undefined
  if (existing) {
    return existing.retry ? 'retry' : 'noRetry'
  }
  return 'unknown'
}
const ERROR_MAP: Record<string, { retry: boolean }> = {
  UnknownRPCError: {
    retry: false,
  },
  'Not implemented': {
    retry: false,
  },
}
