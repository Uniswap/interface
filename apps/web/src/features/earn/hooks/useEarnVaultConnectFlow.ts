import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useConnectionStatus } from '~/features/accounts/store/hooks'

// Coordinates the "close earn modal → open wallet drawer → reopen modal after connect" flow.
// Caller owns the selected vault state and passes both the current value and its setter; the
// hook returns an `onConnectWallet` handler to wire to the Connect Wallet button. The reopen
// is keyed off `Platform.EVM` becoming connected; if the user dismisses the drawer without
// connecting, the pending vault is dropped.
export function useEarnVaultConnectFlow<TVault>({
  selectedVault,
  setSelectedVault,
}: {
  selectedVault: TVault | null
  setSelectedVault: (vault: TVault | null) => void
}): { onConnectWallet: () => void } {
  const { isConnected } = useConnectionStatus(Platform.EVM)
  const accountDrawer = useAccountDrawer()
  const [pendingVault, setPendingVault] = useState<TVault | null>(null)

  useEffect(() => {
    if (isConnected && pendingVault) {
      setSelectedVault(pendingVault)
      setPendingVault(null)
    }
  }, [isConnected, pendingVault, setSelectedVault])

  useEffect(() => {
    if (pendingVault && !accountDrawer.isOpen && !isConnected) {
      setPendingVault(null)
    }
  }, [accountDrawer.isOpen, isConnected, pendingVault])

  const onConnectWallet = useCallback(() => {
    if (!selectedVault) {
      return
    }
    setPendingVault(selectedVault)
    setSelectedVault(null)
    accountDrawer.open()
  }, [accountDrawer, selectedVault, setSelectedVault])

  return { onConnectWallet }
}
