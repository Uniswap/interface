import { useAccount } from 'hooks/useAccount'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useWalletGetCapabilitiesMutation } from 'state/walletCapabilities/hooks/useWalletGetCapabilitiesMutation'
import { handleResetWalletCapabilitiesState, selectNeedsToCheckCapabilities } from 'state/walletCapabilities/reducer'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccountEffect } from 'wagmi'

/**
 * [public] useWalletCapabilitiesStateEffect -- handles the effect of getting wallet metadata (eg capabilities) for the
 * current account on connect and resets the metadata on disconnect. should only be used once per app.
 */

export function useWalletCapabilitiesStateEffect(): void {
  const dispatch = useAppDispatch()
  const { mutate: getCapabilities, isPending: isCheckingCapabilities } = useWalletGetCapabilitiesMutation()
  const needsToCheckCapabilities = useAppSelector(selectNeedsToCheckCapabilities)

  const account = useAccount()

  const onConnect = useEvent(() => {
    if (!isCheckingCapabilities) {
      getCapabilities()
    }
  })

  const onDisconnect = useEvent(() => {
    dispatch(handleResetWalletCapabilitiesState())
  })

  useAccountEffect({
    onConnect,
    onDisconnect,
  })

  useEffect(() => {
    // only check capabilities if we haven't checked yet and we have an account
    // this is needed if the user has already connected but we haven't checked capabilities yet
    // (eg when the app is updated but they were already connected)
    if (needsToCheckCapabilities && account.address && !isCheckingCapabilities) {
      getCapabilities()
    }
  }, [needsToCheckCapabilities, account.address, getCapabilities, isCheckingCapabilities])
}
