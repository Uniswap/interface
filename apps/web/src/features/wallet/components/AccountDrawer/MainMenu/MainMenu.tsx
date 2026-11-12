import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { useConnectionStatus } from '~/connection/accounts/hooks'
import { AuthenticatedHeader } from '~/features/wallet/components/AccountDrawer/AuthenticatedHeader'
import { WalletModal } from '~/features/wallet/components/WalletModal'
import { MenuStateVariant, useSetMenuCallback } from '~/state/accountDrawer/menuState'

export function MainMenu() {
  const openSettings = useSetMenuCallback(MenuStateVariant.SETTINGS)
  const addresses = useActiveAddresses()

  const { isConnected } = useConnectionStatus()

  if (!isConnected) {
    return <WalletModal />
  }

  return <AuthenticatedHeader {...addresses} openSettings={openSettings} />
}
