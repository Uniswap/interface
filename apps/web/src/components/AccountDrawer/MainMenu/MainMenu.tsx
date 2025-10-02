import AuthenticatedHeader from 'components/AccountDrawer/AuthenticatedHeader'
import { MenuStateVariant, useSetMenuCallback } from 'components/AccountDrawer/menuState'
import WalletModal from 'components/WalletModal'
import { useConnectionStatus } from 'features/accounts/store/hooks'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'

export function MainMenu() {
  const openSettings = useSetMenuCallback(MenuStateVariant.SETTINGS)
  const addresses = useActiveAddresses()

  const { isConnected } = useConnectionStatus()

  if (!isConnected) {
    return <WalletModal />
  }

  return <AuthenticatedHeader {...addresses} openSettings={openSettings} />
}
