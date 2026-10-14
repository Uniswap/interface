import { useQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { GetPositionRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { parseLiquidityServicePosition } from 'uniswap/src/features/positions/parseLiquidityServicePosition'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { protocolVersionToLiquidityServiceProtocols, toLiquidityChainId } from 'uniswap/src/features/positions/utils'

// The PermissionedPositionManager for a chain, if one is deployed there. tokenIds are only unique per
// manager, so a permissioned read must name it on the liquidity-service request.
function getPermissionedV4PositionManagerAddress(chainId: number): string | undefined {
  return (CHAIN_TO_ADDRESSES_MAP as Partial<Record<number, { permissionedV4PositionManagerAddress?: string }>>)[chainId]
    ?.permissionedV4PositionManagerAddress
}

/**
 * Input contract owned by this hook so a call site adding a field is a compile error here, not a
 * silent drop. Deliberately a subset of the data-api `GetPositionRequest`: every field must be
 * carried explicitly into the liquidity-service request below.
 */
export interface UseGetPositionInfoParams {
  owner: string
  chainId?: number
  protocolVersion?: ProtocolVersion
  /** Required for V3/V4 reads (NFT-keyed by tokenId). */
  tokenId?: string
  /** Required for V2 reads (a position is the wallet's share of a pair). */
  pairAddress?: string
  /**
   * V4 only: the position is held via the PermissionedPositionManager. The read names that manager on
   * the liquidity-service request via `positionManagerAddress` (resolved from the chain's deployed
   * address), so a tokenId resolves against the right manager rather than the canonical one.
   */
  permissioned?: boolean
}

export interface UseGetPositionInfoOptions {
  /**
   * Poll the position on this cadence (ms) while the hook is mounted; `false`/unset reads once and
   * relies on the shared query client's staleTime. For flows that quote a transaction from live state
   * (remove liquidity refreshes its calldata every 5 s) the displayed position must be re-read on the
   * same cadence, or the amounts shown can drift from what the transaction will actually settle.
   */
  refetchInterval?: number | false
  /** `false` keeps the query dormant (no reads, no polling) while leaving the last result in place. */
  enabled?: boolean
}

/**
 * Single-position read for the Position Details / Migrate pages, served by the liquidity-service
 * `GetPosition` RPC — permissioned reads included, selected via the chain's PermissionedPositionManager
 * address. Parsed into the shared `PositionInfo` domain model.
 */
export function useGetPositionInfo(
  params?: UseGetPositionInfoParams,
  options?: UseGetPositionInfoOptions,
): {
  positionInfo?: PositionInfo
  isLoading: boolean
  refetch: () => void
} {
  // Permissioned V4 reads select the PermissionedPositionManager by address on the request (the
  // service resolves the manager and returns the position under its sec-token identity).
  const permissionedManagerAddress =
    params?.permissioned && params.chainId ? getPermissionedV4PositionManagerAddress(params.chainId) : undefined

  const version =
    params?.protocolVersion === undefined
      ? undefined
      : protocolVersionToLiquidityServiceProtocols(params.protocolVersion)

  // A position is keyed by tokenId (V3/V4) or pairAddress (V2); without either the RPC can't identify
  // one, so keep the query dormant (Migrate can leave both undefined before its inputs resolve).
  const hasPositionKey = !!params?.tokenId || !!params?.pairAddress

  const lsQuery = useQuery(
    liquidityQueries.getPosition({
      params:
        params?.chainId && version !== undefined && hasPositionKey
          ? new GetPositionRequest({
              chainId: toLiquidityChainId(params.chainId),
              version,
              tokenId: params.tokenId,
              pairAddress: params.pairAddress,
              // walletAddress is only valid for V2, where a position is keyed by (pair, wallet).
              // V3/V4 are keyed by tokenId alone and the server rejects walletAddress there.
              walletAddress: version === Protocols.V2 ? params.owner : undefined,
              // Set only for permissioned V4 reads; selects the PermissionedPositionManager.
              positionManagerAddress: permissionedManagerAddress,
            })
          : undefined,
      // Stay dormant for a permissioned read whose manager address couldn't be resolved: sending the
      // request without a positionManagerAddress resolves the canonical PositionManager, and since
      // tokenIds are only unique per manager that could surface a different position sharing the id.
      enabled:
        options?.enabled !== false &&
        !!params?.chainId &&
        version !== undefined &&
        hasPositionKey &&
        (!params.permissioned || !!permissionedManagerAddress),
      refetchInterval: options?.refetchInterval,
    }),
  )

  return useMemo(
    () => ({
      positionInfo: lsQuery.data?.position ? parseLiquidityServicePosition(lsQuery.data.position) : undefined,
      isLoading: lsQuery.isLoading,
      refetch: lsQuery.refetch,
    }),
    [lsQuery.data?.position, lsQuery.isLoading, lsQuery.refetch],
  )
}
