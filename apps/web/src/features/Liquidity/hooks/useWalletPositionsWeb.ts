import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { type UniverseChainId, Platform } from '@universe/chains'
import { useCallback, useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePositionModifier } from 'uniswap/src/features/positions/hooks/usePositionModifier'
import {
  type UseWalletPositionsResult,
  useWalletPositions,
} from 'uniswap/src/features/positions/hooks/useWalletPositions'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getPositionKey } from 'uniswap/src/features/positions/utils'
import { usePositionVisibilityCheck } from 'uniswap/src/features/visibility/hooks/usePositionVisibilityCheck'
import { noop } from 'utilities/src/react/noop'
import { v2StatusFilterToRequestStatuses, type V2PositionStatusFilter } from '~/features/Liquidity/constants'
import { useIdentityStabilizer } from '~/features/Liquidity/hooks/useIdentityStabilizer'
import { positionSortToRequest } from '~/features/Liquidity/hooks/usePositionSort'
import type { PositionSort } from '~/features/Liquidity/PositionsTableColumns'
import { usePendingLPTransactionsChangeListener } from '~/state/transactions/hooks'

const PAGE_SIZE = 25

function amountKey(amount: CurrencyAmount<Currency> | undefined): string {
  return amount ? amount.quotient.toString() : ''
}

// Reward entries are a fresh array on every parse, so they need a value projection like the amounts
// above — comparing references would report every refetch as a change, and omitting them entirely
// would hide a campaign starting or ending behind the reused position reference.
function rewardsKey(rewards: PositionInfo['rewards']): string {
  return (rewards ?? []).map((reward) => `${reward.token.address}:${reward.boostedPoolApr}`).join(',')
}

// PositionInfo embeds SDK Pool/Position/Price/CurrencyAmount instances that lazily assign own
// fields (_token0Price, _mintAmounts, …) the first time a getter runs during render. A deep isEqual
// would then diff an already-rendered reference against its freshly-parsed twin and defeat the
// stabilizer, so compare a projection of the render-relevant scalars instead.
function arePositionsRenderEqual(a: PositionInfo, b: PositionInfo): boolean {
  return (
    a.status === b.status &&
    a.version === b.version &&
    a.tickLower === b.tickLower &&
    a.tickUpper === b.tickUpper &&
    a.tickSpacing === b.tickSpacing &&
    a.liquidity === b.liquidity &&
    a.token0UncollectedFees === b.token0UncollectedFees &&
    a.token1UncollectedFees === b.token1UncollectedFees &&
    a.uncollectedFeesUsd === b.uncollectedFeesUsd &&
    a.totalValueUsd === b.totalValueUsd &&
    a.apr === b.apr &&
    a.apr1d === b.apr1d &&
    a.apr7d === b.apr7d &&
    a.apr30d === b.apr30d &&
    a.protocolFee === b.protocolFee &&
    a.createdAt === b.createdAt &&
    a.isHidden === b.isHidden &&
    amountKey(a.currency0Amount) === amountKey(b.currency0Amount) &&
    amountKey(a.currency1Amount) === amountKey(b.currency1Amount) &&
    amountKey(a.fee0Amount) === amountKey(b.fee0Amount) &&
    amountKey(a.fee1Amount) === amountKey(b.fee1Amount) &&
    rewardsKey(a.rewards) === rewardsKey(b.rewards)
  )
}

export interface UseWalletPositionsWebParams {
  address: string | undefined
  chainFilter: UniverseChainId | null
  versionFilter: ProtocolVersion[]
  // In/out-of-range chips, combined with `v2StatusFilter` to form the server-side request statuses.
  statusFilter: PositionStatus[]
  // Lifecycle (open/closed) status filter; maps straight to the request statuses.
  v2StatusFilter: V2PositionStatusFilter[]
  // Server-side sort; maps to the GetWalletPositions sort_by/ascending fields.
  sort?: PositionSort
  // Server-side search; maps to the GetWalletPositions search field (token symbol/name, token
  // address, pool address/id).
  searchText?: string
  enabled?: boolean
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
  // The hidden set's first page; not part of isLoadingPositions so the table never waits on it.
  isLoadingHiddenPositions: boolean
  hasHiddenErrorWithoutData: boolean
  loadMorePositions: (options?: { onComplete?: () => void }) => void
}

