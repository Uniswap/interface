import { Trans } from '@lingui/macro'
import { Connector } from '@web3-react/types'
import INJECTED_ICON_URL from 'assets/images/arrow-right.svg'
import METAMASK_ICON_URL from 'assets/images/metamask.png'
import { ConnectionType, injectedConnection } from 'connection'
import { getConnectionName, getIsCoinbaseWallet, getIsInjected, getIsMetaMask } from 'connection/utils'

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
  const isInjected = getIsInjected()
  const isMetaMask = getIsMetaMask()
  const isCoinbaseWallet = getIsCoinbaseWallet()

  const props = {
    isActive,
    header: getConnectionName(ConnectionType.INJECTED, isMetaMask),
    onClick() {
      tryActivation(injectedConnection.connector)
    },
  }

  if (isMobile) {
    if (isCoinbaseWallet) {
      return null
    }

    if (isMetaMask) {
      return <Option {...METAMASK_PROPS} {...props} />
    }

    return null
  }

  if (!isInjected) {
    return <Option {...METAMASK_PROPS} header={<Trans>Install MetaMask</Trans>} link={'https://metamask.io/'} />
  }

  return <Option {...METAMASK_PROPS} {...props} />
}

export default InjectedOption
