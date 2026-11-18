import {
  type ConvertFiatInput,
  getConvertFiatQueryOptions as getConvertFiatQueryOptionsWithClient,
} from '@universe/data-api'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'

export function getConvertFiatQueryOptions(
  input: Omit<ConvertFiatInput, 'refetchInterval'>,
): ReturnType<typeof getConvertFiatQueryOptionsWithClient> {
  return getConvertFiatQueryOptionsWithClient(dataApiServiceClientV2, {
    ...input,
    refetchInterval: PollingInterval.Slow,
  })
}
