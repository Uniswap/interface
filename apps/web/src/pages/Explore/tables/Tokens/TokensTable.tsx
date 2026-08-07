/* oxlint-disable typescript/no-unnecessary-condition */

import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber.web'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { FiatNumberType, NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { SparklineChart } from '~/components/Charts/SparklineChart'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { SparklineMap } from '~/data/types'
import { getTokenDetailsURL, OrderDirection, unwrapToken } from '~/data/util'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { getExploreMultichainExpandRowMetrics } from '~/features/Explore/state/listTokens/utils/getExploreMultichainExpandRowMetrics'
import { multichainTokenKey } from '~/features/Explore/state/listTokens/utils/multichainTokenKey'
import {
  getChainIdsByVolume,
  getVolumeForTimePeriod,
  pickAllowedPrimaryDeployment,
} from '~/features/Explore/state/listTokens/utils/multichainVolume'
import { useExploreParams } from '~/pages/Explore/redirects'
import { LivePriceCell } from '~/pages/Explore/tables/Tokens/LivePriceCell'
import { getTokenDescriptionColumnSize, TokenDescription } from '~/pages/Explore/tables/Tokens/TokenDescription'
import { TokenTableHeader } from '~/pages/Explore/tables/Tokens/TokenTableHeader'
import { useTokenTableSortStore } from '~/pages/Explore/tables/Tokens/tokenTableSortStore'
import type { TokenTableValue } from '~/pages/Explore/tables/Tokens/tokenTableTypes'
import { hasVolumeBreakdown } from '~/pages/Explore/tables/Tokens/VolumeByNetworkPopover/utils'
import { VolumeByNetworkPopover } from '~/pages/Explore/tables/Tokens/VolumeByNetworkPopover/VolumeByNetworkPopover'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

const VOLUME_INFO_ICON_WIDTH = 16

const ROW_HEIGHT = 64

