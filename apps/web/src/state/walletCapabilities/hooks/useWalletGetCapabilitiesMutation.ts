import { useMutation } from '@tanstack/react-query'
import { useAppDispatch } from 'state/hooks'
import { handleGetCapabilities } from 'state/walletCapabilities/lib/handleGetCapabilities'
import { setCapabilitiesByChain, setCapabilitiesNotSupported } from 'state/walletCapabilities/reducer'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { getLogger } from 'utilities/src/logger/logger'

/**
 * [public] useWalletGetCapabilitiesMutation -- gets the wallet capabilities for the current account
 * @returns a mutation that gets the wallet capabilities for the current account
 */
export function useWalletGetCapabilitiesMutation() {
  const dispatch = useAppDispatch()
  const logger = getLogger()
  const isWalletGetCapabilitiesDisabled = useIsWalletGetCapabilitiesDisabled()
  return useMutation({
    mutationFn: isWalletGetCapabilitiesDisabled ? () => Promise.resolve(null) : handleGetCapabilities,
    onSuccess: (data) => {
      if (data) {
        dispatch(setCapabilitiesByChain(data))
      } else {
        dispatch(setCapabilitiesNotSupported())
      }
    },
    onError: (error) => {
      logger?.error(error, {
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
