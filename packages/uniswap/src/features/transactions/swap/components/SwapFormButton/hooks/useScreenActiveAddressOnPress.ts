import { toScreenInput, useScreenAddressOnPress } from '@universe/compliance'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { useSwapFormWarningStoreActions } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/useSwapFormWarningStore'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Screens the active address when the user presses, and runs `onClear` only once it
 * comes back clean; a blocked address opens the blocked-address modal instead.
 *
 * Fails open, so a compliance outage continues to `onClear` — this is an early warning
 * for the user, not the enforcement point. `/swap` and `/order` screen server-side.
 *
 * Needs no single-flight guard: `mutate` runs the latest press's continuation only, and
 * the fetch underneath dedupes by address, so a double press is one request and one
 * continuation. On mobile and the extension this is a cache hit, since they still screen
 * the same address at render.
 */
export function useScreenActiveAddressOnPress(): (onClear: () => void) => void {
  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
  const address = useActiveAddress(chainId)
  const { handleShowBlockedAddressModal } = useSwapFormWarningStoreActions()
  const { mutate: screenAddress } = useScreenAddressOnPress()

  return useEvent((onClear: () => void) => {
    screenAddress(toScreenInput(address, chainId), {
      onSuccess: (isBlocked) => {
        if (isBlocked) {
          handleShowBlockedAddressModal(address)
        } else {
          onClear()
        }
      },
    })
  })
}
