import { connections, eip6963Connection } from 'connection'
import { useInjectedProviderDetails } from 'connection/eip6963/providers'
import { Connection, ConnectionType, RecentConnectionMeta } from 'connection/types'
import { shouldUseDeprecatedInjector } from 'connection/utils'
import { useEip6963Enabled } from 'featureFlags/flags/eip6963'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'

import Option from './Option'

function useEIP6963Connections() {
  const eip6963Injectors = useInjectedProviderDetails()
  const eip6963Enabled = useEip6963Enabled()

  return useMemo(() => {
    if (!eip6963Enabled) return { eip6963Connections: [], showDeprecatedMessage: false }

    const eip6963Connections = eip6963Injectors.flatMap((injector) => eip6963Connection.wrap(injector.info) ?? [])

    // Displays ui to activate window.ethereum for edge-case where we detect window.ethereum !== one of the eip6963 providers
    const showDeprecatedMessage = eip6963Connections.length > 0 && shouldUseDeprecatedInjector(eip6963Injectors)

    return { eip6963Connections, showDeprecatedMessage }
  }, [eip6963Injectors, eip6963Enabled])
}

function mergeConnections(connections: Connection[], eip6963Connections: Connection[]) {
  const hasEip6963Connections = eip6963Connections.length > 0
  const displayedConnections = connections.filter((c) => c.shouldDisplay())

  if (!hasEip6963Connections) return displayedConnections

  const allConnections = [...displayedConnections.filter((c) => c.type !== ConnectionType.INJECTED)]
  // By default, injected options should appear second in the list (below Uniswap wallet)
  allConnections.splice(1, 0, ...eip6963Connections)

  return allConnections
}

// TODO(WEB-3244) Improve ordering logic to make less brittle, as it is spread across connections/index.ts and here
/** Returns an array of all connection Options that should be displayed, where the recent connection is first in the array */
function getOrderedConnections(connections: Connection[], recentConnection: RecentConnectionMeta | undefined) {
  const list: JSX.Element[] = []
  for (const connection of connections) {
    if (!connection.shouldDisplay()) continue
    const { name, rdns } = connection.getProviderInfo()

    // For eip6963 injectors, we need to check rdns in addition to connection type to ensure it's the recent connection
    const isRecent = connection.type === recentConnection?.type && (!rdns || rdns === recentConnection.rdns)

    const option = <Option key={name} connection={connection} isRecent={isRecent} />

    // Place recent connection at top of list
    isRecent ? list.unshift(option) : list.push(option)
  }

  return list
}

export function useOrderedConnections() {
  const { eip6963Connections, showDeprecatedMessage } = useEIP6963Connections()
  const recentConnection = useAppSelector((state) => state.user.recentConnectionMeta)
  const orderedConnections = useMemo(() => {
    const allConnections = mergeConnections(connections, eip6963Connections)
    return getOrderedConnections(allConnections, recentConnection)
  }, [eip6963Connections, recentConnection])

  return { orderedConnections, showDeprecatedMessage }
}
