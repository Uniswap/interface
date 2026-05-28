import { useQuery } from '@tanstack/react-query'
import type { ListEarnPositionsResponse, ListEarnVaultsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { useMemo } from 'react'
import {
  getListEarnPositionsQueryOptions,
  getListEarnVaultsQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/earn'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EARN_SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/earn/constants'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  getEarnPositionInfosByVaultId,
  getEarnVaultInfos,
  getEarnVaultsSortedByPosition,
  getTotalEarnDepositedUsd,
} from 'uniswap/src/features/earn/utils'

const EMPTY_EARN_VAULTS: readonly EarnVaultInfo[] = []
const EMPTY_EARN_POSITIONS_BY_VAULT_ID: ReadonlyMap<string, EarnPositionInfo> = new Map()

const selectEarnVaultInfos = (data: ListEarnVaultsResponse | undefined): EarnVaultInfo[] =>
  getEarnVaultInfos(data?.vaults)
const selectEarnPositionInfosByVaultId = (data: ListEarnPositionsResponse | undefined): Map<string, EarnPositionInfo> =>
  getEarnPositionInfosByVaultId(data?.positions)

type UseEarnVaultsParams = {
  account?: string
  chainIds?: readonly UniverseChainId[]
  enabled?: boolean
}

type UseEarnVaultsResult = {
  hasLoadedPositions: boolean
  isLoadingPositions: boolean
  isLoadingVaults: boolean
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
  const positionsByVaultId = positionsQuery.data ?? EMPTY_EARN_POSITIONS_BY_VAULT_ID
  const vaultsSortedByPosition = useMemo(
    () => getEarnVaultsSortedByPosition({ positionsByVaultId, vaults }),
    [positionsByVaultId, vaults],
  )
  const totalDepositedUsd = useMemo(() => getTotalEarnDepositedUsd(positionsByVaultId.values()), [positionsByVaultId])

  const isLoadingVaults = vaultsQuery.isLoading && vaults.length === 0
  const isLoadingPositions = positionsQuery.isLoading && positionsByVaultId.size === 0

  return {
    hasLoadedPositions: positionsQuery.isSuccess,
    isLoadingPositions,
    isLoadingVaults,
    positionsByVaultId,
    totalDepositedUsd,
    vaults,
    vaultsSortedByPosition,
  }
}
