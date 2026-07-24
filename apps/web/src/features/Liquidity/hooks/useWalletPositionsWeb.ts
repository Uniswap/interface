import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useCallback, useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import {
  type UseWalletPositionsResult,
  useWalletPositions,
} from 'uniswap/src/features/positions/hooks/useWalletPositions'
import { parseRestPosition } from 'uniswap/src/features/positions/parseRestPosition'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getPositionKey } from 'uniswap/src/features/positions/utils'
import { usePositionVisibilityCheck } from 'uniswap/src/features/visibility/hooks/usePositionVisibilityCheck'
import { usePendingLPTransactionsChangeListener } from '~/state/transactions/hooks'
import { useRequestPositionsForSavedPairs } from '~/state/user/hooks'

const PAGE_SIZE = 25

export interface UseWalletPositionsWebParams {
  address: string | undefined
  chainFilter: UniverseChainId | null
  versionFilter: ProtocolVersion[]
  statusFilter: PositionStatus[]
}

type ForwardedFromWalletPositions = Pick<
  UseWalletPositionsResult,
  'isFetching' | 'isPlaceholderData' | 'hasNextPage' | 'refetch' | 'pagesLoaded'
>

export interface UseWalletPositionsWebResult extends ForwardedFromWalletPositions {
  visiblePositions: PositionInfo[]
  hiddenPositions: PositionInfo[]
  isLoadingPositions: boolean
  hasErrorWithoutData: boolean
  loadMorePositions: () => void
}

export function useWalletPositionsWeb({
  address,
  chainFilter,
  versionFilter,
  statusFilter,
}: UseWalletPositionsWebParams): UseWalletPositionsWebResult {
  const isPositionVisible = usePositionVisibilityCheck()
  const { chains: defaultChains } = useEnabledChains({ platform: Platform.EVM })

  const {
    allPositions: allBEPositions,
    isLoading,
    isFetching,
    isPlaceholderData,
    hasNextPage,
    hasData,
    error,
    refetch,
    fetchNextPage,
    pagesLoaded,
  } = useWalletPositions({
    account: address ?? '',
    chainIds: chainFilter ? [chainFilter] : defaultChains,
    protocolVersions: versionFilter,
    statuses: statusFilter,
    includeHidden: true,
    autoFetchAllPages: false,
    pageSize: PAGE_SIZE,
  })

  const savedPositions = useRequestPositionsForSavedPairs()

  const isLoadingPositions = !!address && (isLoading || !hasData) && !error
  const hasErrorWithoutData = !!error && !hasData

  const { visiblePositions, hiddenPositions } = useMemo(() => {
    const parsedSaved = savedPositions
      .filter((position) => {
        const matchesChain = !chainFilter || position.data?.position?.chainId === chainFilter
        const matchesStatus = position.data?.position?.status && statusFilter.includes(position.data.position.status)
        const matchesVersion =
          position.data?.position?.protocolVersion && versionFilter.includes(position.data.position.protocolVersion)
        return matchesChain && matchesStatus && matchesVersion
      })
      .map((p) => p.data?.position)
      .map(parseRestPosition)
      .filter((position): position is PositionInfo => !!position)

    const dedupedById = new Map<string, PositionInfo>()
    for (const position of [...allBEPositions, ...parsedSaved]) {
      const positionId = getPositionKey(position)
      if (!dedupedById.has(positionId)) {
        dedupedById.set(positionId, position)
      }
    }

    const visible: PositionInfo[] = []
    const hidden: PositionInfo[] = []
    for (const position of dedupedById.values()) {
      const isVisible = isPositionVisible({
        poolId: position.poolId,
        tokenId: position.tokenId,
        chainId: position.chainId,
        isFlaggedSpam: position.isHidden,
      })
      if (isVisible) {
        visible.push(position)
      } else {
        hidden.push(position)
      }
    }

    return { visiblePositions: visible, hiddenPositions: hidden }
  }, [allBEPositions, savedPositions, chainFilter, statusFilter, versionFilter, isPositionVisible])

  usePendingLPTransactionsChangeListener(refetch)

  const loadMorePositions = useCallback(() => {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetching, fetchNextPage])

  return {
    visiblePositions,
    hiddenPositions,
    isFetching,
    isPlaceholderData,
    hasNextPage,
    isLoadingPositions,
    hasErrorWithoutData,
    refetch,
    loadMorePositions,
    pagesLoaded,
  }
}
