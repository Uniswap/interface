/* oxlint-disable typescript/no-unnecessary-condition max-lines */
import { createColumnHelper, Row } from '@tanstack/react-table'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId, areEvmAddressesEqual } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, type FlexCompatProps, Text, useMedia } from '@universe/mycelium'
import {
  forwardRef,
  type ForwardRefExoticComponent,
  memo,
  ReactElement,
  ReactNode,
  type RefAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { iconSizes } from 'ui/src/theme'
import { FeeDisplay } from 'uniswap/src/components/FeeDisplay/FeeDisplay'
import { UniswapBuiltHookMark } from 'uniswap/src/components/logos/UniswapBuiltHookMark'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { BIPS_BASE, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { feeAmountToBps } from 'uniswap/src/features/fees/feeUnits'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getHookRegistryKey, useHookRegistryMap } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import {
  type UniswapHookProvenance,
  useUniswapHookProvenance,
} from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import type { FeeData, PositionRewardApr } from 'uniswap/src/features/positions/types'
import { ElementName, InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { shouldReverseForWaterfall } from 'uniswap/src/features/tokens/waterfallPriority'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { type FiatNumberType, NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { Portal } from '~/components/Popups/Portal'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { EllipsisText, TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { supportedChainIdFromGQLChain } from '~/data/chainUtils'
import { PoolSortFields } from '~/data/pools/poolStats'
import { gqlToCurrency, OrderDirection } from '~/data/util'
import { TABLE_PAGE_SIZE } from '~/features/Explore/state'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { HookDetailsModal } from '~/features/Liquidity/HookDetailsModal'
import { HookTooltip } from '~/features/Liquidity/HookTooltip'
import { PoolAprTooltip } from '~/features/Liquidity/LPIncentives/PoolAprTooltip'
import { RewardAprBadge } from '~/features/Liquidity/LPIncentives/RewardAprBadge'
import { usePoolsAprRange } from '~/features/Liquidity/PoolsFilter/aprRange'
import { getCurrencyWithUnwrap } from '~/features/Liquidity/utils/currency'
import { isDynamicFeeTier } from '~/features/Liquidity/utils/feeTiers'
import { getProtocolVersionFromLabel } from '~/features/Liquidity/utils/protocolVersion'
import { scrollToExploreTokenSection } from '~/pages/Explore/categories/useExploreCategory'
import { useListPools } from '~/pages/Explore/hooks/useListPools'
import { useSimplePagination } from '~/pages/Explore/hooks/useSimplePagination'
import {
  PoolTableStoreContextProvider,
  usePoolTableStore,
  usePoolTableStoreActions,
} from '~/pages/Explore/tables/Pools/poolTableStore'
import { PoolStat } from '~/types/explore'
import { getChainUrlParam, useChainIdFromUrlParam } from '~/utils/params/chainParams'

export interface PoolLinkData {
  chainId: UniverseChainId
  poolIdOrHash: string
  token0Address?: string
  token1Address?: string
  fee?: FeeData
  hookAddress?: string
  protocolVersion?: string
}

// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
const TableWrapper: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function TableWrapper(props, ref) {
  // `width` is load-bearing: auto inline margins stop a flex item stretching, so without a definite
  // width the table collapses to fit-content and overflows its container below 900px.
  return <Flex ref={ref} width="100%" maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT} mx="auto" my={0} {...props} />
})

// Taller than the default row: the Pool column stacks the pair name over its protocol/fee/hook line.
const ROW_HEIGHT = 64

interface PoolTableValues {
  index: number
  poolDescription: ReactElement
  tvl: string
  apr?: number
  totalApr?: number
  volume24h: string
  volume30d: string
  volOverTvl?: number
  link: string
  linkState?: { entryPoint?: string }
  /** The pool's live per-token boosts, as served. Empty when it runs no live campaign. */
  rewards?: PositionRewardApr[]
  token0CurrencyId?: string
  token1CurrencyId?: string
  selected?: boolean
}

function getPoolVolumes(pool: PoolStat): { tvl: number; volume24h: number; volume30d: number } {
  return {
    tvl: pool.totalLiquidity?.value ?? 0,
    volume24h: pool.volume1Day?.value ?? 0,
    volume30d: pool.volume30Day?.value ?? 0,
  }
}

function buildV4CurrencyId(
  pool: PoolStat,
  chainId: UniverseChainId,
): {
  token0CurrencyId?: string
  token1CurrencyId?: string
} {
  // Rows carry the lowercase label `convertPoolToPoolStat` stamps on them ('v4'), not the GraphQL
  // enum's 'V4' — comparing against the enum directly never matched, so v4 rows lost their currency ids.
  if (getProtocolVersionFromLabel(pool.protocolVersion?.toLowerCase()) !== ProtocolVersion.V4) {
    return {}
  }
  // A v4 native leg arrives as a falsy address, the 'NATIVE' sentinel, or the zero address
  // (liquidity service via convertPoolToPoolStat) — canonicalize all of them.
  const rawToken0 = pool.token0?.address
  const rawToken1 = pool.token1?.address
  const token0 =
    !rawToken0 || rawToken0 === NATIVE_CHAIN_ID || rawToken0 === ZERO_ADDRESS ? getNativeAddress(chainId) : rawToken0
  const token1 =
    !rawToken1 || rawToken1 === NATIVE_CHAIN_ID || rawToken1 === ZERO_ADDRESS ? getNativeAddress(chainId) : rawToken1
  return {
    token0CurrencyId: token0 ? buildCurrencyId(chainId, token0) : undefined,
    token1CurrencyId: token1 ? buildCurrencyId(chainId, token1) : undefined,
  }
}

function getPoolLink(
  pool: PoolStat,
  opts: { chainId: UniverseChainId; linkBuilder?: (data: PoolLinkData) => string },
): string {
  const poolIdOrHash = pool.id
  const linkData: PoolLinkData = {
    chainId: opts.chainId,
    poolIdOrHash,
    token0Address: pool.token0?.address ?? undefined,
    token1Address: pool.token1?.address ?? undefined,
    fee: pool.feeTier ?? undefined,
    hookAddress: pool.hookAddress,
    protocolVersion: pool.protocolVersion?.toLowerCase(),
  }
  return opts.linkBuilder?.(linkData) ?? `/explore/pools/${getChainUrlParam(opts.chainId)}/${poolIdOrHash}`
}

function formatVolume(
  amount: number,
  convertFiatAmountFormatted: (amount: number, type: FiatNumberType) => string,
): string {
  return amount ? convertFiatAmountFormatted(amount, NumberType.FiatTokenStats) : '-'
}

function HookNameText({
  hookEntry,
  chainId,
  provenance,
}: {
  hookEntry: HookEntry
  chainId: UniverseChainId
  provenance?: UniswapHookProvenance
}) {
  const [showDetails, setShowDetails] = useState(false)

  const handlePress = useEvent((e: { preventDefault: () => void; stopPropagation: () => void }) => {
    // The whole row is a link to the pool page — keep this press from triggering it.
    e.preventDefault()
    e.stopPropagation()
    setShowDetails(true)
  })

  // Rendered bare for registry hooks (DOM unchanged); hooks Uniswap built or configured get the mark too.
  const nameText = (
    <Text
      variant="body3"
      color="$neutral2"
      maxWidth={160}
      minWidth={0}
      flexShrink={1}
      whiteSpace="nowrap"
      overflow="hidden"
      textOverflow="ellipsis"
      cursor="pointer"
      hoverStyle={{ color: '$neutral1' }}
      onPress={handlePress}
    >
      {hookEntry.name || shortenAddress({ address: hookEntry.address })}
    </Text>
  )

  return (
    <>
      {/* minWidth: 0 on the Popover's reference wrapper: its default min-width:auto floors the flex
          item at the full nowrap name width, so squeezed rows clip instead of ellipsizing. */}
      <MouseoverTooltip
        text={<HookTooltip hookEntry={hookEntry} provenance={provenance} />}
        placement="top"
        style={{ minWidth: 0 }}
      >
        {provenance !== undefined ? (
          // onPress on the wrapper (not just the name) so clicking the mark opens the hook details modal
          // too, rather than falling through to the row's pool link — matching the position badge.
          // flexShrink: 1 so the wrapper shrinks like the bare name Text does — Tamagui stacks default
          // to flexShrink: 0, which would let a long marked name overflow instead of ellipsizing.
          <Flex row alignItems="center" gap="$gap4" minWidth={0} flexShrink={1} cursor="pointer" onPress={handlePress}>
            <UniswapBuiltHookMark />
            {nameText}
          </Flex>
        ) : (
          nameText
        )}
      </MouseoverTooltip>
      {showDetails ? (
        // The cell lives inside the row's link, and a dialog mounted inside an anchor would nest
        // anchors and bubble clicks into it.
        <Portal>
          <HookDetailsModal hookEntry={hookEntry} chainId={chainId} isOpen onClose={() => setShowDetails(false)} />
        </Portal>
      ) : null}
    </>
  )
}

function PoolDetailsLine({
  chainId,
  protocolVersion,
  feeTier,
  hookAddress,
  protocolFeePips,
  hookRegistry,
}: {
  chainId: UniverseChainId
  protocolVersion?: string
  feeTier?: FeeData
  hookAddress?: string
  protocolFeePips?: number
  hookRegistry?: Map<string, HookEntry>
}) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const getUniswapHookProvenance = useUniswapHookProvenance()

  const poolHookAddress = hookAddress && !areEvmAddressesEqual(hookAddress, ZERO_ADDRESS) ? hookAddress : undefined
  const hookEntry = poolHookAddress
    ? hookRegistry?.get(getHookRegistryKey({ chainId, hookAddress: poolHookAddress }))
    : undefined
  // A hook the registry doesn't list (or hasn't loaded yet) still belongs on the line — show its
  // truncated address rather than dropping it, so a hooked pool never reads as hookless. Empty when the
  // served value isn't a valid address, which shortenAddress can't truncate.
  const shortHookAddress = poolHookAddress ? shortenAddress({ address: poolHookAddress }) : ''
  // Keyed on the trusted `chainId` the table is showing (the one that built the registry key above), not
  // the entry's self-reported chainId, so a response claiming another chain can't earn that chain's badge.
  const provenance = hookEntry ? getUniswapHookProvenance({ chainId, address: hookEntry.address }) : undefined
  const restProtocolVersion = getProtocolVersionFromLabel(protocolVersion)
  // Dynamic tiers are excluded: their feeAmount is a sentinel, not a rate.
  const feeBreakdown =
    feeTier && restProtocolVersion !== undefined && !isDynamicFeeTier(feeTier)
      ? getFeeBreakdown({
          feeAmount: feeTier.feeAmount,
          protocolVersion: restProtocolVersion,
          servedProtocolFeeBps: protocolFeePips !== undefined ? feeAmountToBps(protocolFeePips) : undefined,
        })
      : undefined

  const feeTierLabel = feeTier
    ? isDynamicFeeTier(feeTier)
      ? t('common.dynamic')
      : formatPercent(feeTier.feeAmount / BIPS_BASE, 4)
    : undefined
  const detailText = [protocolVersion, feeTierLabel].filter(Boolean).join(' · ')

  const hookNode = hookEntry ? (
    <HookNameText hookEntry={hookEntry} chainId={chainId} provenance={provenance} />
  ) : poolHookAddress && shortHookAddress ? (
    // No registry entry means no name, description or flags to open a details dialog on, so the address
    // is plain text with the full value on hover — matching the position badges.
    <MouseoverTooltip
      text={t('liquidity.hooks.address.tooltip', { address: poolHookAddress })}
      placement="top"
      style={{ minWidth: 0 }}
    >
      <Text variant="body3" color="$neutral2" numberOfLines={1} flexShrink={0}>
        {shortHookAddress}
      </Text>
    </MouseoverTooltip>
  ) : null

  if (!detailText && !hookNode) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="$gap4" minWidth={0} maxWidth="100%">
      {feeBreakdown ? (
        <>
          {protocolVersion ? (
            <Text variant="body3" color="$neutral2" numberOfLines={1} flexShrink={0}>
              {protocolVersion}
            </Text>
          ) : null}
          {protocolVersion ? (
            <Text variant="body3" color="$neutral2" flexShrink={0}>
              ·
            </Text>
          ) : null}
          <FeeDisplay feeBreakdown={feeBreakdown}>
            <Text variant="body3" color="$neutral2" numberOfLines={1} flexShrink={0}>
              {feeTierLabel}
            </Text>
          </FeeDisplay>
        </>
      ) : detailText ? (
        <Text variant="body3" color="$neutral2" numberOfLines={1} flexShrink={0}>
          {detailText}
        </Text>
      ) : null}
      {hookNode ? (
        <>
          {detailText ? (
            <Text variant="body3" color="$neutral2" flexShrink={0}>
              ·
            </Text>
          ) : null}
          {hookNode}
        </>
      ) : null}
    </Flex>
  )
}

