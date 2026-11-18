import {
  getGetWalletNftsQueryOptions as getGetWalletNftsQueryOptionsWithClient,
  type GetWalletNftsInput,
} from '@universe/data-api'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'

export function getGetWalletNftsQueryOptions(
  input: GetWalletNftsInput,
): ReturnType<typeof getGetWalletNftsQueryOptionsWithClient> {
  return getGetWalletNftsQueryOptionsWithClient(dataApiServiceClientV2, input)
}
