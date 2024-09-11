import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import {
  SIMPLE_HASH_API_CACHE_KEY,
  SimpleHashNftsRequest,
  SimpleHashNftsResponse,
  fetchNft,
} from 'uniswap/src/data/apiClients/simpleHashApi/SimpleHashApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'

export function useSimpleHashNft({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<SimpleHashNftsRequest, SimpleHashNftsResponse>): UseQueryResult<SimpleHashNftsResponse> {
  const queryKey = [SIMPLE_HASH_API_CACHE_KEY, '/nfts/ethereum', params]

  return useQuery<SimpleHashNftsResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof fetchNft> => await fetchNft(params) : skipToken,
    ...rest,
  })
}
