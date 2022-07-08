import { Connector } from '@web3-react/types'
import FORTMATIC_ICON_URL from 'assets/images/fortmaticIcon.png'
import { fortmaticConnection } from 'connection'

import Option from './Option'

const BASE_PROPS = {
  color: '#6748FF',
  icon: FORTMATIC_ICON_URL,
  id: 'fortmatic',
}

const FortmaticOption = ({ tryActivation }: { tryActivation: (connector: Connector) => void }) => {
  const isActive = fortmaticConnection.hooks.useIsActive()

  return (
    <Option
      {...BASE_PROPS}
      isActive={isActive}
      onClick={() => tryActivation(fortmaticConnection.connector)}
      header="Fortmatic"
    />
  )
}

export default FortmaticOption
