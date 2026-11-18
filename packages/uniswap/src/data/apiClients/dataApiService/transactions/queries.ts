import {
  getListTransactionsQueryOptions as getListTransactionsQueryOptionsWithClient,
  type ListTransactionsInput,
} from '@universe/data-api'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'

export function getListTransactionsQueryOptions(
  input: ListTransactionsInput,
): ReturnType<typeof getListTransactionsQueryOptionsWithClient> {
  return getListTransactionsQueryOptionsWithClient(dataApiServiceClientV2, input)
}
