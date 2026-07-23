import { type PartialMessage } from '@bufbuild/protobuf'
import { type PromiseClient } from '@connectrpc/connect'
import { type DataApiService } from '@uniswap/client-data-api/dist/data/v2/api_connect'
import {
  ConvertFiatRequest,
  ConvertFiatResponse,
  GetWalletNftsRequest,
  GetWalletNftsResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'

export interface DataApiServiceClientContext {
  rpcClient: PromiseClient<typeof DataApiService>
}

export interface DataApiServiceClientV2 {
  getWalletNfts: (params: PartialMessage<GetWalletNftsRequest>) => Promise<GetWalletNftsResponse>
  convertFiat: (params: PartialMessage<ConvertFiatRequest>) => Promise<ConvertFiatResponse>
}

export function createDataApiServiceClientV2({ rpcClient }: DataApiServiceClientContext): DataApiServiceClientV2 {
  return {
    getWalletNfts: (params): Promise<GetWalletNftsResponse> => rpcClient.getWalletNfts(params),
    convertFiat: (params): Promise<ConvertFiatResponse> => rpcClient.convertFiat(params),
  }
}
