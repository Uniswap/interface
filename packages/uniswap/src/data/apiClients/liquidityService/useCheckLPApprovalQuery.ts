import { useQuery } from '@tanstack/react-query'
import { type LPApprovalRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import {
  type NormalizedApprovalData,
  normalizeApprovalResponse,
} from 'uniswap/src/data/apiClients/liquidityService/normalizeApprovalResponse'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function useCheckLPApprovalQuery({
  approvalQueryParams,
  isQueryEnabled,
  positionTokenAddress,
}: {
  approvalQueryParams: LPApprovalRequest | undefined
  isQueryEnabled: boolean
  positionTokenAddress?: string
}): {
  approvalData: NormalizedApprovalData | undefined
  approvalLoading: boolean
  approvalError: Error | null
  approvalRefetch: () => void
} {
  const {
    data: approvalData,
    isLoading: approvalLoading,
    error: approvalError,
    refetch: approvalRefetch,
  } = useQuery(
    liquidityQueries.checkApproval({
      params: approvalQueryParams,
      staleTime: 5 * ONE_SECOND_MS,
      enabled: isQueryEnabled,
      retry: false,
    }),
  )

  const tokenAddresses = {
    token0Address: approvalQueryParams?.lpTokens[0]?.tokenAddress,
    token1Address: approvalQueryParams?.lpTokens[1]?.tokenAddress,
    positionTokenAddress,
  }

  return {
    approvalData: approvalData ? normalizeApprovalResponse(approvalData, tokenAddresses) : undefined,
    approvalLoading,
    approvalError,
    approvalRefetch,
  }
}
