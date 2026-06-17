import type { HexString } from '@universe/encoding'
import { http, type Address } from 'viem'
import type { RpcUserOperation } from 'viem/account-abstraction'

export interface RequestGasAndPaymasterAndDataParams {
  entryPoint: Address
  dummySignature: HexString
  userOperation: RpcUserOperation<'0.8'>
  sponsorship: string
  chainIdHex: HexString
  overrides: Record<string, unknown>
}

export type PaymasterResult = Partial<RpcUserOperation<'0.8'>>

export interface PaymasterClient {
  requestGasAndPaymasterAndData(params: RequestGasAndPaymasterAndDataParams): Promise<PaymasterResult | undefined>
}

export function createAlchemyPaymasterClient(ctx: { getPaymasterUrl: () => string }): PaymasterClient {
  return {
    requestGasAndPaymasterAndData: async (params) => {
      const transport = http(ctx.getPaymasterUrl(), {
        fetchOptions: { credentials: 'omit' },
        retryCount: 0,
      })({})

      return (await transport.request({
        method: 'alchemy_requestGasAndPaymasterAndData',
        params: [params],
      })) as PaymasterResult | undefined
    },
  }
}
