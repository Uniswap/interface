import { Connector } from '@web3-react/types'
import FORTMATIC_ICON_URL from 'assets/images/fortmaticIcon.png'
import { ConnectionType, fortmaticConnection } from 'connection'
import { getConnectionName, getIsCoinbaseWallet, getIsMetaMask } from 'connection/utils'
import { isMobile } from 'utils/userAgent'

import Option from './Option'

const BASE_PROPS = {
  color: '#6748FF',
  icon: FORTMATIC_ICON_URL,
  id: 'fortmatic',
}

const FortmaticOption = ({ tryActivation }: { tryActivation: (connector: Connector) => void }) => {
  const isActive = fortmaticConnection.hooks.useIsActive()

  const isMetaMask = getIsMetaMask()
  const isCoinbaseWallet = getIsCoinbaseWallet()
  if (isMobile && (isMetaMask || isCoinbaseWallet)) return null

  return (
    <Option
      {...BASE_PROPS}
      isActive={isActive}
      onClick={() => tryActivation(fortmaticConnection.connector)}
      header={getConnectionName(ConnectionType.FORTMATIC)}
    />
  )
}

export default FortmaticOption
