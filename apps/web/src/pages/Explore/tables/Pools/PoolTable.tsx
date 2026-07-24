/* oxlint-disable typescript/no-unnecessary-condition max-lines */

import { ApolloError } from '@apollo/client'
import { createColumnHelper, Row } from '@tanstack/react-table'
import { TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { Percent, Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, useMedia } from 'ui/src'
import { FeeDisplay } from 'uniswap/src/components/FeeDisplay/FeeDisplay'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { BIPS_BASE, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { UNI } from 'uniswap/src/constants/tokens'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { feeAmountToBps } from 'uniswap/src/features/fees/feeUnits'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { shouldReverseForWaterfall } from 'uniswap/src/features/tokens/waterfallPriority'
import { areEvmAddressesEqual } from 'uniswap/src/utils/addresses'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { type FiatNumberType, NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { supportedChainIdFromGQLChain } from '~/appGraphql/data/chainUtils'
import { PoolSortFields, TablePool } from '~/appGraphql/data/pools/useTopPools'
import { gqlToCurrency, OrderDirection, unwrapToken } from '~/appGraphql/data/util'
import { CurrencyLogo } from '~/components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { Portal } from '~/components/Popups/Portal'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { EllipsisText, TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { TABLE_PAGE_SIZE } from '~/features/Explore/state'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { useTopPools } from '~/features/Explore/state/topPools/useTopPools'
import { servedFeeKey, useServedProtocolFees, type ServedProtocolFeePool } from '~/features/fees/useServedProtocolFees'
import { HookDetailsModal } from '~/features/Liquidity/HookDetailsModal'
import { HookTooltip } from '~/features/Liquidity/HookTooltip'
import { LPIncentiveFeeStatTooltip } from '~/features/Liquidity/LPIncentives/LPIncentiveFeeStatTooltip'
import { isDynamicFeeTier } from '~/features/Liquidity/utils/feeTiers'
import { getProtocolVersionFromLabel } from '~/features/Liquidity/utils/protocolVersion'
import { getHookRegistryKey, useHookRegistryMap } from '~/hooks/useHookRegistryMap'
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

const TableWrapper = styled(Flex, {
  m: '0 auto',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
})

// Taller than the default row: the Pool column stacks the pair name over its protocol/fee/hook line
// (matches the two-line rows in the Explore tokens table).
const ROW_HEIGHT = 64

interface PoolTableValues {
  index: number
  poolDescription: ReactElement
  tvl: string
  apr: Percent
  volume24h: string
  volume30d: string
  volOverTvl?: number
  link: string
  linkState?: { entryPoint?: string }
  rewardApr?: number
  token0CurrencyId?: string
  token1CurrencyId?: string
  selected?: boolean
}

function isGqlPool(pool: TablePool | PoolStat): pool is TablePool & { hash: string } {
  return 'hash' in pool
}

function getPoolIdOrHash(pool: TablePool | PoolStat): string {
  return isGqlPool(pool) ? pool.hash : pool.id
}

function getPoolVolumes(pool: TablePool | PoolStat): { tvl: number; volume24h: number; volume30d: number } {
  if (isGqlPool(pool)) {
    return { tvl: pool.tvl ?? 0, volume24h: pool.volume24h ?? 0, volume30d: pool.volume30d ?? 0 }
  }
  return {
    tvl: pool.totalLiquidity?.value ?? 0,
    volume24h: pool.volume1Day?.value ?? 0,
    volume30d: pool.volume30Day?.value ?? 0,
  }
}

function buildV4CurrencyId(
  pool: TablePool | PoolStat,
  chainId: UniverseChainId,
): {
  token0CurrencyId?: string
  token1CurrencyId?: string
} {
  if (pool.protocolVersion !== GraphQLApi.ProtocolVersion.V4) {
    return {}
  }
  const token0 = pool.token0?.address || getNativeAddress(chainId)
  const token1 = pool.token1?.address || getNativeAddress(chainId)
  return {
    token0CurrencyId: token0 ? buildCurrencyId(chainId, token0) : undefined,
    token1CurrencyId: token1 ? buildCurrencyId(chainId, token1) : undefined,
  }
}

function getPoolLink(
  pool: TablePool | PoolStat,
  opts: { chainId: UniverseChainId; linkBuilder?: (data: PoolLinkData) => string },
): string {
  const poolIdOrHash = getPoolIdOrHash(pool)
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

// Hook name rendered as plain text: hovering shows the full name and address, clicking opens the
// hook details dialog instead of following the row's link to the pool page.
function HookNameText({ hookEntry, chainId }: { hookEntry: HookEntry; chainId: UniverseChainId }) {
  const [showDetails, setShowDetails] = useState(false)

  const handlePress = useEvent((e: { preventDefault: () => void; stopPropagation: () => void }) => {
    // The whole row is a link to the pool page — keep this press from triggering it.
    e.preventDefault()
    e.stopPropagation()
    setShowDetails(true)
  })

  return (
    <>
      {/* minWidth: 0 lands on the Popover's inline-block reference wrapper: as a flex item of the
          details row its default min-width:auto floors it at the full nowrap name width, so squeezed
          rows overflowed the cell and hard-clipped instead of letting the Text below ellipsize. */}
      <MouseoverTooltip text={<HookTooltip hookEntry={hookEntry} />} placement="top" style={{ minWidth: 0 }}>
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
      </MouseoverTooltip>
      {showDetails ? (
        // Portal the dialog to the body: this cell lives inside the row's link to the pool page,
        // and a dialog mounted inside an anchor would nest anchors and bubble clicks into it.
        <Portal>
          <HookDetailsModal hookEntry={hookEntry} chainId={chainId} isOpen onClose={() => setShowDetails(false)} />
        </Portal>
      ) : null}
    </>
  )
}

// Second line of the Pool column: protocol version · fee tier · hook name (v4 pools with a
// registry-known hook). Unknown hooks render nothing extra — just protocol · fee tier.
function PoolDetailsLine({
  chainId,
  protocolVersion,
  feeTier,
  hookAddress,
  protocolFeePips,
}: {
  chainId: UniverseChainId
  protocolVersion?: string
  feeTier?: FeeData
  hookAddress?: string
  protocolFeePips?: number
}) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const hookRegistry = useHookRegistryMap()
  const isFeeDisplayEnabled = useFeatureFlag(FeatureFlags.V4ProtocolFeeDisplay)

  const hookEntry =
    hookAddress && !areEvmAddressesEqual(hookAddress, ZERO_ADDRESS)
      ? hookRegistry?.get(getHookRegistryKey({ chainId, hookAddress }))
      : undefined
  const restProtocolVersion = getProtocolVersionFromLabel(protocolVersion)
  // Flag on: render the cross-version FeeDisplay (LP headline + hover breakdown) in place of the
  // plain % text. The protocol fee is backend-served or nothing — the FE never computes fees, so
  // without a served value FeeDisplay drops the tooltip and the plain % headline stands alone. pips →
  // bps is exact (÷100). Dynamic tiers keep the plain "Dynamic" label — their feeAmount is a sentinel,
  // not a rate.
  const feeBreakdown =
    isFeeDisplayEnabled && feeTier && restProtocolVersion !== undefined && !isDynamicFeeTier(feeTier)
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

  if (!detailText && !hookEntry) {
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
      {hookEntry ? (
        <>
          {detailText ? (
            <Text variant="body3" color="$neutral2" flexShrink={0}>
              ·
            </Text>
          ) : null}
          <HookNameText hookEntry={hookEntry} chainId={chainId} />
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
}: {
  token0?: Token | TokenStats
  token1?: Token | TokenStats
  chainId: UniverseChainId
  protocolVersion?: string
  feeTier?: FeeData
  hookAddress?: string
  protocolFeePips?: number
}) {
  const currency0 = token0 ? gqlToCurrency(token0) : undefined
  const currency1 = token1 ? gqlToCurrency(token1) : undefined
  const reverse = currency0 && currency1 ? shouldReverseForWaterfall(currency0, currency1) : false
  const [baseToken, quoteToken] = reverse ? [token1, token0] : [token0, token1]
  const currencies = reverse ? [currency1, currency0] : [currency0, currency1]

  return (
    <Flex row gap="$gap8" alignItems="center" maxWidth="100%">
      <DoubleCurrencyLogo currencies={currencies} size={24} />
      <Flex flex={1} minWidth={0} gap="$spacing2">
        <EllipsisText>
          {baseToken?.symbol}/{quoteToken?.symbol}
        </EllipsisText>
        <PoolDetailsLine
          chainId={chainId}
          protocolVersion={protocolVersion}
          feeTier={feeTier}
          hookAddress={hookAddress}
          protocolFeePips={protocolFeePips}
        />
      </Flex>
    </Flex>
  )
}

function PoolTableHeader({
  category,
  isCurrentSortMethod,
  direction,
}: {
  category: PoolSortFields
  isCurrentSortMethod: boolean
  direction: OrderDirection
}) {
  const { setSort } = usePoolTableStoreActions()
  const handleSortCategory = useCallback(() => setSort(category), [setSort, category])
  const { t } = useTranslation()

  const HEADER_DESCRIPTIONS = {
    [PoolSortFields.TVL]: t('stats.tvl'),
    [PoolSortFields.Volume24h]: t('stats.volume.1d'),
    [PoolSortFields.Volume30D]: t('pool.volume.thirtyDay'),
    [PoolSortFields.VolOverTvl]: undefined,
    [PoolSortFields.Apr]: t('pool.apr.description'),
    [PoolSortFields.RewardApr]: (
      <>
        {t('pool.incentives.merklDocs')}
        <LearnMoreLink textVariant="buttonLabel4" url={UniswapStaticUrls.merklDocsUrl} />
      </>
    ),
  }
  const HEADER_TEXT = {
    [PoolSortFields.TVL]: t('common.totalValueLocked'),
    [PoolSortFields.Volume24h]: t('stats.volume.1d.short'),
    [PoolSortFields.Volume30D]: t('pool.volume.thirtyDay.short'),
    [PoolSortFields.Apr]: t('pool.aprText'),
    [PoolSortFields.VolOverTvl]: t('pool.volOverTvl'),
    [PoolSortFields.RewardApr]: t('pool.apr.reward'),
  }

  return (
    <Flex width="100%">
      <MouseoverTooltip
        disabled={!HEADER_DESCRIPTIONS[category]}
        size={TooltipSize.Small}
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
}
function ExploreTopPoolTableContent({
  staticSize,
  pageSize,
}: {
  staticSize?: boolean
  pageSize?: number
}): JSX.Element {
  const chainId = useChainIdFromUrlParam()
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const { resetSort } = usePoolTableStoreActions()
  const selectedProtocol = useExploreTablesFilterStore((s) => s.selectedProtocol)

  useEffect(() => {
    resetSort()
  }, [resetSort])

  const { topPools, isLoading, isError, loadMore } = useTopPools({
    sortState: {
      sortBy: sortMethod,
      sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc,
    },
    chainId,
    protocol: selectedProtocol,
  })

  return (
    <TopPoolTable
      topPoolData={{ topPools, isLoading, isError, loadMore }}
      staticSize={staticSize}
      pageSize={pageSize}
    />
  )
}

export const ExploreTopPoolTable = memo(function ExploreTopPoolTable({
  staticSize,
  pageSize,
}: {
  // Render a fixed set of rows with no infinite scroll / internal scroll area (e.g. discovery surfaces).
  staticSize?: boolean
  pageSize?: number
} = {}) {
  return (
    <PoolTableStoreContextProvider>
      <ExploreTopPoolTableContent staticSize={staticSize} pageSize={pageSize} />
    </PoolTableStoreContextProvider>
  )
})

const TopPoolTable = memo(function TopPoolTable({
  topPoolData,
  pageSize = TABLE_PAGE_SIZE,
  staticSize = false,
  forcePinning = false,
}: {
  topPoolData: TopPoolTableProps
  pageSize?: number
  staticSize?: boolean
  forcePinning?: boolean
}) {
  const { topPools, isLoading, isError, loadMore: backendLoadMore } = topPoolData

  // Client-side pagination fallback (for legacy mode when backend loadMore is undefined).
  // useSimplePagination paces the reveal so the load-more indicator shows, and gates loadMore once
  // all loaded rows are displayed.
  const { page, loadMore: clientLoadMore } = useSimplePagination({ totalCount: topPools?.length, pageSize })

  // Use backend loadMore if available, otherwise fall back to client-side slicing
  const effectiveLoadMore = backendLoadMore ?? clientLoadMore
  const displayedPools = staticSize
    ? topPools?.slice(0, pageSize) // Static: fixed number of rows, no pagination
    : backendLoadMore
      ? topPools // Backend pagination: use all fetched pools
      : topPools?.slice(0, page * pageSize) // Client-side: slice by page

  return (
    <TableWrapper data-testid="top-pools-explore-table">
      <PoolsTable
        pools={displayedPools}
        loading={isLoading}
        error={isError}
        loadMore={staticSize ? undefined : effectiveLoadMore}
        maxWidth={1200}
        forcePinning={forcePinning}
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
  forcePinning,
  getLink,
  linkState,
  selectedPoolId,
  selectedPoolChainId,
}: {
  pools?: TablePool[] | PoolStat[]
  loading: boolean
  error?: ApolloError | boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  maxWidth?: number
  maxHeight?: number
  hiddenColumns?: PoolSortFields[]
  hideIndex?: boolean
  forcePinning?: boolean
  getLink?: (pool: PoolLinkData) => string
  linkState?: { entryPoint?: string }
  // The pool currently selected in the URL (pool id/hash + its chain). The matching row renders
  // with a selected highlight — used by the add-liquidity pool browser where the table stays
  // visible after a pool is picked.
  selectedPoolId?: string
  selectedPoolChainId?: UniverseChainId
}) {
  const { t } = useTranslation()
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const isLPIncentivesTablesColumnEnabled = useFeatureFlag(FeatureFlags.LpIncentivesTablesColumn)

  const { formatPercent, formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const { defaultChainId } = useEnabledChains()
  const isFeeDisplayEnabled = useFeatureFlag(FeatureFlags.V4ProtocolFeeDisplay)
  // ListTopPools serves no fee fields — fees come from batched GetProtocolFees per visible page.
  const protocolFeePools = useMemo<ServedProtocolFeePool[]>(() => {
    if (!pools?.length) {
      return []
    }
    const result: ServedProtocolFeePool[] = []
    for (const pool of pools) {
      const protocolVersion = getProtocolVersionFromLabel(pool.protocolVersion?.toLowerCase())
      if (protocolVersion === undefined) {
        continue
      }
      result.push({
        chainId: supportedChainIdFromGQLChain(pool.token0?.chain as GraphQLApi.Chain) ?? defaultChainId,
        protocolVersion,
        poolIdOrHash: getPoolIdOrHash(pool),
      })
    }
    return result
  }, [pools, defaultChainId])
  const servedProtocolFees = useServedProtocolFees({ pools: protocolFeePools, enabled: isFeeDisplayEnabled })

  const poolTableValues: PoolTableValues[] | undefined = useMemo(
    () =>
      pools?.map((pool, index) => {
        const poolSortRank = index + 1
        const chainId = supportedChainIdFromGQLChain(pool.token0?.chain as GraphQLApi.Chain) ?? defaultChainId
        const poolIdOrHash = getPoolIdOrHash(pool)
        const volumes = getPoolVolumes(pool)
        // The row link is built from this same `poolIdOrHash`, so the URL route param matches it
        // verbatim for the clicked pool — exact equality is correct (and avoids address-casing rules
        // that don't apply to v4 pool-id hashes).
        const selected =
          selectedPoolId !== undefined && chainId === selectedPoolChainId && poolIdOrHash === selectedPoolId

        return {
          index: poolSortRank,
          selected,
          poolDescription: (
            <PoolDescription
              token0={unwrapToken(chainId, pool.token0) as TokenStats | Token | undefined}
              token1={unwrapToken(chainId, pool.token1) as TokenStats | Token | undefined}
              chainId={chainId}
              protocolVersion={pool.protocolVersion?.toLowerCase()}
              feeTier={pool.feeTier ?? undefined}
              hookAddress={pool.hookAddress}
              protocolFeePips={servedProtocolFees.get(servedFeeKey({ chainId, poolIdOrHash }))}
            />
          ),
          tvl: formatVolume(volumes.tvl, convertFiatAmountFormatted),
          volume24h: formatVolume(volumes.volume24h, convertFiatAmountFormatted),
          volume30d: formatVolume(volumes.volume30d, convertFiatAmountFormatted),
          volOverTvl: pool.volOverTvl,
          apr: pool.apr,
          rewardApr: pool.boostedApr,
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
      filterString,
      getLink,
      linkState,
      pools,
      selectedPoolId,
      selectedPoolChainId,
      servedProtocolFees,
    ],
  )

  const showLoadingSkeleton = loading || !!error
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
      !hiddenColumns?.includes(PoolSortFields.Apr)
        ? columnHelper.accessor((row) => row.apr, {
            id: 'apr',
            size: 120,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.Apr}
                  isCurrentSortMethod={sortMethod === PoolSortFields.Apr}
                  direction={orderDirection}
                />
              </HeaderCell>
            ),
            cell: (oneDayApr) => (
              <Cell loading={showLoadingSkeleton}>
                <TableText>{formatPercent(oneDayApr.getValue?.()?.toSignificant())}</TableText>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.RewardApr) && isLPIncentivesEnabled && isLPIncentivesTablesColumnEnabled
        ? columnHelper.accessor((row) => row.rewardApr, {
            id: PoolSortFields.RewardApr,
            size: 120,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.RewardApr}
                  isCurrentSortMethod={sortMethod === PoolSortFields.RewardApr}
                  direction={orderDirection}
                />
              </HeaderCell>
            ),
            sortingFn: 'basic',
            cell: ({ row }: { row?: Row<PoolTableValues> }) => {
              if (!row?.original) {
                return <Cell loading={showLoadingSkeleton} />
              }

              const { apr, token0CurrencyId, token1CurrencyId, rewardApr } = row.original

              return (
                <RewardAprCell
                  apr={apr}
                  rewardApr={rewardApr}
                  token0CurrencyId={token0CurrencyId}
                  token1CurrencyId={token1CurrencyId}
                  isLoading={showLoadingSkeleton}
                />
              )
            },
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.Volume24h)
        ? columnHelper.accessor((row) => row.volume24h, {
            id: 'volume24h',
            size: 120,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.Volume24h}
                  isCurrentSortMethod={sortMethod === PoolSortFields.Volume24h}
                  direction={orderDirection}
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
            size: 120,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.Volume30D}
                  isCurrentSortMethod={sortMethod === PoolSortFields.Volume30D}
                  direction={orderDirection}
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
    ]
    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [
    media.lg,
    hiddenColumns,
    hideIndex,
    isLPIncentivesEnabled,
    isLPIncentivesTablesColumnEnabled,
    showLoadingSkeleton,
    t,
    sortMethod,
    orderDirection,
    formatNumberOrString,
    formatPercent,
  ])

  return (
    <Table
      columns={columns}
      data={poolTableValues}
      loading={loading}
      error={error}
      rowHeight={ROW_HEIGHT}
      compactRowHeight={ROW_HEIGHT}
      loadMore={loadMore}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      defaultPinnedColumns={['index', 'poolDescription']}
      forcePinning={forcePinning}
    />
  )
}

interface RewardAprCellProps {
  apr: Percent
  isLoading: boolean
  rewardApr?: number
  token0CurrencyId?: string
  token1CurrencyId?: string
}

function RewardAprCell({ apr, isLoading, rewardApr, token0CurrencyId, token1CurrencyId }: RewardAprCellProps) {
  const { formatPercent } = useLocalizationContext()
  const currency0Info = useCurrencyInfo(token0CurrencyId)
  const currency1Info = useCurrencyInfo(token1CurrencyId)

  const poolApr = parseFloat(apr.toFixed(2))
  const totalApr = poolApr + (rewardApr ?? 0)

  if (!rewardApr) {
    return (
      <Cell loading={isLoading} gap="$spacing2">
        <TableText color="$neutral3">-</TableText>
      </Cell>
    )
  }

  return (
    <MouseoverTooltip
      padding={0}
      text={
        <LPIncentiveFeeStatTooltip
          currency0Info={currency0Info}
          currency1Info={currency1Info}
          poolApr={poolApr}
          lpIncentiveRewardApr={rewardApr}
          totalApr={totalApr}
        />
      }
      size={TooltipSize.Small}
      placement="top"
    >
      <Cell loading={isLoading} gap="$spacing2">
        <TableText color="$neutral3">+</TableText>
        <TableText color="$accent1" mr="$spacing4">
          {formatPercent(rewardApr)}
        </TableText>
        <CurrencyLogo currency={UNI[UniverseChainId.Mainnet]} size={16} />
      </Cell>
    </MouseoverTooltip>
  )
}
