import { injected, injectedHooks as hooks } from 'connectors'

import { SUPPORTED_WALLETS } from '../../constants/wallet'
import Option from './Option'

const { useIsActive } = hooks
const { name, iconURL, href, color } = SUPPORTED_WALLETS.METAMASK

export default function MetaMaskCard() {
  const isActive = useIsActive()

  const onClick = () => injected.activate()

  return (
    <Option
      onClick={onClick}
      id="connect-metamask"
      isActive={isActive}
      color={color}
      link={href}
      header={name}
      subheader={null}
      icon={iconURL}
    />
  )
}
