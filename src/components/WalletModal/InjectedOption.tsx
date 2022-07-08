import { Connector } from '@web3-react/types'
import INJECTED_ICON_URL from 'assets/images/arrow-right.svg'
import { injectedConnection } from 'connection'

import { isMobile } from '../../utils/userAgent'
import Option from './Option'

const BASE_PROPS = {
  color: '#010101',
  icon: INJECTED_ICON_URL,
  id: 'injected',
}

const InjectedOption = ({ tryActivation }: { tryActivation: (connector: Connector) => void }) => {
  const isActive = injectedConnection.hooks.useIsActive()

  if (!isMobile) {
    return (
      <Option
        {...BASE_PROPS}
        isActive={isActive}
        header="Injected"
        onClick={() => tryActivation(injectedConnection.connector)}
      />
    )
  } else {
    return null
  }
}

export default InjectedOption
