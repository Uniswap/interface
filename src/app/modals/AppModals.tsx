import React from 'react'
import { SwapModal } from 'src/app/modals/SwapModal'
import { TransferTokenModal } from 'src/app/modals/TransferTokenModal'
import { WalletConnectModals } from 'src/components/WalletConnect/WalletConnectModals'

export function AppModals() {
  return (
    <>
      <WalletConnectModals />
      <SwapModal />
      <TransferTokenModal />
    </>
  )
}
