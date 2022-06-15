import React from 'react'
import { WalletConnectModals } from 'src/components/WalletConnect/WalletConnectModals'
import { SwapModal } from 'src/app/modals/SwapModal'

export function AppModals() {
  return (
    <>
      <WalletConnectModals />
      <SwapModal />
    </>
  )
}
