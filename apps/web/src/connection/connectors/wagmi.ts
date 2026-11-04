import { Platform } from '@universe/chains'
import { isE2eTestEnv } from '@universe/environment'
import { connect, getConnectors } from '@wagmi/core'
import { sleep } from 'utilities/src/time/timing'
import { ExternalConnector } from '~/connection/accounts/types'
import { createConnectionService, GetConnectorFn } from '~/connection/services/createConnectionService'
import { ConnectionService } from '~/connection/services/IConnectionService'
import { wagmiConfig } from '~/connection/wagmiConfig'

export async function activateWagmiConnector(connector: ExternalConnector<Platform.EVM>): Promise<void> {
  const wagmiConnector = getConnectors(wagmiConfig).find((c) => c.id === connector.externalLibraryId)

  if (!wagmiConnector) {
    throw new Error(`Wagmi connector not found for id ${connector.id} / ${connector.externalLibraryId}`)
  }

  // This is a hack to ensure the connection runs in playwright
  // TODO(WEB-4173): Look into removing setTimeout connection.connect({ connector })
  if (isE2eTestEnv()) {
    await sleep(1)
  }

  await connect(wagmiConfig, { connector: wagmiConnector })
  return
}

export function getEVMConnectionService(getConnector: GetConnectorFn): ConnectionService {
  return createConnectionService({ platform: Platform.EVM, getConnector, activateConnector: activateWagmiConnector })
}
