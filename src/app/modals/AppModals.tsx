import React from 'react'
import { ExperimentsModal } from 'src/app/modals/ExperimentsModal'
import { SwapModal } from 'src/app/modals/SwapModal'
import { TransferTokenModal } from 'src/app/modals/TransferTokenModal'
import { WalletConnectModals } from 'src/components/WalletConnect/WalletConnectModals'
import { LockScreenModal } from 'src/features/authentication/LockScreenModal'

export function AppModals() {
  return (
    <>
      <WalletConnectModals />
      <SwapModal />
      <LockScreenModal />
      <TransferTokenModal />
      <ExperimentsModal />
    </>
  )
}
