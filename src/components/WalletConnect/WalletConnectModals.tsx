import React from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { WalletConnectRequestModal } from 'src/components/WalletConnect/RequestModal/WalletConnectRequestModal'
import { WalletConnectModal } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { removePendingSession, removeRequest } from 'src/features/walletConnect/walletConnectSlice'

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

  const onClose = () => {
    dispatch(removePendingSession())
    dispatch(closeModal({ name: ModalName.WalletConnectScan }))
  }

  return (
    <>
      {modalState.isOpen && (
        <WalletConnectModal
          initialScreenState={modalState.initialState}
          isVisible={true}
          onClose={onClose}
        />
      )}
      {currRequest && (
        <WalletConnectRequestModal isVisible request={currRequest} onClose={onCloseRequest} />
      )}
    </>
  )
}
