import { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { ConnectionType } from 'connectors'
import { getConnectorForConnectionType, getHooksForConnectionType } from 'connectors/utils'
import { useMemo } from 'react'
import { BACKFILLABLE_WALLETS } from 'state/connection/constants'
import { useAppSelector } from 'state/hooks'

const SELECTABLE_WALLETS = [...BACKFILLABLE_WALLETS, ConnectionType.FORTMATIC]

interface Connection {
  connector: Connector
  hooks: Web3ReactHooks
}

function getConnectionForConnectionType(connectionType: ConnectionType): Connection {
  return {
    connector: getConnectorForConnectionType(connectionType),
    hooks: getHooksForConnectionType(connectionType),
  }
}

export default function useConnectors() {
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  return useMemo(() => {
    const connections: Connection[] = []

    // Always attempt to use to Gnosis Safe first, as we can't know if we're in a SafeContext.
    connections.push(getConnectionForConnectionType(ConnectionType.GNOSIS_SAFE))

    // Add the `selectedWallet` to the top so it's prioritized, then add the other selectable wallets.
    if (selectedWallet) {
      connections.push(getConnectionForConnectionType(selectedWallet))
    }
    connections.push(
      ...SELECTABLE_WALLETS.filter((wallet) => wallet !== selectedWallet).map(getConnectionForConnectionType)
    )

    // Add network connection last as it should be the fallback.
    connections.push(getConnectionForConnectionType(ConnectionType.NETWORK))

    // Convert to web3-react's representation of connectors.
    const web3Connectors: [Connector, Web3ReactHooks][] = connections.map(({ connector, hooks }) => [connector, hooks])
    return web3Connectors
  }, [selectedWallet])
}