function PoolDescription({
  token0,
  token1,
  chainId,
  protocolVersion,
  feeTier,
  hookAddress,
  protocolFeePips,
  hookRegistry,
}: {
  token0: PoolStat['token0']
  token1: PoolStat['token1']
  chainId: UniverseChainId
  protocolVersion?: string
  feeTier?: FeeData
  hookAddress?: string
  protocolFeePips?: number
  hookRegistry?: Map<string, HookEntry>
}) {
  // Unwrapping is the protocol's call: a v2/v3 wrapped-native leg reads as the native currency, a v4
  // one stays as served (v4 holds native and wrapped native as two distinct currencies).
  const restProtocolVersion = getProtocolVersionFromLabel(protocolVersion)
  const currency0 = getCurrencyWithUnwrap(token0 ? gqlToCurrency(token0) : undefined, restProtocolVersion)
  const currency1 = getCurrencyWithUnwrap(token1 ? gqlToCurrency(token1) : undefined, restProtocolVersion)
  // The served symbol is the fallback for a leg with no `Currency` to read one off (e.g. Tempo's
  // native placeholder, which `gqlToCurrency` can't build).
  const symbol0 = currency0?.symbol ?? token0?.symbol
  const symbol1 = currency1?.symbol ?? token1?.symbol
  const reverse = currency0 && currency1 ? shouldReverseForWaterfall(currency0, currency1) : false
  const [baseSymbol, quoteSymbol] = reverse ? [symbol1, symbol0] : [symbol0, symbol1]
  const currencies = reverse ? [currency1, currency0] : [currency0, currency1]

  return (
    <Flex row gap="$gap8" alignItems="center" maxWidth="100%">
      <DoubleCurrencyLogo
        currencies={currencies}
        // The row already carries each leg's served logo, so the pair logo needn't fetch them per token.
        servedLogos={[
          { currency: currency0, logoUrl: token0?.logo },
          { currency: currency1, logoUrl: token1?.logo },
        ]}
        // 32px matches the Explore tokens table's logo, so the two tabs' rows line up.
        size={iconSizes.icon32}
      />
      <Flex flex={1} minWidth={0} gap="$spacing2">
        <EllipsisText>
          {baseSymbol}/{quoteSymbol}
        </EllipsisText>
        <PoolDetailsLine
          chainId={chainId}
          protocolVersion={protocolVersion}
          feeTier={feeTier}
          hookAddress={hookAddress}
          protocolFeePips={protocolFeePips}
          hookRegistry={hookRegistry}
        />
      </Flex>
    </Flex>
  )
}