export function TokenTable({
  tokens,
  tokenSortRank,
  sparklines,
  loading,
  error,
  loadMore,
}: {
  tokens?: readonly RankedMultichainToken[]
  tokenSortRank: Record<string, number>
  sparklines: SparklineMap
  loading: boolean
  error?: ApolloError | boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
}) {
  const { t } = useTranslation()
  const trace = useTrace()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const { defaultChainId } = useEnabledChains()
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const { sortMethod, sortAscending } = useTokenTableSortStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const { filterString, timePeriod } = useExploreTablesFilterStore((s) => ({
    filterString: s.filterString,
    timePeriod: s.timePeriod,
  }))
  const chainFilter = useExploreParams().chainName
  const exploreChainId = chainFilter ? getChainIdFromChainUrlParam(chainFilter) : undefined
  const featureFlaggedChainIds = useFeatureFlaggedChainIds()

  const tokenTableValues: TokenTableValue[] | undefined = useMemo(
    () =>
      tokens?.flatMap((rankedToken, i) => {
        const mc = rankedToken.multichainToken
        // Constrained pick: the row identity chain (address, testId, analytics, TDP link target)
        // must belong to the same filtered set that gates the label/hover/link, or a stale cached
        // leg on a since-disabled chain could become the row's identity.
        const primary = mc
          ? pickAllowedPrimaryDeployment({
              rankedToken,
              chainId: exploreChainId,
              allowedChainIds: featureFlaggedChainIds,
            })
          : undefined
        if (!mc || !primary) {
          return []
        }
        const { chainId, address } = primary
        const delta1hr = mc.price?.percentChange1h
        const delta1hrAbs = delta1hr !== undefined ? Math.abs(delta1hr) : undefined
        const delta1d = mc.price?.percentChange1d
        const delta1dAbs = delta1d !== undefined ? Math.abs(delta1d) : undefined
        const rowKey = multichainTokenKey(rankedToken)
        const tokenSortIndex = tokenSortRank[rowKey]
        // Raw addresses read is safe here: it only probes the mainnet leg for native-currency
        // branding, and mainnet is always registered and never flag-gated.
        const mainnetAddress = mc.addresses[String(UniverseChainId.Mainnet)]
        const mainnetIsWrappedNative = Boolean(
          mainnetAddress &&
          areAddressesEqual({
            addressInput1: { address: mainnetAddress, chainId: UniverseChainId.Mainnet },
            addressInput2: {
              address: WRAPPED_NATIVE_CURRENCY[UniverseChainId.Mainnet]?.address,
              chainId: UniverseChainId.Mainnet,
            },
          }),
        )
        const unwrappedToken = unwrapToken(
          // Ethereum L2s each brand their native currency differently (e.g. Robinhood's is "Robinhood ETH"),
          // but they're all fundamentally the same ETH asset — so when this grouping includes a mainnet
          // deployment, prefer mainnet's canonical "Ethereum"/"ETH" branding regardless of the primary chain.
          // Otherwise (e.g. Polygon's native POL, which has no mainnet deployment), keep the primary chain's
          // own native-currency branding.
          { chainId, nativeCurrencyChainId: mainnetIsWrappedNative ? UniverseChainId.Mainnet : chainId },
          {
            address,
            name: mc.name,
            symbol: mc.symbol,
            project: { name: mc.name },
          },
        )
        const chainIdsByVolume =
          getChainIdsByVolume({ rankedToken, timePeriod, allowedChainIds: featureFlaggedChainIds }) ?? []
        // Count and TDP link mode derive from the same filtered set as the "N networks" label,
        // or a flag-disabled leg desyncs them. The volume cell's info affordance gates separately
        // on the visible breakdown (hasVolumeBreakdown), matching the popover's own condition.
        const chainCount = chainIdsByVolume.length
        const fdvValue = rankedToken.stats?.fdv
        const volumeValue = getVolumeForTimePeriod(rankedToken.stats, timePeriod)

        const parseAmount = (amount: number | undefined, type: FiatNumberType): string => {
          return amount ? convertFiatAmountFormatted(amount, type) : '-'
        }

        return [
          {
            index: tokenSortIndex,
            multichainId: mc.multichainId,
            rowKey,
            token: { chainId: chainId as UniverseChainId, address: unwrappedToken.address, price: mc.price?.spotUsd },
            mcToken: rankedToken,
            chainIdsByVolume,
            tokenDescription: (
              <TokenDescription
                chainFilter={chainFilter}
                chainIdsByVolume={chainIdsByVolume}
                name={unwrappedToken.name}
                symbol={unwrappedToken.symbol}
                address={unwrappedToken.address}
                chainId={chainId as UniverseChainId}
                logoUrl={mc.project?.logoUrl}
              />
            ),
            testId: `${TestID.TokenTableRowPrefix}${unwrappedToken.address}`,
            percentChange1hr: (
              <Flex row gap="$gap4" alignItems="center">
                <DeltaArrow delta={delta1hr} formattedDelta={formatPercent(delta1hrAbs)} />
                <AnimatedNumber numericValue={delta1hr} textVariant="$body2" value={formatPercent(delta1hrAbs)} />
              </Flex>
            ),
            percentChange1d: (
              <Flex row gap="$gap4" alignItems="center">
                <DeltaArrow delta={delta1d} formattedDelta={formatPercent(delta1dAbs)} />
                <AnimatedNumber numericValue={delta1d} textVariant="$body2" value={formatPercent(delta1dAbs)} />
              </Flex>
            ),
            fdv: parseAmount(fdvValue, NumberType.FiatTokenStats),
            fdvRawValue: fdvValue,
            volume: parseAmount(volumeValue, NumberType.FiatTokenStats),
            volumeRawValue: volumeValue,
            sparkline: (
              <SparklineChart
                width={80}
                height={20}
                multichainId={rowKey}
                pricePercentChange={delta1d}
                sparklineMap={sparklines}
              />
            ),
            link: getTokenDetailsURL({
              address: unwrappedToken.address,
              chain: toGraphQLChain(chainId ?? defaultChainId),
              chainUrlParam: chainFilter,
              chainQueryParam: !chainFilter && chainCount > 1 ? TDP_MULTICHAIN_CHAIN_QUERY_VALUE : undefined,
            }),
            analytics: {
              elementName: ElementName.TokensTableRow,
              properties: {
                chain_id: chainId,
                token_address: address,
                token_symbol: mc.symbol,
                token_list_index: i,
                token_list_rank: tokenSortIndex,
                token_list_length: tokens.length,
                time_frame: timePeriod,
                search_token_address_input: filterString,
              },
            },
            linkState: { preloadedLogoSrc: mc.project?.logoUrl },
          },
        ]
      }) ?? [],
    [
      chainFilter,
      exploreChainId,
      convertFiatAmountFormatted,
      defaultChainId,
      featureFlaggedChainIds,
      filterString,
      formatPercent,
      sparklines,
      timePeriod,
      tokenSortRank,
      tokens,
    ],
  )

  const showLoadingSkeleton = loading || !!error

  useEffect(() => {
    if (showLoadingSkeleton) {
      return
    }
    const { totalTokenRowCount, multichainRowReductionCount, multichainAssetCount } =
      getExploreMultichainExpandRowMetrics(tokens)
    sendAnalyticsEvent(UniswapEventName.MultichainExploreMetrics, {
      ...trace,
      total_token_row_count: totalTokenRowCount,
      multichain_row_reduction_count: multichainRowReductionCount,
      multichain_asset_count: multichainAssetCount,
      element: ElementName.ExploreTokensTab,
      section: SectionName.ExploreTopTokensSection,
    })
  }, [showLoadingSkeleton, tokens, trace])

  const { lg: isLg } = useMedia()
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TokenTableValue>()
    const filteredColumns = [
      !isLg
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
      columnHelper.accessor((row) => row.tokenDescription, {
        id: 'tokenDescription',
        size: getTokenDescriptionColumnSize(isLg),
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('explore.table.column.token')}
            </Text>
          </HeaderCell>
        ),
        cell: (tokenDescription) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} testId={TestID.NameCell}>
            <TableText flex={1} minWidth={0} width="100%">
              {tokenDescription.getValue?.()}
            </TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.token, {
        id: 'price',
        maxSize: 140,
        header: () => (
          <HeaderCell clickable justifyContent="flex-end">
            <TokenTableHeader
              category={TokenSortMethod.PRICE}
              isCurrentSortMethod={sortMethod === TokenSortMethod.PRICE}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (tokenCell) => (
          <Cell loading={showLoadingSkeleton} testId={TestID.PriceCell} justifyContent="flex-end">
            <LivePriceCell token={tokenCell.getValue?.()} />
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.percentChange1hr, {
        id: 'percentChange1hr',
        maxSize: 100,
        header: () => (
          <HeaderCell clickable>
            <TokenTableHeader
              category={TokenSortMethod.HOUR_CHANGE}
              isCurrentSortMethod={sortMethod === TokenSortMethod.HOUR_CHANGE}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (percentChange1hr) => (
          <Cell loading={showLoadingSkeleton}>
            <TableText>{percentChange1hr.getValue?.()}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.percentChange1d, {
        id: 'percentChange1d',
        maxSize: 140,
        header: () => (
          <HeaderCell clickable justifyContent="flex-end">
            <TokenTableHeader
              category={TokenSortMethod.DAY_CHANGE}
              isCurrentSortMethod={sortMethod === TokenSortMethod.DAY_CHANGE}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (percentChange1d) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
            <TableText>{percentChange1d.getValue?.()}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.fdv, {
        id: 'fdv',
        maxSize: 120,
        header: () => (
          <HeaderCell clickable justifyContent="flex-end">
            <TokenTableHeader
              category={TokenSortMethod.FULLY_DILUTED_VALUATION}
              isCurrentSortMethod={sortMethod === TokenSortMethod.FULLY_DILUTED_VALUATION}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (fdv) => {
          const row = fdv.row?.original as TokenTableValue | undefined
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end" testId={TestID.FdvCell}>
              <AnimatedNumber
                ellipsis
                numericValue={row?.fdvRawValue}
                textVariant="$body2"
                value={fdv.getValue?.() ?? '-'}
              />
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => row.volume, {
        id: 'volume',
        meta: { overflowVisible: true },
        maxSize: 150,
        header: () => (
          <HeaderCell clickable>
            <TokenTableHeader
              category={TokenSortMethod.VOLUME}
              isCurrentSortMethod={sortMethod === TokenSortMethod.VOLUME}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (volume) => {
          const row = volume.row?.original as TokenTableValue | undefined
          if (!row) {
            return (
              <Cell loading={showLoadingSkeleton} grow overflow="visible" testId={TestID.VolumeCell}>
                <AnimatedNumber
                  ellipsis
                  alignRight
                  numericValue={undefined}
                  textVariant="$body2"
                  value={volume.getValue?.() ?? '-'}
                />
              </Cell>
            )
          }
          // Same gate as the popover's own showPopover, so the icon can never render without a
          // breakdown behind it (a stats-less leg raises the network count but adds no row).
          const showBreakdownAffordance = hasVolumeBreakdown({
            rankedToken: row.mcToken,
            timePeriod,
            visibleChainIds: row.chainIdsByVolume,
          })
          return (
            <Cell loading={showLoadingSkeleton} grow overflow="visible" testId={TestID.VolumeCell}>
              <Flex flex={1} minWidth={0} justifyContent="flex-end">
                <VolumeByNetworkPopover
                  rankedToken={row.mcToken}
                  timePeriod={timePeriod}
                  visibleChainIds={row.chainIdsByVolume}
                >
                  <Flex position="relative">
                    {/* Named trade: the cell keeps the backend aggregate (the value the column is
                        sorted by), while the popover header shows the visible-leg sum its rows'
                        percentages are computed against; they differ when a leg is hidden or
                        stats-less. Filtering the cell would desync it from the sort order. */}
                    <AnimatedNumber
                      ellipsis
                      alignRight
                      numericValue={row.volumeRawValue}
                      textVariant="$body2"
                      value={volume.getValue?.() ?? '-'}
                    />
                    {showBreakdownAffordance ? (
                      <Flex
                        centered
                        position="absolute"
                        width={VOLUME_INFO_ICON_WIDTH}
                        alignItems="flex-end"
                        top={0}
                        right={`-${VOLUME_INFO_ICON_WIDTH}px`}
                        bottom={0}
                        opacity={0}
                        cursor="default"
                        transition="opacity 0.15s ease"
                        $group-hover={{ opacity: 1 }}
                      >
                        <InfoCircle color="$neutral3" size="$icon.12" />
                      </Flex>
                    ) : null}
                  </Flex>
                </VolumeByNetworkPopover>
              </Flex>
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => row.sparkline, {
        id: 'sparkline',
        maxSize: 120,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('explore.tokens.table.column.sparkline')}
            </Text>
          </HeaderCell>
        ),
        cell: (sparkline) => <Cell loading={showLoadingSkeleton}>{sparkline.getValue?.()}</Cell>,
      }),
    ]

    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [orderDirection, showLoadingSkeleton, sortMethod, isLg, t, timePeriod])

  return (
    <Table
      columns={columns}
      data={tokenTableValues}
      loading={loading}
      error={error}
      rowHeight={ROW_HEIGHT}
      compactRowHeight={ROW_HEIGHT}
      loadMore={loadMore}
      maxWidth={1200}
      defaultPinnedColumns={['index', 'tokenDescription']}
      virtualized={isV2TokensEnabled}
      getRowId={(row) => row.rowKey}
    />
  )
}
