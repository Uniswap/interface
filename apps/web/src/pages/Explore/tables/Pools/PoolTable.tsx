/* oxlint-disable typescript/no-unnecessary-condition max-lines */
import { createColumnHelper, Row } from '@tanstack/react-table'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { UniverseChainId, areEvmAddressesEqual } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, type FlexCompatProps, Text, useMedia, iconSizes } from '@universe/mycelium'
import { TestID } from '@universe/test'
import {
  forwardRef,
  type ForwardRefExoticComponent,
  Fragment,
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
import { FeeDisplay } from 'uniswap/src/components/FeeDisplay/FeeDisplay'
import { UniswapBuiltHookMark } from 'uniswap/src/components/logos/UniswapBuiltHookMark'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { BIPS_BASE, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useListPoolCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery'
import { feeAmountToBps } from 'uniswap/src/features/fees/feeUnits'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getHookRegistryKey, useHookRegistryMap } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import {
  type UniswapHookProvenance,
  useUniswapHookProvenance,
} from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { getPoolName } from 'uniswap/src/features/pools/names'
import { orderPoolDataByQuoteToken } from 'uniswap/src/features/pools/quoteToken'
import type { FeeData, PositionRewardApr } from 'uniswap/src/features/positions/types'
import { ElementName, InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { ExploreTableSurface } from 'uniswap/src/features/telemetry/types'
import { selectRowCategoryTag } from 'uniswap/src/features/tokenCategories/selectRowCategoryTag'
import { TokenCategoryTag } from 'uniswap/src/features/tokenCategories/TokenCategoryTag'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { type FiatNumberType, NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { Portal } from '~/components/Popups/Portal'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { CollapsibleCellLayout } from '~/components/Table/PinnedColumns/collapse/CollapsibleCellLayout'
import {
  FLUSH_CELL_PADDING,
  FLUSH_COLLAPSED_COLUMN_WIDTH,
  FLUSH_HEADER_CELL_PADDING,
} from '~/components/Table/PinnedColumns/collapse/utils'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { EllipsisText, TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import type { TableEmptyState, TableErrorState } from '~/components/Table/types'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { PoolSortFields } from '~/data/pools/poolStats'
import { tokenStatToCurrency, OrderDirection } from '~/data/util'
import { useEffectiveVolumeTimePeriod } from '~/features/Explore/hooks/useEffectiveVolumeTimePeriod'
import { EXPLORE_API_PAGE_SIZE } from '~/features/Explore/state/constants'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { LIVE_POOL_VOLUME_PERIODS, type LivePoolVolumePeriod } from '~/features/Explore/timeLabels'
import { DynamicFeeIcon, DynamicFeeTooltipContent, useDynamicFeeLabel } from '~/features/Liquidity/DynamicFee'
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
import {
  getPoolSortMethodForPeriod,
  getPoolVolumePeriodStats,
  POOL_VOLUME_PERIOD_CONFIG,
} from '~/pages/Explore/tables/Pools/poolVolumePeriods'
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
const MOBILE_POOL_COLUMN_SIZE_PX = 210

interface PoolTableValues {
  index: number
  poolDescription: ReactElement
  tvl: string
  apr?: number
  totalApr?: number
  volume24h: string
  volume30d: string
  selectedVolume: string
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
  // Rows carry the lowercase label `convertPoolToPoolStat` stamps on them ('v4'), not an uppercase
  // 'V4' — comparing against 'V4' directly never matched, so v4 rows lost their currency ids.
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

function formatOptionalFiatAmount(
  amount: number | undefined,
  convertFiatAmountFormatted: (amount: number, type: FiatNumberType) => string,
): string {
  return amount === undefined
    ? '-'
    : convertFiatAmountFormatted(amount, amount === 0 ? NumberType.FiatStandard : NumberType.FiatTokenStats)
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

/** A dynamic tier's live rate behind an icon, with a hover note that the fee floats. */
function DynamicFeeLabel({ currentLpFeePips }: { currentLpFeePips?: number }) {
  const { label, hasCurrentFee } = useDynamicFeeLabel(currentLpFeePips)

  // InfoTooltip's own wrapper shrinks, which would ellipsize the rate in a squeezed row; the rate stays
  // whole and the hook name gives up the space instead.
  return (
    <Flex flexShrink={0}>
      <InfoTooltip
        placement="top"
        trigger={
          <Flex row alignItems="center" gap="$gap4" flexShrink={0}>
            <DynamicFeeIcon />
            <Text variant="body3" color="$neutral2" numberOfLines={1}>
              {label}
            </Text>
          </Flex>
        }
        text={<DynamicFeeTooltipContent hasCurrentFee={hasCurrentFee} />}
      />
    </Flex>
  )
}

function PoolDetailsLine({
  chainId,
  protocolVersion,
  feeTier,
  currentLpFeePips,
  hookAddress,
  protocolFeePips,
  hookRegistry,
  categoryTag,
}: {
  chainId: UniverseChainId
  protocolVersion?: string
  feeTier?: FeeData
  currentLpFeePips?: number
  hookAddress?: string
  protocolFeePips?: number
  hookRegistry?: Map<string, HookEntry>
  /** Sits at the end of the details line, not beside the pair name (Figma). */
  categoryTag?: PoolCategory
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
  const isDynamic = feeTier ? isDynamicFeeTier(feeTier) : false
  // Dynamic tiers are excluded: their feeAmount is a sentinel, not a rate.
  const feeBreakdown =
    feeTier && restProtocolVersion !== undefined && !isDynamic
      ? getFeeBreakdown({
          feeAmount: feeTier.feeAmount,
          protocolVersion: restProtocolVersion,
          servedProtocolFeeBps: protocolFeePips !== undefined ? feeAmountToBps(protocolFeePips) : undefined,
        })
      : undefined

  const feeNode = !feeTier ? null : isDynamic ? (
    <DynamicFeeLabel currentLpFeePips={currentLpFeePips} />
  ) : (
    <FeeDisplay feeBreakdown={feeBreakdown}>
      <Text variant="body3" color="$neutral2" numberOfLines={1} flexShrink={0}>
        {formatPercent(feeTier.feeAmount / BIPS_BASE, 4)}
      </Text>
    </FeeDisplay>
  )

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

  const segments = [
    protocolVersion ? (
      <Text key="version" variant="body3" color="$neutral2" numberOfLines={1} flexShrink={0}>
        {protocolVersion}
      </Text>
    ) : null,
    feeNode ? <Fragment key="fee">{feeNode}</Fragment> : null,
    hookNode ? <Fragment key="hook">{hookNode}</Fragment> : null,
  ].filter((segment) => segment !== null)

  if (segments.length === 0 && !categoryTag) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="$gap4" minWidth={0} maxWidth="100%">
      {segments.map((segment, index) => (
        <Fragment key={segment.key}>
          {index > 0 ? (
            <Text variant="body3" color="$neutral2" flexShrink={0}>
              ·
            </Text>
          ) : null}
          {segment}
        </Fragment>
      ))}
      {categoryTag ? (
        <Flex ml="$spacing4" flexShrink={0} testID={TestID.PoolRowCategoryTag}>
          <TokenCategoryTag category={categoryTag} />
        </Flex>
      ) : null}
    </Flex>
  )
}

function PoolDescription({
  token0,
  token1,
  isToken0Quote,
  chainId,
  protocolVersion,
  feeTier,
  currentLpFeePips,
  hookAddress,
  protocolFeePips,
  hookRegistry,
  categoryTag,
}: {
  token0: PoolStat['token0']
  token1: PoolStat['token1']
  isToken0Quote?: boolean
  chainId: UniverseChainId
  protocolVersion?: string
  feeTier?: FeeData
  currentLpFeePips?: number
  hookAddress?: string
  protocolFeePips?: number
  hookRegistry?: Map<string, HookEntry>
  categoryTag?: PoolCategory
}) {
  // Unwrapping is the protocol's call: a v2/v3 wrapped-native leg reads as the native currency, a v4
  // one stays as served (v4 holds native and wrapped native as two distinct currencies).
  const restProtocolVersion = getProtocolVersionFromLabel(protocolVersion)
  const currency0 = getCurrencyWithUnwrap(token0 ? tokenStatToCurrency(token0) : undefined, restProtocolVersion)
  const currency1 = getCurrencyWithUnwrap(token1 ? tokenStatToCurrency(token1) : undefined, restProtocolVersion)
  // The served symbol is the fallback for a leg with no `Currency` to read one off (e.g. Tempo's
  // native placeholder, which `tokenStatToCurrency` can't build).
  const symbol0 = currency0?.symbol ?? token0?.symbol
  const symbol1 = currency1?.symbol ?? token1?.symbol
  const currencies = orderPoolDataByQuoteToken({ token0IsQuote: isToken0Quote, data0: currency0, data1: currency1 })
  const poolName = getPoolName({ symbol0, symbol1, token0IsQuote: isToken0Quote })

  return (
    <CollapsibleCellLayout
      flush
      gapPx={8}
      logo={
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
      }
    >
      <Flex gap="$spacing2">
        <EllipsisText>{poolName}</EllipsisText>
        <PoolDetailsLine
          chainId={chainId}
          protocolVersion={protocolVersion}
          feeTier={feeTier}
          currentLpFeePips={currentLpFeePips}
          hookAddress={hookAddress}
          protocolFeePips={protocolFeePips}
          hookRegistry={hookRegistry}
          categoryTag={categoryTag}
        />
      </Flex>
    </CollapsibleCellLayout>
  )
}

// Figma tags Explore, category page and Create Position pool browser rows; TDP and discovery rows stay plain.
const CATEGORY_TAG_SURFACES: ReadonlySet<ExploreTableSurface> = new Set([
  'explore',
  'category-details',
  'add-liquidity-pool-browser',
])
const EMPTY_POOL_CATEGORIES: PoolCategory[] = []

function PoolTableHeader({
  category,
  isCurrentSortMethod,
  direction,
  surface,
  label,
  sortable = true,
}: {
  category: PoolSortFields
  isCurrentSortMethod: boolean
  direction: OrderDirection
  surface: ExploreTableSurface
  label?: string
  sortable?: boolean
}) {
  const { setSort } = usePoolTableStoreActions()
  const handleSortCategory = useCallback(() => {
    const ascending = isCurrentSortMethod && direction !== OrderDirection.Asc
    setSort(category, ascending)
    sendAnalyticsEvent(InterfaceEventName.ExploreTableSorted, {
      table_type: 'pools',
      sort_method: category,
      sort_direction: ascending ? OrderDirection.Asc : OrderDirection.Desc,
      surface,
    })
    // No-ops outside Explore (TDP, add-liquidity pool browser) — the section anchor only exists there.
    scrollToExploreTokenSection()
  }, [setSort, category, surface, isCurrentSortMethod, direction])
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

  if (!sortable) {
    return <HeaderSortText variant="body3">{label ?? HEADER_TEXT[category]}</HeaderSortText>
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
            {label ?? HEADER_TEXT[category]}
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
  categoryId,
  categoryUnverified = false,
}: {
  staticSize?: boolean
  pageSize?: number
  surface: ExploreTableSurface
  categoryId?: string
  categoryUnverified?: boolean
}): JSX.Element {
  const chainId = useChainIdFromUrlParam()
  const isHooksExploreEnabled = useFeatureFlag(FeatureFlags.HooksExplore)
  const effectiveVolumeTimePeriod = useEffectiveVolumeTimePeriod(LIVE_POOL_VOLUME_PERIODS)
  const volumeTimePeriod = isHooksExploreEnabled && surface === 'explore' ? effectiveVolumeTimePeriod : undefined
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const { resetSort } = usePoolTableStoreActions()
  const poolsFilter = useExploreTablesFilterStore((s) => s.poolsFilter)
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const { setPoolsAprRange } = useExploreTablesFilterStoreActions()

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
      sortBy: getPoolSortMethodForPeriod(sortMethod, volumeTimePeriod),
      sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc,
    },
    // The filter's Network control reads and writes this same URL path segment (see ExploreTableFilters),
    // so the two can't disagree.
    chainId,
    poolsFilter,
    categoryId,
  })

  // An unverified category may be a bogus slug the BE rejects or empties; keep the skeleton up until
  // ListCategories settles it, since a fallback to All is about to replace this table anyway.
  const holdUnverifiedResult = categoryUnverified && (isError || pools?.length === 0)

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
        isLoading: isLoading || holdUnverifiedResult,
        isError: isError && !categoryUnverified,
        loadMore,
        chainId: listChainId,
        virtualized: true,
        filterString,
      }}
      staticSize={staticSize}
      pageSize={pageSize}
      surface={surface}
      scopedCategoryId={categoryId}
      volumeTimePeriod={volumeTimePeriod}
    />
  )
}

