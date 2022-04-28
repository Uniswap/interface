import { walletConnect, walletConnectHooks as hooks } from 'connectors'

import { SUPPORTED_WALLETS } from '../../constants/wallet'
import Option from './Option'

const { useIsActive } = hooks
const { name, iconURL, href, color } = SUPPORTED_WALLETS.WALLET_CONNECT

export default function WalletConnectCard() {
  const isActive = useIsActive()

  const onClick = () => walletConnect.activate()

  return (
    <Option
      onClick={onClick}
      id="connect-wallet-connect"
      isActive={isActive}
      color={color}
      link={href}
      header={name}
      subheader={null}
      icon={iconURL}
    />
  )
}
