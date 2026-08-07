import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import type { Register } from 'wagmi'
import { getConnectorsToReconnect } from '~/connection/mountReconnect'

type WagmiConnector = Register['config']['connectors'][number]

function connector(id: string): WagmiConnector {
  return { id } as unknown as WagmiConnector
}

describe('getConnectorsToReconnect', () => {
  const metaMask = connector('metaMaskSDK')
  const safe = connector(CONNECTION_PROVIDER_IDS.SAFE_CONNECTOR_ID)
  const connectors = [metaMask, safe]

  it('reconnects nothing when there is no recentConnectorId and not in an iframe', () => {
    expect(getConnectorsToReconnect({ recentConnectorId: undefined, isIframe: false, connectors })).toEqual([])
  })

  it('reconnects exactly the recentConnectorId connector when present and not in an iframe', () => {
    expect(getConnectorsToReconnect({ recentConnectorId: 'metaMaskSDK', isIframe: false, connectors })).toEqual([
      metaMask,
    ])
  })

  it('reconnects nothing for an unknown/stale recentConnectorId (no matching connector, no throw)', () => {
    expect(
      getConnectorsToReconnect({ recentConnectorId: 'no-longer-registered', isIframe: false, connectors }),
    ).toEqual([])
  })

  it('reconnects the Safe connector when in an iframe with no recentConnectorId', () => {
    expect(getConnectorsToReconnect({ recentConnectorId: undefined, isIframe: true, connectors })).toEqual([safe])
  })

  it('reconnects both the recentConnectorId connector and Safe when in an iframe', () => {
    expect(getConnectorsToReconnect({ recentConnectorId: 'metaMaskSDK', isIframe: true, connectors })).toEqual([
      metaMask,
      safe,
    ])
  })

  it('does not duplicate the Safe connector when it is also the recentConnectorId in an iframe', () => {
    expect(
      getConnectorsToReconnect({
        recentConnectorId: CONNECTION_PROVIDER_IDS.SAFE_CONNECTOR_ID,
        isIframe: true,
        connectors,
      }),
    ).toEqual([safe])
  })
})