type PoolTableSurface = 'explore' | 'tdp' | 'add-liquidity-pool-browser' | 'positions-discovery'

function PoolTableHeader({
  category,
  isCurrentSortMethod,
  direction,
  surface,
}: {
  category: PoolSortFields
  isCurrentSortMethod: boolean
  direction: OrderDirection
  surface: PoolTableSurface
}) {
  const { setSort } = usePoolTableStoreActions()
  const handleSortCategory = useCallback(() => {
    const newSortAscending = setSort(category)
    sendAnalyticsEvent(InterfaceEventName.ExploreTableSorted, {
      table_type: 'pools',
      sort_method: category,
      sort_direction: newSortAscending ? OrderDirection.Asc : OrderDirection.Desc,
      surface,
    })
    // No-ops outside Explore (TDP, add-liquidity pool browser) — the section anchor only exists there.
    scrollToExploreTokenSection()
  }, [setSort, category, surface])
  const { t } = useTranslation()

  const HEADER_DESCRIPTIONS: Partial<Record<PoolSortFields, ReactNode>> = {
    [PoolSortFields.TVL]: t('stats.tvl'),
    [PoolSortFields.Volume24h]: t('stats.volume.1d'),
    [PoolSortFields.Volume30D]: t('pool.volume.thirtyDay'),
    [PoolSortFields.Apr]: t('pool.apr.description'),
  }
  const HEADER_TEXT: Partial<Record<PoolSortFields, string>> = {
    [PoolSortFields.TVL]: t('common.totalValueLocked'),
    [PoolSortFields.Volume24h]: t('stats.volume.1d.short'),
    [PoolSortFields.Volume30D]: t('pool.volume.thirtyDay.short'),
    [PoolSortFields.Apr]: t('pool.aprText'),
    [PoolSortFields.VolOverTvl]: t('pool.volOverTvl'),
  }

  return (
    <Flex width="100%">
      <MouseoverTooltip
        disabled={!HEADER_DESCRIPTIONS[category]}
        size={TooltipSize.Small}
        fitContent
        text={<Text variant="body3">{HEADER_DESCRIPTIONS[category]}</Text>}
        placement="top"
      >
        <ClickableHeaderRow justifyContent="flex-end" onPress={handleSortCategory} group>
          {isCurrentSortMethod && <HeaderArrow orderDirection={direction} size="$icon.16" />}
          <HeaderSortText active={isCurrentSortMethod} variant="body3">
            {HEADER_TEXT[category]}
          </HeaderSortText>
        </ClickableHeaderRow>
      </MouseoverTooltip>
    </Flex>
  )
}

