import { createPromiseClient, type PromiseClient, type Transport } from '@connectrpc/connect'
import { SessionService } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_connect'

type SessionServiceClient = PromiseClient<typeof SessionService>

function createSessionClient(ctx: { transport: Transport }): PromiseClient<typeof SessionService> {
  return createPromiseClient(SessionService, ctx.transport)
}

export { type SessionServiceClient, createSessionClient }