export function useWalletPositionsWeb({
  address,
  chainFilter,
  versionFilter,
  statusFilter,
  v2StatusFilter,
  sort,
  searchText,
  enabled = true,
}: UseWalletPositionsWebParams): UseWalletPositionsWebResult {
  const isPositionVisible = usePositionVisibilityCheck()
  // Every refetch re-parses positions into brand-new PositionInfo objects, so without stabilizing
  // identity an identical refresh gives all rows new references and re-renders the entire table.
  // Reusing the prior reference on deep-equal contents lets the memoized table rows short-circuit.
  const stabilizeVisible = useIdentityStabilizer<PositionInfo>(getPositionKey, arePositionsRenderEqual)
  const stabilizeHidden = useIdentityStabilizer<PositionInfo>(getPositionKey, arePositionsRenderEqual)
  const { chains: defaultChains } = useEnabledChains({ platform: Platform.EVM })

  // statusFilter carries the in/out-of-range chips; combined with the lifecycle dropdown it forms
  // the server-side request so any status change re-queries GetWalletPositions.
  const liquidityRequestStatuses = useMemo(
    () => v2StatusFilterToRequestStatuses(v2StatusFilter, statusFilter),
    [v2StatusFilter, statusFilter],
  )
  // The liquidity service returns the visible set and its hidden complement from separate requests
  // (the modifier's `hiddenOnly` flag flips between them). To know a wallet has hidden-but-no-visible
  // positions — and to render them — we run BOTH: a visible-only primary that drives the list, and a
  // hidden-only secondary. The secondary always runs: the hidden set includes server spam flags the
  // client can't know about, so gating it on local visibility state would drop spam-only wallets'
  // hidden section.
  const visibleModifier = usePositionModifier({ includeHidden: false })
  const hiddenModifier = usePositionModifier({ includeHidden: true })
  const { sortBy, ascending } = useMemo(() => positionSortToRequest(sort), [sort])

  const chainIds = useMemo(() => (chainFilter ? [chainFilter] : defaultChains), [chainFilter, defaultChains])

  const {
    allPositions: visibleBEPositions,
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
    chainIds,
    protocolVersions: versionFilter,
    statuses: statusFilter,
    includeHidden: true,
    liquidityRequestStatuses: liquidityRequestStatuses.statuses,
    liquidityRangeStatuses: liquidityRequestStatuses.rangeStatuses,
    liquidityModifier: visibleModifier,
    liquiditySortBy: sortBy,
    liquidityAscending: ascending,
    liquiditySearch: searchText,
    autoFetchAllPages: false,
    pageSize: PAGE_SIZE,
    disabled: !enabled,
  })

  const {
    allPositions: hiddenBEPositions,
    isLoading: isLoadingHidden,
    hasData: hasHiddenData,
    error: hiddenError,
  } = useWalletPositions({
    account: address ?? '',
    chainIds,
    protocolVersions: versionFilter,
    statuses: statusFilter,
    includeHidden: true,
    liquidityRequestStatuses: liquidityRequestStatuses.statuses,
    liquidityRangeStatuses: liquidityRequestStatuses.rangeStatuses,
    liquidityModifier: hiddenModifier,
    liquiditySortBy: sortBy,
    liquidityAscending: ascending,
    liquiditySearch: searchText,
    autoFetchAllPages: true,
    pageSize: PAGE_SIZE,
    disabled: !address || !enabled,
  })

  const allBEPositions = useMemo(
    () => [...visibleBEPositions, ...hiddenBEPositions],
    [visibleBEPositions, hiddenBEPositions],
  )

  const isLoadingPositions = enabled && !!address && (isLoading || !hasData) && !error
  const hasErrorWithoutData = !!error && !hasData
  // First page only: the hidden query drains every page, but one page settles whether any exist.
  const isLoadingHiddenPositions = enabled && !!address && (isLoadingHidden || !hasHiddenData) && !hiddenError
  const hasHiddenErrorWithoutData = !!hiddenError && !hasHiddenData

  const { visiblePositions, hiddenPositions } = useMemo(() => {
    const dedupedById = new Map<string, PositionInfo>()
    for (const position of allBEPositions) {
      const positionId = getPositionKey(position)
      if (!dedupedById.has(positionId)) {
        dedupedById.set(positionId, position)
      }
    }

    // Hidden-complement results are hidden by provenance: the service applies the include/exclude
    // overrides server-side, so the complement is exactly the hidden set — and its response
    // positions carry no spam marking (status is lifecycle-only), so `isHidden` is false on them
    // and an isPositionVisible re-check would misfile server-spam as visible.
    const hiddenKeys = new Set(hiddenBEPositions.map(getPositionKey))

    const visible: PositionInfo[] = []
    const hidden: PositionInfo[] = []
    for (const position of dedupedById.values()) {
      const isVisible =
        !hiddenKeys.has(getPositionKey(position)) &&
        isPositionVisible({
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

    return { visiblePositions: stabilizeVisible(visible), hiddenPositions: stabilizeHidden(hidden) }
  }, [allBEPositions, hiddenBEPositions, isPositionVisible, stabilizeVisible, stabilizeHidden])

  // TanStack's refetch ignores `enabled`, so a disabled observer must not subscribe it.
  usePendingLPTransactionsChangeListener(enabled ? refetch : noop)

  const loadMorePositions = useCallback(
    (options?: { onComplete?: () => void }) => {
      if (hasNextPage && !isFetching) {
        void fetchNextPage().finally(() => options?.onComplete?.())
      } else {
        options?.onComplete?.()
      }
    },
    [hasNextPage, isFetching, fetchNextPage],
  )

  return {
    visiblePositions,
    hiddenPositions,
    isFetching,
    isPlaceholderData,
    hasNextPage,
    isLoadingPositions,
    hasErrorWithoutData,
    isLoadingHiddenPositions,
    hasHiddenErrorWithoutData,
    refetch,
    loadMorePositions,
    pagesLoaded,
  }
}
