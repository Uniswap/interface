import { UseMutationResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useMismatchContext } from 'uniswap/src/features/smartWallet/mismatch/MismatchContext'
import {
  getIsMismatchAccountQueryOptions,
  MisMatchQueryOptions,
  type MisMatchQueryResult,
  type MismatchResult,
} from 'uniswap/src/features/smartWallet/mismatch/queryOptions'
import { getLogger } from 'utilities/src/logger/logger'
import { useEvent, usePrevious } from 'utilities/src/react/hooks'

/**
 * [public] useIsMismatchAccountQuery -- gets the mismatch account status for the current account, specific to a chain
 * @returns the mismatch account status for the current account (useQuery result)
 */
export function useIsMismatchAccountQuery(input?: { chainId?: number }): MisMatchQueryResult<boolean> {
  const { defaultChainId } = useMismatchContext()
  const targetChainId = input?.chainId ?? defaultChainId
  const queryOptions = useGetMismatchQueryOptions()

  const singleChainSelector = useEvent((data: MismatchResult | undefined): boolean => {
    return data?.[String(targetChainId)] ?? false
  })

  return useQuery({
    ...queryOptions,
    select: singleChainSelector,
  })
}

/**
 * [public] useHasAccountMismatchOnAnyChain -- gets the mismatch account status for the current account
 * @returns the mismatch account status for the current account
 */
export function useHasAccountMismatchOnAnyChain(): boolean {
  const queryOptions = useGetMismatchQueryOptions()

  const anyMismatchSelector = useEvent((data: MismatchResult | undefined): boolean => {
    if (!data) {
      return false
    }
    for (const chainId in data) {
      if (data[chainId]) {
        return true
      }
    }
    return false
  })

  const { data } = useQuery({
    ...queryOptions,
    select: anyMismatchSelector,
  })

  return data ?? false
}

/**
 * [public] useHasAccountMismatchCallback --
 * @returns a callback that checks if the current account has a mismatch for a given chain
 */
export function useHasAccountMismatchCallback(): (chainId?: UniverseChainId) => boolean {
  const queryOptions = useGetMismatchQueryOptions()
  const queryClient = useQueryClient()

  return useEvent((chainId?: UniverseChainId) => {
    const data = queryClient.getQueryData(queryOptions.queryKey)
    if (!data) {
      return false
    }

    if (!chainId) {
      for (const cId in data) {
        if (data[cId]) {
          return true
        }
      }
      return false
    }
    return data[String(chainId)] ?? false
  })
}

/**
 * [public] useCurrentAccountChainMismatchEffect -- invalidates the current account chain mismatch query on chain change
 * NB: only call this once per app instance, eg in the root component
 */
export function useCurrentAccountChainMismatchEffect(): void {
  const { account } = useMismatchContext()
  const queryOptions = useGetMismatchQueryOptions()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!account.address || !account.chainId) {
      return
    }
    // invalidate on chain change so we ensure we are always checking the latest chain results
    queryClient.invalidateQueries({ queryKey: queryOptions.queryKey }).catch(() => {})
  }, [account.address, account.chainId, queryOptions.queryKey, queryClient])
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
 * [private] useAllAcountChainMismatchMutation -- checks all account chain mismatch queries
 * @returns a mutation that checks all account chain mismatch queries
 */
const useAllAcountChainMismatchMutation = (ctx: {
  onHasAnyMismatch: () => void
}): UseMutationResult<MismatchResult, Error, void> => {
  const { account } = useMismatchContext()
  const queryOptions = useGetMismatchQueryOptions()
  const queryClient = useQueryClient()
  const logger = getLogger()

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
        return {}
      }
      // Fetch via the query so we can cache the result in RQ
      // staleTime is set to 0 so we don't use cached data
      return queryClient.fetchQuery({ ...queryOptions, staleTime: 0 })
    },
    onSuccess: (data) => {
      if (!account.address) {
        return
      }
      let hasMismatch = false
      for (const chainId in data) {
        const result = data[String(chainId)]
        if (result) {
          hasMismatch = true
          logger.info(
            'useMismatchAccount.ts',
            'useAllAcountChainMismatchMutation',
            `mismatch found on chain ${chainId}`,
          )
        }
      }
      if (hasMismatch) {
        ctx.onHasAnyMismatch()
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

/**
 * [private] useGetBulkMismatchQueryOptions -- returns query options for bulk mismatch queries
 * @returns query options with chains already included from context
 */
function useGetMismatchQueryOptions(): MisMatchQueryOptions {
  const { isTestnetModeEnabled, mismatchCallback, account, chains } = useMismatchContext()

  return useMemo(() => {
    const getQueryOptions = getIsMismatchAccountQueryOptions({
      hasMismatch: mismatchCallback,
      isMainnet: !isTestnetModeEnabled,
    })
    return getQueryOptions({
      address: account.address,
      chainIds: chains,
    })
  }, [account.address, chains, isTestnetModeEnabled, mismatchCallback])
}
