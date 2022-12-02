import { Connector } from '@web3-react/types'
import UNIWALLET_ICON_URL from 'assets/images/uniwallet.png'
import Badge, { BadgeVariant } from 'components/Badge'
import { ConnectionType, walletConnectConnection } from 'connection'
import { getConnectionName } from 'connection/utils'
import { ThemedText } from 'theme'

import Option from './Option'

const BASE_PROPS = {
  color: '#4196FC',
  icon: UNIWALLET_ICON_URL,
  id: 'uniwallet',
}

export function UniwalletOption({ tryActivation }: { tryActivation: (connector: Connector) => void }) {
  const isActive = walletConnectConnection.hooks.useIsActive()
  return (
    <Option
      {...BASE_PROPS}
      isActive={isActive}
      onClick={() => tryActivation(walletConnectConnection.connector)}
      header={getConnectionName(ConnectionType.UNIWALLET)}
    >
      <Badge variant={BadgeVariant.BRANDED}>
        <ThemedText.UtilityBadge>New</ThemedText.UtilityBadge>
      </Badge>
    </Option>
  )
}
