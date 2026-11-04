import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { AuthenticatedHeader } from '~/components/AccountDrawer/AuthenticatedHeader'
import { useConnectionStatus } from '~/connection/accounts/hooks'
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
