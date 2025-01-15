/* eslint-disable no-restricted-imports */
import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { createQueryOptions, useInfiniteQuery, useQuery } from '@connectrpc/connect-query'
import {
  InfiniteData,
  UseInfiniteQueryResult,
  UseQueryResult,
  keepPreviousData,
  useQueries,
} from '@tanstack/react-query'
import { getPosition, listPositions } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import {
  GetPositionResponse,
  ListPositionsRequest,
  ListPositionsResponse,
} from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Pair } from '@uniswap/v2-sdk'
import { useMemo } from 'react'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'
import { SerializedToken } from 'uniswap/src/features/tokens/slice/types'
import { deserializeToken } from 'uniswap/src/utils/currency'

export function useGetPositionsQuery(
  input?: PartialMessage<ListPositionsRequest>,
  disabled?: boolean,
): UseQueryResult<ListPositionsResponse, ConnectError> {
  return useQuery(listPositions, input, {
    transport: uniswapGetTransport,
    enabled: !!input && !disabled,
    placeholderData: keepPreviousData,
  })
}

export function useGetPositionsInfiniteQuery(
  input: PartialMessage<ListPositionsRequest> & { pageToken: string },
  disabled?: boolean,
): UseInfiniteQueryResult<InfiniteData<ListPositionsResponse>, ConnectError> {
  return useInfiniteQuery(listPositions, input, {
    transport: uniswapGetTransport,
    enabled: !!input && !disabled,
    pageParamKey: 'pageToken',
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
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
): UseQueryResult<GetPositionResponse, ConnectError>[] {
  const positionsQueryOptions = useMemo(() => {
    return Object.keys(serializedPairs || {})
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
          return createQueryOptions(
            getPosition,
            account
              ? {
                  chainId: Number(chainId),
                  protocolVersion: ProtocolVersion.V2,
                  pairAddress,
                  owner: account,
                }
              : undefined,
            { transport: uniswapGetTransport },
          )
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