interface TopPoolTableProps {
  topPools?: PoolStat[]
  isLoading: boolean
  isError: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  virtualized?: boolean
  /** The one chain the list is filtered to — scopes the hook-registry fetch to it; `undefined` = all networks. */
  chainId: UniverseChainId | undefined
  /** The search behind these rows, for row impression analytics. */
  filterString?: string
}
function ExploreTopPoolTableContent({
  staticSize,
  pageSize,
  surface,
}: {
  staticSize?: boolean
  pageSize?: number
  surface: PoolTableSurface
}): JSX.Element {
  const chainId = useChainIdFromUrlParam()
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const { resetSort } = usePoolTableStoreActions()
  const selectedProtocol = useExploreTablesFilterStore((s) => s.selectedProtocol)
  const poolsFilter = useExploreTablesFilterStore((s) => s.poolsFilter)
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const { setPoolsAprRange } = useExploreTablesFilterStoreActions()
  const isAdvancedPoolsFilteringEnabled = useFeatureFlag(FeatureFlags.AdvancedPoolsFiltering)

  useEffect(() => {
    resetSort()
  }, [resetSort])

  const {
    pools,
    isLoading,
    isError,
    loadMore,
    chainId: listChainId,
  } = useListPools({
    sortState: {
      sortBy: sortMethod,
      sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc,
    },
    // The URL chain scopes the list under both filter UIs: with the advanced filter on, its Network control
    // reads and writes that same path segment (see ExploreTableFilters), so the two can't disagree.
    chainId,
    protocol: selectedProtocol,
    poolsFilter: isAdvancedPoolsFilteringEnabled ? poolsFilter : undefined,
  })

  // The toolbar's filter modal sits outside this table's sort store, so it can't run the same query; publish the
  // loaded rows' APR range for its placeholder hints instead. Cleared on unmount so a stale range never lingers.
  const aprRange = usePoolsAprRange(pools)
  useEffect(() => {
    setPoolsAprRange(aprRange)
    return () => setPoolsAprRange(undefined)
  }, [aprRange, setPoolsAprRange])

  return (
    <TopPoolTable
      topPoolData={{
        topPools: pools,
        isLoading,
        isError,
        loadMore,
        chainId: listChainId,
        virtualized: true,
        filterString,
      }}
      staticSize={staticSize}
      pageSize={pageSize}
      surface={surface}
    />
  )
}

