import { Trans } from '@lingui/macro'
import { Connector } from '@web3-react/types'
import INJECTED_ICON_URL from 'assets/images/arrow-right.svg'
import METAMASK_ICON_URL from 'assets/images/metamask.png'
import { ConnectionType, injectedConnection } from 'connection'
import { getConnectionName, getIsInjected, getIsMetaMask } from 'connection/utils'

import { isMobile } from '../../utils/userAgent'
import Option from './Option'

const INJECTED_PROPS = {
  color: '#010101',
  icon: INJECTED_ICON_URL,
  id: 'injected',
}

const METAMASK_PROPS = {
  color: '#E8831D',
  icon: METAMASK_ICON_URL,
  id: 'metamask',
}

const InjectedOption = ({ tryActivation }: { tryActivation: (connector: Connector) => void }) => {
  const isActive = injectedConnection.hooks.useIsActive()
  const isMetaMask = getIsMetaMask()
  const isInjected = getIsInjected()

  const props = {
    isActive,
    header: getConnectionName(ConnectionType.INJECTED, isMetaMask),
    onClick() {
      tryActivation(injectedConnection.connector)
    },
  }

  if (!isInjected && !isMobile) {
    return <Option {...METAMASK_PROPS} header={<Trans>Install MetaMask</Trans>} link={'https://metamask.io/'} />
  } else if (isMetaMask) {
    return <Option {...METAMASK_PROPS} {...props} />
  } else if (!isMobile) {
    return <Option {...INJECTED_PROPS} {...props} />
  } else {
    return null
  }
}

export default InjectedOption
