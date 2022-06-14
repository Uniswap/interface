import React from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { WalletConnectRequestModal } from 'src/components/WalletConnect/RequestModal/WalletConnectRequestModal'
import {
  WalletConnectModal,
  WalletConnectModalState,
} from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import {
  removePendingSession,
  removeRequest,
  setWalletConnectModalState,
} from 'src/features/walletConnect/walletConnectSlice'

export function WalletConnectModals() {
  const activeAccount = useActiveAccount()
  const dispatch = useAppDispatch()

  const { pendingRequests, modalState } = useWalletConnect(activeAccount?.address)

  const currRequest = pendingRequests[0] ?? null

  const onCloseRequest = () => {
    if (!currRequest || !activeAccount) return
    dispatch(
      removeRequest({ requestInternalId: currRequest.internalId, account: activeAccount.address })
    )
  }

  return (
    <>
      {modalState !== WalletConnectModalState.Hidden && (
        <WalletConnectModal
          initialScreenState={modalState}
          isVisible={true}
          onClose={() => {
            dispatch(removePendingSession())
            dispatch(setWalletConnectModalState({ modalState: WalletConnectModalState.Hidden }))
          }}
        />
      )}
      {currRequest && (
        <WalletConnectRequestModal isVisible request={currRequest} onClose={onCloseRequest} />
      )}
    </>
  )
}