export const ExploreTopPoolTable = memo(function ExploreTopPoolTable({
  staticSize,
  pageSize,
  surface,
}: {
  // Render a fixed set of rows with no infinite scroll / internal scroll area (e.g. discovery surfaces).
  staticSize?: boolean
  pageSize?: number
  surface: PoolTableSurface
}) {
  return (
    <PoolTableStoreContextProvider>
      <ExploreTopPoolTableContent staticSize={staticSize} pageSize={pageSize} surface={surface} />
    </PoolTableStoreContextProvider>
  )
})

const TopPoolTable = memo(function TopPoolTable({
  topPoolData,
  pageSize = TABLE_PAGE_SIZE,
  staticSize = false,
  surface,
}: {
  topPoolData: TopPoolTableProps
  pageSize?: number
  staticSize?: boolean
  surface: PoolTableSurface
}) {
  const { topPools, isLoading, isError, loadMore: backendLoadMore, chainId, virtualized, filterString } = topPoolData

  // Fallback for legacy mode, where the backend gives no loadMore.
  const { page, loadMore: clientLoadMore } = useSimplePagination({ totalCount: topPools?.length, pageSize })

  const effectiveLoadMore = backendLoadMore ?? clientLoadMore
  const displayedPools = staticSize
    ? topPools?.slice(0, pageSize)
    : backendLoadMore
      ? topPools
      : topPools?.slice(0, page * pageSize)

  return (
    <TableWrapper data-testid="top-pools-explore-table">
      <PoolsTable
        pools={displayedPools}
        loading={isLoading}
        error={isError}
        loadMore={staticSize ? undefined : effectiveLoadMore}
        maxWidth={1200}
        chainId={chainId}
        surface={surface}
        filterString={filterString}
        // A fixed-row discovery surface has nothing to virtualize.
        virtualized={staticSize ? false : virtualized}
      />
    </TableWrapper>
  )
})

