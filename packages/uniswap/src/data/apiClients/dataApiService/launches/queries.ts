import type { PlainMessage } from '@bufbuild/protobuf'
import type { ListLaunchpadsResponse } from '@uniswap/client-launches/dist/launches/v1/api_pb'
import {
  getListLaunchesQueryOptions as getListLaunchesQueryOptionsWithClient,
  getListLaunchpadsQueryOptions as getListLaunchpadsQueryOptionsWithClient,
  type ListLaunchesInput,
  type ListLaunchpadsInput,
} from '@universe/data-api'
import { launchServiceClient } from 'uniswap/src/data/apiClients/dataApiService/clients/LaunchServiceClient'

export function getListLaunchpadsQueryOptions<TSelectData = PlainMessage<ListLaunchpadsResponse> | undefined>(
  input: ListLaunchpadsInput<TSelectData>,
): ReturnType<typeof getListLaunchpadsQueryOptionsWithClient<TSelectData>> {
  return getListLaunchpadsQueryOptionsWithClient(launchServiceClient, input)
}

export function getListLaunchesQueryOptions(
  input: ListLaunchesInput,
): ReturnType<typeof getListLaunchesQueryOptionsWithClient> {
  return getListLaunchesQueryOptionsWithClient(launchServiceClient, input)
}
