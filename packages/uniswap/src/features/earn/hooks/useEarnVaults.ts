import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { ListEarnPositionsResponse, ListEarnVaultsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { useMemo } from 'react'
import {
  getListEarnPositionsQueryOptions,
  getListEarnVaultsQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/earn/queries'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EARN_SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/earn/constants'
import {
  applyOptimisticEarnPositionUpdates,
  useOptimisticEarnPositionStore,
} from 'uniswap/src/features/earn/optimisticEarnPositions'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  getEarnPositionInfosByVaultId,
  getEarnVaultInfos,
  getEarnVaultsSortedByPosition,
  getTotalEarnDepositedUsd,
} from 'uniswap/src/features/earn/utils'
import { useEvent } from 'utilities/src/react/hooks'

const EMPTY_EARN_VAULTS: readonly EarnVaultInfo[] = []
const EMPTY_EARN_POSITIONS_BY_VAULT_ID: ReadonlyMap<string, EarnPositionInfo> = new Map()

const selectEarnVaultInfos = (data: PlainMessage<ListEarnVaultsResponse> | undefined): EarnVaultInfo[] =>
  getEarnVaultInfos(data?.vaults)
const selectEarnPositionInfosByVaultId = (
  data: PlainMessage<ListEarnPositionsResponse> | undefined,
): Map<string, EarnPositionInfo> => getEarnPositionInfosByVaultId(data?.positions)

type UseEarnVaultsParams = {
  account?: string
  chainIds?: readonly UniverseChainId[]
  enabled?: boolean
}

type UseEarnVaultsResult = {
  hasLoadedPositions: boolean
  isLoadingPositions: boolean
  isLoadingVaults: boolean
  /** True when either the vaults or positions query failed. */
  isError: boolean
  /** Refetches both the vaults and positions queries. */
  refetch: () => void
  positionsByVaultId: ReadonlyMap<string, EarnPositionInfo>
  totalDepositedUsd: number
  vaults: readonly EarnVaultInfo[]
  vaultsSortedByPosition: readonly EarnVaultInfo[]
}

export function useEarnVaults({
  account,
  chainIds = EARN_SUPPORTED_CHAIN_IDS,
  enabled = true,
}: UseEarnVaultsParams = {}): UseEarnVaultsResult {
  const vaultsQueryParams = useMemo(() => ({ chainIds: [...chainIds] }), [chainIds])
  const positionsQueryParams = useMemo(
    () => (account ? { walletAddress: account, chainIds: [...chainIds] } : undefined),
    [account, chainIds],
  )

  const vaultsQuery = useQuery(
    getListEarnVaultsQueryOptions({
      params: vaultsQueryParams,
      enabled,
      select: selectEarnVaultInfos,
    }),
  )
  const positionsQuery = useQuery(
    getListEarnPositionsQueryOptions({
      params: positionsQueryParams,
      enabled: enabled && !!positionsQueryParams,
      select: selectEarnPositionInfosByVaultId,
    }),
  )

  const vaults = vaultsQuery.data ?? EMPTY_EARN_VAULTS
  const hasResolvedPositions = account ? positionsQuery.data !== undefined && !positionsQuery.isPlaceholderData : false
  const apiPositionsByVaultId = hasResolvedPositions
    ? (positionsQuery.data ?? EMPTY_EARN_POSITIONS_BY_VAULT_ID)
    : EMPTY_EARN_POSITIONS_BY_VAULT_ID
  const optimisticEarnPositionUpdates = useOptimisticEarnPositionStore((s) => s.updatesById)
  const positionsByVaultId = useMemo(
    () =>
      account
        ? applyOptimisticEarnPositionUpdates({
            chainIds,
            positionsByVaultId: apiPositionsByVaultId,
            updatesById: optimisticEarnPositionUpdates,
            vaults,
            walletAddress: account,
          })
        : EMPTY_EARN_POSITIONS_BY_VAULT_ID,
    [account, apiPositionsByVaultId, chainIds, optimisticEarnPositionUpdates, vaults],
  )
  const vaultsSortedByPosition = useMemo(
    () => getEarnVaultsSortedByPosition({ positionsByVaultId, vaults }),
    [positionsByVaultId, vaults],
  )
  const totalDepositedUsd = useMemo(() => getTotalEarnDepositedUsd(positionsByVaultId.values()), [positionsByVaultId])

  const isLoadingVaults = vaultsQuery.isLoading && vaults.length === 0
  const isLoadingPositions = (positionsQuery.isLoading || positionsQuery.isPlaceholderData) && !hasResolvedPositions

  const refetch = useEvent(() => {
    vaultsQuery.refetch().catch(() => undefined)
    if (positionsQueryParams) {
      positionsQuery.refetch().catch(() => undefined)
    }
  })

  return {
    hasLoadedPositions: hasResolvedPositions,
    isLoadingPositions,
    isLoadingVaults,
    isError: vaultsQuery.isError || positionsQuery.isError,
    refetch,
    positionsByVaultId,
    totalDepositedUsd,
    vaults,
    vaultsSortedByPosition,
  }
}