export function PoolsTable({
  pools,
  loading,
  error,
  loadMore,
  maxWidth,
  maxHeight,
  hiddenColumns,
  hideIndex,
  getLink,
  linkState,
  selectedPoolId,
  selectedPoolChainId,
  surface,
  virtualized,
  stickyTopOffset,
  chainId: listChainId,
  filterString,
}: {
  pools?: PoolStat[]
  loading: boolean
  error?: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  maxWidth?: number
  maxHeight?: number
  hiddenColumns?: PoolSortFields[]
  hideIndex?: boolean
  getLink?: (pool: PoolLinkData) => string
  linkState?: { entryPoint?: string }
  /**
   * The search that produced these rows, stamped on each row's impression analytics. Passed in
   * rather than read from a store: each surface keeps its search somewhere different (Explore's
   * tables filter store, the pool browser's local state), and a store read silently reported an
   * empty search on every surface but Explore.
   */
  filterString?: string
  /** Where this table is mounted — attached to sort analytics so surfaces aren't conflated. */
  surface: PoolTableSurface
  // The matching row renders with a selected highlight — used by the add-liquidity pool browser,
  // where the table stays visible after a pool is picked.
  selectedPoolId?: string
  selectedPoolChainId?: UniverseChainId
  virtualized?: boolean
  /** Extra clearance between the app header and the sticky header row; see `TableProps`. */
  stickyTopOffset?: number
  // The one chain every listed pool is on, when the list is chain-filtered. Scopes the hook-registry
  // fetch to that chain. Required so the full cross-chain registry is an explicit `undefined` for an
  // all-networks list, never the default a new consumer falls into by forgetting the prop.
  chainId: UniverseChainId | undefined
}) {
  const { t } = useTranslation()
  // Surfaces that opted out of the old reward-APR column keep opting out of the sub-line.
  const showBoostedApr = !hiddenColumns?.includes(PoolSortFields.RewardApr)

  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const { defaultChainId } = useEnabledChains()
  // One registry fetch for the whole list (not one per row), scoped to the list's chain filter and
  // skipped when nothing listed has a hook (v2/v3-only lists, zero-address v4 hooks).
  const hasHookedPool = !!pools?.some(
    (pool) => !!pool.hookAddress && !areEvmAddressesEqual(pool.hookAddress, ZERO_ADDRESS),
  )
  const hookRegistry = useHookRegistryMap({ chainId: listChainId, enabled: hasHookedPool })

  const poolTableValues: PoolTableValues[] | undefined = useMemo(
    () =>
      pools?.map((pool, index) => {
        const poolSortRank = index + 1
        const chainId = supportedChainIdFromGQLChain(pool.token0?.chain as GraphQLApi.Chain) ?? defaultChainId
        const poolIdOrHash = pool.id
        const volumes = getPoolVolumes(pool)
        // The row link is built from this same `poolIdOrHash`, so exact equality is correct — and
        // address-casing rules don't apply to v4 pool-id hashes anyway.
        const selected =
          selectedPoolId !== undefined && chainId === selectedPoolChainId && poolIdOrHash === selectedPoolId

        return {
          index: poolSortRank,
          selected,
          poolDescription: (
            <PoolDescription
              token0={pool.token0}
              token1={pool.token1}
              chainId={chainId}
              protocolVersion={pool.protocolVersion?.toLowerCase()}
              feeTier={pool.feeTier ?? undefined}
              hookAddress={pool.hookAddress}
              protocolFeePips={pool.protocolFeePips}
              hookRegistry={hookRegistry}
            />
          ),
          tvl: formatVolume(volumes.tvl, convertFiatAmountFormatted),
          volume24h: formatVolume(volumes.volume24h, convertFiatAmountFormatted),
          volume30d: formatVolume(volumes.volume30d, convertFiatAmountFormatted),
          volOverTvl: pool.volOverTvl,
          apr: pool.apr,
          totalApr: pool.totalApr,
          rewards: pool.rewards,
          link: getPoolLink(pool, { chainId, linkBuilder: getLink }),
          linkState,
          ...buildV4CurrencyId(pool, chainId),
          analytics: {
            elementName: ElementName.PoolsTableRow,
            properties: {
              chain_id: chainId,
              pool_address: poolIdOrHash,
              token0_address: pool.token0?.address,
              token0_symbol: pool.token0?.symbol,
              token1_address: pool.token1?.address,
              token1_symbol: pool.token1?.symbol,
              pool_list_index: index,
              pool_list_rank: poolSortRank,
              pool_list_length: pools.length,
              search_pool_input: filterString,
            },
          },
        }
      }) ?? [],
    [
      convertFiatAmountFormatted,
      defaultChainId,
      hookRegistry,
      filterString,
      getLink,
      linkState,
      pools,
      selectedPoolId,
      selectedPoolChainId,
    ],
  )

  // The shared table body renders an error as a skeleton plus an error box, whatever rows it holds, so
  // handing it a load-more failure would blank a list the user is already reading. Only an empty list
  // becomes the error state; a failed page keeps what loaded and lets the next scroll retry.
  const showError = !!error && !pools?.length
  const showLoadingSkeleton = loading || showError
  const media = useMedia()
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTableValues>()
    const filteredColumns = [
      !media.lg && !hideIndex
        ? columnHelper.accessor((row) => row.index, {
            id: 'index',
            size: 60,
            header: () => (
              <HeaderCell justifyContent="flex-start">
                <Text variant="body3" color="$neutral2">
                  #
                </Text>
              </HeaderCell>
            ),
            cell: (index) => (
              <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
                <TableText>{index.getValue?.()}</TableText>
              </Cell>
            ),
          })
        : null,
      columnHelper.accessor((row) => row.poolDescription, {
        id: 'poolDescription',
        size: media.lg ? 210 : 240,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2">
              {t('common.pool')}
            </Text>
          </HeaderCell>
        ),
        cell: (poolDescription) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
            {poolDescription.getValue?.()}
          </Cell>
        ),
      }),
      !hiddenColumns?.includes(PoolSortFields.TVL)
        ? columnHelper.accessor((row) => row.tvl, {
            id: 'tvl',
            size: 110,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.TVL}
                  isCurrentSortMethod={sortMethod === PoolSortFields.TVL}
                  direction={orderDirection}
                  surface={surface}
                />
              </HeaderCell>
            ),
            cell: (tvl) => (
              <Cell loading={showLoadingSkeleton}>
                <TableText>{tvl.getValue?.()}</TableText>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.Volume24h)
        ? columnHelper.accessor((row) => row.volume24h, {
            id: 'volume24h',
            size: 110,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.Volume24h}
                  isCurrentSortMethod={sortMethod === PoolSortFields.Volume24h}
                  direction={orderDirection}
                  surface={surface}
                />
              </HeaderCell>
            ),
            cell: (volume24h) => {
              return (
                <Cell loading={showLoadingSkeleton}>
                  <TableText>{volume24h?.getValue?.()}</TableText>
                </Cell>
              )
            },
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.Volume30D)
        ? columnHelper.accessor((row) => row.volume30d, {
            id: 'volume30Day',
            size: 110,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.Volume30D}
                  isCurrentSortMethod={sortMethod === PoolSortFields.Volume30D}
                  direction={orderDirection}
                  surface={surface}
                />
              </HeaderCell>
            ),
            cell: (volumeWeek) => (
              <Cell loading={showLoadingSkeleton}>
                <TableText>{volumeWeek.getValue?.()}</TableText>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.VolOverTvl)
        ? columnHelper.accessor((row) => row.volOverTvl, {
            id: 'volOverTvl',
            size: 110,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.VolOverTvl}
                  isCurrentSortMethod={sortMethod === PoolSortFields.VolOverTvl}
                  direction={orderDirection}
                  surface={surface}
                />
              </HeaderCell>
            ),
            cell: (volOverTvl) => (
              <Cell loading={showLoadingSkeleton}>
                <TableText>
                  {formatNumberOrString({
                    value: volOverTvl.getValue?.(),
                    type: NumberType.TokenQuantityStats,
                    placeholder: '-',
                  })}
                </TableText>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.Apr)
        ? columnHelper.accessor((row) => row.apr, {
            id: 'apr',
            size: 110,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.Apr}
                  isCurrentSortMethod={sortMethod === PoolSortFields.Apr}
                  direction={orderDirection}
                  surface={surface}
                />
              </HeaderCell>
            ),
            cell: ({ row }: { row?: Row<PoolTableValues> }) => {
              if (!row?.original) {
                return <Cell loading={showLoadingSkeleton} />
              }

              const { apr, totalApr, token0CurrencyId, token1CurrencyId, rewards } = row.original

              return (
                <AprCell
                  apr={apr}
                  totalApr={totalApr}
                  rewards={showBoostedApr ? rewards : undefined}
                  token0CurrencyId={token0CurrencyId}
                  token1CurrencyId={token1CurrencyId}
                  isLoading={showLoadingSkeleton}
                />
              )
            },
          })
        : null,
    ]
    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [
    media.lg,
    hiddenColumns,
    hideIndex,
    showBoostedApr,
    showLoadingSkeleton,
    t,
    sortMethod,
    orderDirection,
    formatNumberOrString,
    surface,
  ])

  return (
    <Table
      columns={columns}
      data={poolTableValues}
      loading={loading}
      error={showError}
      rowHeight={ROW_HEIGHT}
      compactRowHeight={ROW_HEIGHT}
      loadMore={loadMore}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      defaultPinnedColumns={['index', 'poolDescription']}
      virtualized={virtualized}
      stickyTopOffset={stickyTopOffset}
    />
  )
}

