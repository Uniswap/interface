import { Connector } from '@web3-react/types'
import METAMASK_ICON_URL from 'assets/images/metamask.png'
import { ConnectionType, injectedConnection } from 'connection'
import { getConnectionName } from 'connection/utils'

import { isMobile } from '../../utils/userAgent'
import Option from './Option'

const BASE_PROPS = {
  color: '#E8831D',
  icon: METAMASK_ICON_URL,
  id: 'metamask',
}

const MetaMaskOption = ({ tryActivation }: { tryActivation: (connector: Connector) => void }) => {
  const isActive = injectedConnection.hooks.useIsActive()
  const isMetaMask = !!window.ethereum?.isMetaMask

  if (!isMobile && isMetaMask) {
    return (
      <Option
        {...BASE_PROPS}
        isActive={isActive}
        header={getConnectionName(ConnectionType.INJECTED)}
        onClick={() => tryActivation(injectedConnection.connector)}
      />
    )
  } else {
    return null
  }
}

export default MetaMaskOption
