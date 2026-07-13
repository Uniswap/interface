import { PartialMessage, PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { ConnectError, createPromiseClient } from '@connectrpc/connect'
import {
  InfiniteData,
  keepPreviousData,
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
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'

const positionsClient = createPromiseClient(DataApiService, uniswapPostTransport)

export function useGetPositionsQuery(
  input?: PartialMessage<ListPositionsRequest>,
  disabled?: boolean,
): UseQueryResult<PlainMessage<ListPositionsResponse>, ConnectError> {
  return useQuery(
    persistableQueryOptions({
      queryKey: [ReactQueryCacheKey.ListPositions, input] as const,
      // toPlainMessage strips the Message prototype so the value survives disk persistence
      // (a raw Message serializes to protobuf JSON wire format and restores unparseable).
      queryFn: async () => toPlainMessage(await positionsClient.listPositions(input ?? {})),
      enabled: !!input && !disabled,
      placeholderData: keepPreviousData,
    }),
  )
}

interface InfinitePositionsQueryOptions {
  disabled?: boolean
  /**
   * When set, the query refetches on this interval (ms). Defaults to undefined (no polling).
   * A useInfiniteQuery refetch re-fetches all currently-loaded pages, and polling only runs
   * while the query is enabled and the document is foreground (refetchIntervalInBackground
   * defaults to false), so callers should gate `disabled` to the surface that needs it.
   */
  refetchInterval?: number
}

export function useGetPositionsInfiniteQuery(
  input: PartialMessage<ListPositionsRequest>,
  options?: InfinitePositionsQueryOptions,
): UseInfiniteQueryResult<InfiniteData<ListPositionsResponse>, ConnectError> {
  const { disabled, refetchInterval } = options ?? {}
  // NOTE: this infinite query is intentionally NOT persisted (stopgap from #33346).
  // The durable protobuf-persistence fix in this change makes re-persisting safe via
  // toPlainMessage, but re-enabling it is left as a deliberate follow-up.
  return useInfiniteQuery({
    queryKey: [ReactQueryCacheKey.ListPositions, 'infinite', input] as const,
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      positionsClient.listPositions({
        ...input,
        pageToken: pageParam,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled: !disabled,
    refetchInterval,
    placeholderData: keepPreviousData,
  })
}

export function useGetPositionsForPairs(
  serializedPairs: {
    [chainId: number]: {
      [key: string]: { token0: SerializedToken; token1: SerializedToken }
    }
  },
  account?: Address,
): UseQueryResult<PlainMessage<GetPositionResponse>, ConnectError>[] {
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

          return persistableQueryOptions({
            queryKey: [ReactQueryCacheKey.GetPosition, requestInput] as const,
            queryFn: async () => toPlainMessage(await positionsClient.getPosition(requestInput ?? {})),
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
