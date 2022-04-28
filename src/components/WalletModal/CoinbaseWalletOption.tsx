import { coinbaseWallet, coinbaseWalletHooks as hooks } from 'connectors'

import { SUPPORTED_WALLETS } from '../../constants/wallet'
import Option from './Option'

const { useIsActive } = hooks
const { name, iconURL, href, color } = SUPPORTED_WALLETS.COINBASE_WALLET

export default function CoinbaseWalletCard() {
  const isActive = useIsActive()

  const onClick = () => coinbaseWallet.activate()

  return (
    <Option
      onClick={onClick}
      id="connect-coinbase"
      isActive={isActive}
      color={color}
      link={href}
      header={name}
      subheader={null}
      icon={iconURL}
    />
  )
}
