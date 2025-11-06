import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAccount } from 'hooks/useAccount'
import ms from 'ms'
import { useAppDispatch } from 'state/hooks'
import { handleGetCapabilities } from 'state/walletCapabilities/lib/handleGetCapabilities'
import { setCapabilitiesByChain, setCapabilitiesNotSupported } from 'state/walletCapabilities/reducer'
import { getLogger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * [public] useWalletGetCapabilitiesMutation -- gets the wallet capabilities for the current account
 * @returns a mutation that gets the wallet capabilities for the current account
 */
export function useWalletGetCapabilitiesMutation() {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()
  const logger = getLogger()
  const isWalletGetCapabilitiesDisabled = useIsWalletGetCapabilitiesDisabled()
  const account = useAccount()

  // use query cache to dedupe and cache the capabilities for 5 minutes
  const fetchCapabilities = useEvent(async () =>
    queryClient.ensureQueryData({
      ...getCapabilitiesQueryOptions({
        address: account.address,
      }),
      revalidateIfStale: true,
    }),
  )
  return useMutation({
    mutationFn: isWalletGetCapabilitiesDisabled ? () => Promise.resolve(null) : fetchCapabilities,
    onSuccess: (data) => {
      if (data) {
        dispatch(setCapabilitiesByChain(data))
      } else {
        dispatch(setCapabilitiesNotSupported())
      }
    },
    onError: (error) => {
      logger.error(error, {
        tags: {
          file: 'useWalletCapabilities.ts',
          function: 'useWalletGetCapabilitiesMutation',
        },
      })
      dispatch(setCapabilitiesNotSupported())
    },
    retry: 3,
  })
}

function useIsWalletGetCapabilitiesDisabled(): boolean {
  return useFeatureFlag(FeatureFlags.ForceDisableWalletGetCapabilities)
}

const getCapabilitiesQueryOptions = (ctx: { address?: string }) => {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.WalletGetCapabilities, ctx.address],
    queryFn: () => handleGetCapabilities(),
    staleTime: ms('1m'),
    gcTime: ms('5m'),
    enabled: !!ctx.address,
  })
}