export const ExploreTopPoolTable = memo(function ExploreTopPoolTable({
  staticSize,
  pageSize,
  surface,
  categoryId,
  categoryUnverified,
}: {
  // Render a fixed set of rows with no infinite scroll / internal scroll area (e.g. discovery surfaces).
  staticSize?: boolean
  pageSize?: number
  surface: ExploreTableSurface
  /** Pool category ListPools filter; undefined renders the unfiltered (All) list. */
  categoryId?: string
  /** The category id came from the URL and ListCategories hasn't confirmed it yet. */
  categoryUnverified?: boolean
}) {
  return (
    <PoolTableStoreContextProvider>
      <ExploreTopPoolTableContent
        staticSize={staticSize}
        pageSize={pageSize}
        surface={surface}
        categoryId={categoryId}
        categoryUnverified={categoryUnverified}
      />
    </PoolTableStoreContextProvider>
  )
})

const TopPoolTable = memo(function TopPoolTable({
  topPoolData,
  pageSize = EXPLORE_API_PAGE_SIZE,
  staticSize = false,
  surface,
  scopedCategoryId,
  volumeTimePeriod,
}: {
  topPoolData: TopPoolTableProps
  volumeTimePeriod?: LivePoolVolumePeriod
  pageSize?: number
  staticSize?: boolean
  surface: ExploreTableSurface
  scopedCategoryId?: string
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
        mobileFullBleed
        pools={displayedPools}
        loading={isLoading}
        error={isError}
        loadMore={staticSize ? undefined : effectiveLoadMore}
        maxWidth={1200}
        chainId={chainId}
        surface={surface}
        scopedCategoryId={scopedCategoryId}
        filterString={filterString}
        volumeTimePeriod={volumeTimePeriod}
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
  errorState,
  emptyState,
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
  scopedCategoryId,
  virtualized,
  stickyTopOffset,
  mobileFullBleed,
  chainId: listChainId,
  filterString,
  volumeTimePeriod,
  showHookBadges = true,
  rowAnalyticsProperties,
  columnOrder,
}: {
  pools?: PoolStat[]
  showHookBadges?: boolean
  rowAnalyticsProperties?: Record<string, unknown>
  columnOrder?: readonly (keyof PoolTableValues)[]
  volumeTimePeriod?: LivePoolVolumePeriod
  loading: boolean
  error?: boolean
  errorState?: TableErrorState
  emptyState?: TableEmptyState
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
  surface: ExploreTableSurface
  /** Category every row already belongs to (selected chip, category page); rows tag the next one instead. */
  scopedCategoryId?: string
  // The matching row renders with a selected highlight — used by the add-liquidity pool browser,
  // where the table stays visible after a pool is picked.
  selectedPoolId?: string
  selectedPoolChainId?: UniverseChainId
  virtualized?: boolean
  /** Extra clearance between the app header and the sticky header row; see `TableProps`. */
  stickyTopOffset?: number
  /** See `TableProps.mobileFullBleed`. */
  mobileFullBleed?: boolean
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
  const effectiveSortMethod = getPoolSortMethodForPeriod(sortMethod, volumeTimePeriod)
  const volumeConfig = volumeTimePeriod !== undefined ? POOL_VOLUME_PERIOD_CONFIG[volumeTimePeriod] : undefined
  const volumeSortMethod = volumeConfig?.sortField ?? PoolSortFields.Volume24h
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  // One registry fetch for the whole list (not one per row), scoped to the list's chain filter and
  // skipped when nothing listed has a hook (v2/v3-only lists, zero-address v4 hooks).
  const hasHookedPool =
    showHookBadges &&
    !!pools?.some((pool) => !!pool.hookAddress && !areEvmAddressesEqual(pool.hookAddress, ZERO_ADDRESS))
  const hookRegistry = useHookRegistryMap({ chainId: listChainId, enabled: hasHookedPool })
  // One cached ListCategories read per table; the hook also disables itself while the flag is off.
  const showCategoryTags = CATEGORY_TAG_SURFACES.has(surface)
  const { data: poolCategories = EMPTY_POOL_CATEGORIES } = useListPoolCategoriesQuery({ enabled: showCategoryTags })

  const poolTableValues: PoolTableValues[] | undefined = useMemo(
    () =>
      pools?.map((pool, index) => {
        const poolSortRank = index + 1
        const chainId = pool.chainId
        const poolIdOrHash = pool.id
        const volumes = getPoolVolumes(pool)
        const periodStats =
          volumeTimePeriod !== undefined ? getPoolVolumePeriodStats(pool, volumeTimePeriod) : undefined
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
              isToken0Quote={pool.isToken0Quote}
              chainId={chainId}
              protocolVersion={pool.protocolVersion?.toLowerCase()}
              feeTier={pool.feeTier ?? undefined}
              currentLpFeePips={pool.currentLpFeePips}
              hookAddress={showHookBadges ? pool.hookAddress : undefined}
              protocolFeePips={pool.protocolFeePips}
              hookRegistry={hookRegistry}
              categoryTag={
                showCategoryTags
                  ? selectRowCategoryTag({
                      categoryIds: pool.categoryIds,
                      categories: poolCategories,
                      skipCategoryId: scopedCategoryId,
                    })
                  : undefined
              }
            />
          ),
          tvl: formatOptionalFiatAmount(pool.totalLiquidity?.value, convertFiatAmountFormatted),
          volume24h: formatVolume(volumes.volume24h, convertFiatAmountFormatted),
          volume30d: formatVolume(volumes.volume30d, convertFiatAmountFormatted),
          selectedVolume: formatOptionalFiatAmount(periodStats?.volume, convertFiatAmountFormatted),
          volOverTvl: periodStats ? periodStats.volOverTvl : pool.volOverTvl,
          apr: pool.apr,
          totalApr: pool.totalApr,
          rewards: pool.rewards,
          link: getPoolLink(pool, { chainId, linkBuilder: getLink }),
          linkState,
          ...buildV4CurrencyId(pool, chainId),
          analytics: {
            elementName: ElementName.PoolsTableRow,
            properties: {
              ...rowAnalyticsProperties,
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
      hookRegistry,
      filterString,
      getLink,
      linkState,
      pools,
      selectedPoolId,
      selectedPoolChainId,
      showCategoryTags,
      poolCategories,
      scopedCategoryId,
      showHookBadges,
      rowAnalyticsProperties,
      volumeTimePeriod,
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
        size: media.lg ? MOBILE_POOL_COLUMN_SIZE_PX : 240,
        meta: { collapsedWidth: FLUSH_COLLAPSED_COLUMN_WIDTH },
        header: () => (
          <HeaderCell justifyContent="flex-start" {...(media.lg ? FLUSH_HEADER_CELL_PADDING : undefined)}>
            <Text variant="body3" color="$neutral2" numberOfLines={1}>
              {t('common.pool')}
            </Text>
          </HeaderCell>
        ),
        cell: (poolDescription) => (
          <Cell
            justifyContent="flex-start"
            loading={showLoadingSkeleton}
            {...(media.lg ? FLUSH_CELL_PADDING : undefined)}
          >
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
                  isCurrentSortMethod={effectiveSortMethod === PoolSortFields.TVL}
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
        ? columnHelper.accessor((row) => (volumeTimePeriod !== undefined ? row.selectedVolume : row.volume24h), {
            id: volumeTimePeriod !== undefined ? 'volume' : 'volume24h',
            size: 110,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={volumeSortMethod}
                  isCurrentSortMethod={effectiveSortMethod === volumeSortMethod}
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
      volumeTimePeriod === undefined && !hiddenColumns?.includes(PoolSortFields.Volume30D)
        ? columnHelper.accessor((row) => row.volume30d, {
            id: 'volume30Day',
            size: 110,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.Volume30D}
                  isCurrentSortMethod={effectiveSortMethod === PoolSortFields.Volume30D}
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
                  label={volumeTimePeriod !== undefined ? t('pool.volumeToTvl') : undefined}
                  sortable={volumeConfig?.ratioSortable ?? true}
                  isCurrentSortMethod={effectiveSortMethod === PoolSortFields.VolOverTvl}
                  direction={orderDirection}
                  surface={surface}
                />
              </HeaderCell>
            ),
            cell: (volOverTvl) => {
              const value = volOverTvl.getValue?.()
              return (
                <Cell loading={showLoadingSkeleton}>
                  <TableText>
                    {formatNumberOrString({
                      value,
                      type:
                        volumeTimePeriod !== undefined && value === 0
                          ? NumberType.TokenNonTx
                          : NumberType.TokenQuantityStats,
                      placeholder: '-',
                    })}
                  </TableText>
                </Cell>
              )
            },
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
                  isCurrentSortMethod={effectiveSortMethod === PoolSortFields.Apr}
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
    const visibleColumns = filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> =>
      Boolean(column),
    )
    if (columnOrder) {
      const positions = new Map<string, number>(columnOrder.map((id, index): [string, number] => [id, index]))
      visibleColumns.sort(
        (a, b) => (positions.get(a.id ?? '') ?? columnOrder.length) - (positions.get(b.id ?? '') ?? columnOrder.length),
      )
    }
    return visibleColumns
  }, [
    media.lg,
    columnOrder,
    hiddenColumns,
    hideIndex,
    showBoostedApr,
    showLoadingSkeleton,
    t,
    effectiveSortMethod,
    volumeSortMethod,
    volumeTimePeriod,
    volumeConfig?.ratioSortable,
    orderDirection,
    formatNumberOrString,
    surface,
  ])

  return (
    <Table
      mobileFullBleed={mobileFullBleed}
      columns={columns}
      data={poolTableValues}
      loading={loading}
      error={showError}
      errorState={errorState}
      emptyState={emptyState}
      rowHeight={ROW_HEIGHT}
      compactRowHeight={ROW_HEIGHT}
      loadMore={loadMore}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      defaultPinnedColumns={['index', 'poolDescription']}
      virtualized={virtualized}
      stickyTopOffset={stickyTopOffset}
      // Mobile: the pinned pool column (the only pinned one once `index` is hidden) collapses to its pair logo on horizontal scroll.
      collapsiblePinnedColumnId={media.lg ? 'poolDescription' : undefined}
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
