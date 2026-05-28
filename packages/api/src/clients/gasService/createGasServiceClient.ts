import { type PartialMessage } from '@bufbuild/protobuf'
import { type PromiseClient } from '@connectrpc/connect'
import { type UniRpcService } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_connect'
import type {
  EstimateGasFeeRequest,
  EstimateGasFeeResponse,
} from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'

export interface GasServiceClientContext {
  rpcClient: PromiseClient<typeof UniRpcService>
}

export interface GasServiceClient {
  estimateGasFee: (params: PartialMessage<EstimateGasFeeRequest>) => Promise<EstimateGasFeeResponse>
}

export function createGasServiceClient({ rpcClient }: GasServiceClientContext): GasServiceClient {
  return {
    estimateGasFee: (params): Promise<EstimateGasFeeResponse> => rpcClient.estimateGasFee(params),
  }
}
