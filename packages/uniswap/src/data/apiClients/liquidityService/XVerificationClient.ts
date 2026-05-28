import { createPromiseClient } from '@connectrpc/connect'
import { XVerificationService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/x_verification_connect'
import { createXVerificationServiceClient } from '@universe/api'
import { liquidityServiceTransport } from 'uniswap/src/data/apiClients/liquidityService/base'

export const XVerificationClient = createXVerificationServiceClient({
  rpcClient: createPromiseClient(XVerificationService, liquidityServiceTransport),
})
