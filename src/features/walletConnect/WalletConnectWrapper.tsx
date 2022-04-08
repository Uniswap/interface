import React, { PropsWithChildren } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { removeRequest } from 'src/features/walletConnect/walletConnectSlice'
import { WCRequestModal } from 'src/features/walletConnect/WCRequestModal'

export function WalletConnectWrapper({ children }: PropsWithChildren<any>) {
  const activeAccount = useActiveAccount()
  const dispatch = useAppDispatch()

  const { pendingRequests } = useWalletConnect(activeAccount?.address)

  const currRequest = pendingRequests[0] ?? null

  const onClose = () => {
    if (!currRequest || !activeAccount) return
    dispatch(
      removeRequest({ requestInternalId: currRequest.internalId, account: activeAccount.address })
    )
  }

  return (
    <>
      <WCRequestModal isVisible={Boolean(currRequest)} request={currRequest} onClose={onClose} />
      {children}
    </>
  )
}
