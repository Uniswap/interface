import { type PlainMessage } from '@bufbuild/protobuf'
import type {
  GetEarnPositionResponse,
  ListEarnPositionsResponse,
  ListEarnVaultsResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import {
  getEarnPositionQueryOptions as getEarnPositionQueryOptionsWithClient,
  getListEarnPositionsQueryOptions as getListEarnPositionsQueryOptionsWithClient,
  getListEarnVaultsQueryOptions as getListEarnVaultsQueryOptionsWithClient,
  type GetEarnPositionInput,
  type ListEarnPositionsInput,
  type ListEarnVaultsInput,
} from '@universe/data-api'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'

export function getListEarnVaultsQueryOptions<TSelectData = PlainMessage<ListEarnVaultsResponse>>(
  input: ListEarnVaultsInput<TSelectData>,
): ReturnType<typeof getListEarnVaultsQueryOptionsWithClient<TSelectData>> {
  return getListEarnVaultsQueryOptionsWithClient(dataApiServiceClientV2, input)
}

export function getListEarnPositionsQueryOptions<TSelectData = PlainMessage<ListEarnPositionsResponse>>(
  input: ListEarnPositionsInput<TSelectData>,
): ReturnType<typeof getListEarnPositionsQueryOptionsWithClient<TSelectData>> {
  return getListEarnPositionsQueryOptionsWithClient(dataApiServiceClientV2, input)
}

export function getEarnPositionQueryOptions<TSelectData = PlainMessage<GetEarnPositionResponse>>(
  input: GetEarnPositionInput<TSelectData>,
): ReturnType<typeof getEarnPositionQueryOptionsWithClient<TSelectData>> {
  return getEarnPositionQueryOptionsWithClient(dataApiServiceClientV2, input)
}
