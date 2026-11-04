import type { Platform } from '@universe/chains'
import type { ExternalConnector } from '~/connection/accounts/types'
import { ignoreExpectedConnectionErrors } from '~/connection/connectors/utils'
import type { ConnectionService } from '~/connection/services/IConnectionService'

export type GetConnectorFn = <P extends Platform>(connectorId: string, platform: P) => ExternalConnector<P> | undefined

interface CreateConnectionServiceContext<P extends Platform> {
  platform: P
  getConnector: GetConnectorFn
  activateConnector: (connector: ExternalConnector<P>) => Promise<void>
}

export function createConnectionService<P extends Platform>(ctx: CreateConnectionServiceContext<P>): ConnectionService {
  return {
    connect: async (params) => {
      try {
        const connectorId = params.wallet.connectorIds[ctx.platform]
        if (!connectorId) {
          return { connected: false }
        }
        const connector = ctx.getConnector(connectorId, ctx.platform)
        if (!connector) {
          return { connected: false }
        }
        await ctx.activateConnector(connector)
        return { connected: true }
      } catch (error) {
        if (ignoreExpectedConnectionErrors(error)) {
          return { connected: false }
        }
        throw error
      }
    },
  }
}