interface AprCellProps {
  /** Served fee APR in percent units; undefined renders the formatter's placeholder. */
  apr?: number
  /** Served fee + reward APR. */
  totalApr?: number
  isLoading: boolean
  /** The pool's live per-token boosts, as served; empty renders the bare fee APR. */
  rewards?: PositionRewardApr[]
  token0CurrencyId?: string
  token1CurrencyId?: string
}

function AprCell({ apr, totalApr, isLoading, rewards, token0CurrencyId, token1CurrencyId }: AprCellProps) {
  const { formatPercent } = useLocalizationContext()
  const formattedApr = formatPercent(apr)

  // Split so rows without a reward campaign don't pay for the currency lookups the tooltip needs.
  if (!rewards?.length) {
    return (
      <Cell loading={isLoading}>
        <TableText>{formattedApr}</TableText>
      </Cell>
    )
  }

  return (
    <BoostedAprCell
      apr={apr}
      totalApr={totalApr}
      formattedApr={formattedApr}
      isLoading={isLoading}
      rewards={rewards}
      token0CurrencyId={token0CurrencyId}
      token1CurrencyId={token1CurrencyId}
    />
  )
}

function BoostedAprCell({
  apr,
  totalApr,
  formattedApr,
  isLoading,
  rewards,
  token0CurrencyId,
  token1CurrencyId,
}: Omit<AprCellProps, 'rewards'> & { formattedApr: string; rewards: PositionRewardApr[] }) {
  const currency0Info = useCurrencyInfo(token0CurrencyId)
  const currency1Info = useCurrencyInfo(token1CurrencyId)

  return (
    <Cell loading={isLoading}>
      <MouseoverTooltip
        padding={0}
        text={
          <PoolAprTooltip
            currency0Info={currency0Info}
            currency1Info={currency1Info}
            poolApr={apr}
            rewards={rewards}
            totalApr={totalApr}
          />
        }
        size={TooltipSize.Small}
        placement="top"
      >
        <Flex alignItems="flex-end" gap="$spacing6">
          <TableText>{formattedApr}</TableText>
          <RewardAprBadge rewards={rewards} size="sm" hideBackground />
        </Flex>
      </MouseoverTooltip>
    </Cell>
  )
}
