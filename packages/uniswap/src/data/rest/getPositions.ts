import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError, createPromiseClient } from '@connectrpc/connect'
import {
  InfiniteData,
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  UseInfiniteQueryResult,
  UseQueryResult,
  useInfiniteQuery,
  useQueries,
  useQuery,
} from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import {
  GetPositionRequest,
  GetPositionResponse,
  ListPositionsRequest,
  ListPositionsResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Pair } from '@uniswap/v2-sdk'
import { useMemo } from 'react'
import { uniswapPostTransport } from 'uniswap/src/data/rest/base'
import { SerializedToken } from 'uniswap/src/features/tokens/warnings/slice/types'
import { deserializeToken } from 'uniswap/src/utils/currency'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const positionsClient = createPromiseClient(DataApiService, uniswapPostTransport)

export function useGetPositionsQuery(
  input?: PartialMessage<ListPositionsRequest>,
  disabled?: boolean,
): UseQueryResult<ListPositionsResponse, ConnectError> {
  return useQuery(
    queryOptions({
      queryKey: [ReactQueryCacheKey.ListPositions, input] as const,
      queryFn: () => positionsClient.listPositions(input ?? {}),
      enabled: !!input && !disabled,
      placeholderData: keepPreviousData,
    }),
  )
}

export function useGetPositionsInfiniteQuery(
  input: PartialMessage<ListPositionsRequest>,
  disabled?: boolean,
): UseInfiniteQueryResult<InfiniteData<ListPositionsResponse>, ConnectError> {
  return useInfiniteQuery(
    infiniteQueryOptions({
      queryKey: [ReactQueryCacheKey.ListPositions, 'infinite', input] as const,
      queryFn: ({ pageParam }: { pageParam?: string }) =>
        positionsClient.listPositions({
          ...input,
          pageToken: pageParam,
        }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
      enabled: !disabled,
      placeholderData: keepPreviousData,
    }),
  )
}

export function useGetPositionsForPairs(
  serializedPairs: {
    [chainId: number]: {
      [key: string]: { token0: SerializedToken; token1: SerializedToken }
    }
  },
  account?: Address,
): UseQueryResult<GetPositionResponse, ConnectError>[] {
  const positionsQueryOptions = useMemo(() => {
    return Object.keys(serializedPairs)
      .flatMap((chainId) => {
        const pairsForChain = serializedPairs[Number(chainId)]
        if (!pairsForChain) {
          return []
        }
        return Object.keys(pairsForChain).map((pairId) => {
          const pair = pairsForChain[pairId]
          if (!pair) {
            return undefined
          }
          const [token0, token1] = [deserializeToken(pair.token0), deserializeToken(pair.token1)]
          const pairAddress = Pair.getAddress(token0, token1)
          const requestInput: PartialMessage<GetPositionRequest> | undefined = account
            ? {
                chainId: Number(chainId),
                protocolVersion: ProtocolVersion.V2,
                pairAddress,
                owner: account,
              }
            : undefined

          return queryOptions({
            queryKey: [ReactQueryCacheKey.GetPosition, requestInput] as const,
            queryFn: () => positionsClient.getPosition(requestInput ?? {}),
            enabled: !!requestInput,
          })
        })
      })
      .filter(isDefined)
  }, [serializedPairs, account])

  return useQueries({
    queries: positionsQueryOptions,
  })
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}
