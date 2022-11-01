import React, { useCallback } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { WalletConnectRequestModal } from 'src/components/WalletConnect/RequestModal/WalletConnectRequestModal'
import { WalletConnectSwitchChainModal } from 'src/components/WalletConnect/RequestModal/WalletConnectSwitchChainModal'
import { WalletConnectModal } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { EthMethod } from 'src/features/walletConnect/types'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { removePendingSession, removeRequest } from 'src/features/walletConnect/walletConnectSlice'

export function WalletConnectModals() {
  const activeAccount = useActiveAccount()
  const dispatch = useAppDispatch()

  const { pendingRequests, modalState, pendingSession } = useWalletConnect(activeAccount?.address)

  const currRequest = pendingRequests[0] ?? null

  const onCloseRequest = () => {
    if (!currRequest || !activeAccount) return
    dispatch(
      removeRequest({ requestInternalId: currRequest.internalId, account: activeAccount.address })
    )
  }

  const onClose = useCallback(() => {
    dispatch(removePendingSession())
    dispatch(closeModal({ name: ModalName.WalletConnectScan }))
  }, [dispatch])

  return (
    <>
      {(modalState.isOpen || Boolean(pendingSession)) && (
        <WalletConnectModal
          isVisible
          initialScreenState={modalState.initialState}
          pendingSession={pendingSession}
          onClose={onClose}
        />
      )}
      {currRequest &&
        (currRequest.type === EthMethod.SwitchChain ? (
          <WalletConnectSwitchChainModal isVisible request={currRequest} onClose={onCloseRequest} />
        ) : (
          <WalletConnectRequestModal isVisible request={currRequest} onClose={onCloseRequest} />
        ))}
    </>
  )
}
