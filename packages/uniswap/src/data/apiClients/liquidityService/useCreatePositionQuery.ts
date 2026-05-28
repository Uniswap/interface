import { useQuery } from '@tanstack/react-query'
import {
  CreateClassicPositionRequest,
  CreateClassicPositionResponse,
  CreatePositionRequest,
  CreatePositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function useCreatePositionQuery({
  createCalldataQueryParams,
  transactionError,
  isQueryEnabled,
}: {
  createCalldataQueryParams: CreateClassicPositionRequest | CreatePositionRequest | undefined
  transactionError: boolean
  isQueryEnabled: boolean
}): {
  createCalldata: CreateClassicPositionResponse | CreatePositionResponse | undefined
  createError: Error | null
  createRefetch: () => void
} {
  const isV2 = createCalldataQueryParams instanceof CreatePositionRequest
  const isClassic = createCalldataQueryParams instanceof CreateClassicPositionRequest

  const {
    data: createClassicCalldata,
    error: createClassicError,
    refetch: createClassicRefetch,
  } = useQuery(
    liquidityQueries.createClassicPosition({
      params: isClassic ? createCalldataQueryParams : undefined,
      refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
      retry: false,
      enabled: isClassic && isQueryEnabled && Boolean(createCalldataQueryParams),
    }),
  )

  const {
    data: createV2Calldata,
    error: createV2Error,
    refetch: createV2Refetch,
  } = useQuery(
    liquidityQueries.createPosition({
      params: isV2 ? createCalldataQueryParams : undefined,
      refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
      retry: false,
      enabled: isV2 && isQueryEnabled && Boolean(createCalldataQueryParams),
    }),
  )

  const createCalldata = isV2 ? createV2Calldata : createClassicCalldata
  const createError = isV2 ? createV2Error : createClassicError
  const createRefetch = isV2 ? createV2Refetch : createClassicRefetch

  return {
    createCalldata,
    createError,
    createRefetch,
  }
}
