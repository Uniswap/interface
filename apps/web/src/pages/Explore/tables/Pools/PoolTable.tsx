/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable max-lines */

import { ApolloError } from '@apollo/client'
import { createColumnHelper, Row } from '@tanstack/react-table'
import { TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { Percent, Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, ReactElement, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, useMedia } from 'ui/src'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { UNI } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { supportedChainIdFromGQLChain } from '~/appGraphql/data/chainUtils'
import { PoolSortFields, TablePool } from '~/appGraphql/data/pools/useTopPools'
import { gqlToCurrency, OrderDirection, unwrapToken } from '~/appGraphql/data/util'
import { PortfolioLogo } from '~/components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { FeeData } from '~/components/Liquidity/Create/types'
import LPIncentiveFeeStatTooltip from '~/components/Liquidity/LPIncentives/LPIncentiveFeeStatTooltip'
import { isDynamicFeeTier } from '~/components/Liquidity/utils/feeTiers'
import CurrencyLogo from '~/components/Logo/CurrencyLogo'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import {
  ClickableHeaderRow,
  EllipsisText,
  HeaderArrow,
  HeaderCell,
  HeaderSortText,
  TableText,
} from '~/components/Table/styled'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import useSimplePagination from '~/hooks/useSimplePagination'
import { useExploreTablesFilterStore } from '~/pages/Explore/exploreTablesFilterStore'
import {
  PoolTableStoreContextProvider,
  usePoolTableStore,
  usePoolTableStoreActions,
} from '~/pages/Explore/tables/Pools/poolTableStore'
import { TABLE_PAGE_SIZE } from '~/state/explore'
import { useTopPools } from '~/state/explore/topPools/useTopPools'
import { PoolStat } from '~/state/explore/types'
import { getChainUrlParam, useChainIdFromUrlParam } from '~/utils/chainParams'

const TableWrapper = styled(Flex, {
  m: '0 auto',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
})

interface PoolTableValues {
  index: number
  poolDescription: ReactElement
  tvl: string
  apr: Percent
  volume24h: string
  volume30d: string
  volOverTvl?: number
  link: string
  protocolVersion?: string
  feeTier?: FeeData
  rewardApr?: number
  token0CurrencyId?: string
  token1CurrencyId?: string
}

function PoolDescription({
  token0,
  token1,
  chainId,
}: {
  token0?: Token | TokenStats
  token1?: Token | TokenStats
  chainId: UniverseChainId
}) {
  const currencies = [token0 ? gqlToCurrency(token0) : undefined, token1 ? gqlToCurrency(token1) : undefined]

  return (
    <Flex row gap="$gap8" alignItems="center" maxWidth="100%">
      <PortfolioLogo currencies={currencies} chainId={chainId} size={24} />
      <EllipsisText>
        {token0?.symbol}/{token1?.symbol}
      </EllipsisText>
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
        <LearnMoreLink textVariant="buttonLabel4" url={uniswapUrls.merklDocsUrl} />
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
        text={HEADER_DESCRIPTIONS[category]}
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
function ExploreTopPoolTableContent(): JSX.Element {
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

  return <TopPoolTable topPoolData={{ topPools, isLoading, isError, loadMore }} />
}

export const ExploreTopPoolTable = memo(function ExploreTopPoolTable() {
  return (
    <PoolTableStoreContextProvider>
      <ExploreTopPoolTableContent />
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

  // Client-side pagination fallback (for legacy mode when loadMore is undefined)
  const { page, loadMore: clientLoadMore } = useSimplePagination()

  // Use backend loadMore if available, otherwise fall back to client-side slicing
  const effectiveLoadMore = backendLoadMore ?? clientLoadMore
  const displayedPools = backendLoadMore
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
        maxHeight={staticSize ? 1000 : undefined}
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
  forcePinning,
}: {
  pools?: TablePool[] | PoolStat[]
  loading: boolean
  error?: ApolloError | boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  maxWidth?: number
  maxHeight?: number
  hiddenColumns?: PoolSortFields[]
  forcePinning?: boolean
}) {
  const { formatPercent, formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const { defaultChainId } = useEnabledChains()
  const { t } = useTranslation()
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)

  const poolTableValues: PoolTableValues[] | undefined = useMemo(
    () =>
      pools?.map((pool, index) => {
        const poolSortRank = index + 1
        const isGqlPool = 'hash' in pool
        const chainId = supportedChainIdFromGQLChain(pool.token0?.chain as GraphQLApi.Chain) ?? defaultChainId

        const token0Address = pool.token0?.address || getNativeAddress(chainId)
        const token1Address = pool.token1?.address || getNativeAddress(chainId)
        const currency0Id =
          pool.protocolVersion === GraphQLApi.ProtocolVersion.V4 && token0Address
            ? buildCurrencyId(chainId, token0Address)
            : undefined
        const currency1Id =
          pool.protocolVersion === GraphQLApi.ProtocolVersion.V4 && token1Address
            ? buildCurrencyId(chainId, token1Address)
            : undefined

        const parseVolume = (amount: number | undefined): string => {
          return amount ? convertFiatAmountFormatted(amount, NumberType.FiatTokenStats) : '-'
        }

        return {
          index: poolSortRank,
          poolDescription: (
            <PoolDescription
              token0={unwrapToken(chainId, pool.token0) as TokenStats | Token | undefined}
              token1={unwrapToken(chainId, pool.token1) as TokenStats | Token | undefined}
              chainId={chainId}
            />
          ),
          protocolVersion: pool.protocolVersion?.toLowerCase(),
          feeTier: pool.feeTier,
          tvl: parseVolume((isGqlPool ? pool.tvl : pool.totalLiquidity?.value) ?? 0),
          volume24h: parseVolume((isGqlPool ? pool.volume24h : pool.volume1Day?.value) ?? 0),
          volume30d: parseVolume((isGqlPool ? pool.volume30d : pool.volume30Day?.value) ?? 0),
          volOverTvl: pool.volOverTvl,
          apr: pool.apr,
          rewardApr: pool.boostedApr,
          link: `/explore/pools/${getChainUrlParam(chainId)}/${isGqlPool ? pool.hash : pool.id}`,
          token0CurrencyId: currency0Id,
          token1CurrencyId: currency1Id,
          analytics: {
            elementName: ElementName.PoolsTableRow,
            properties: {
              chain_id: chainId,
              pool_address: isGqlPool ? pool.hash : pool.id,
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
    [convertFiatAmountFormatted, defaultChainId, filterString, pools],
  )

  const showLoadingSkeleton = loading || !!error
  const media = useMedia()
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTableValues>()
    const filteredColumns = [
      !media.lg
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
        size: media.lg ? 170 : 180,
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
      columnHelper.accessor((row) => row.protocolVersion, {
        id: 'protocolVersion',
        size: 80,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2">
              {t('common.protocol')}
            </Text>
          </HeaderCell>
        ),
        cell: (protocolVersion) => (
          <Cell justifyContent="flex-end" loading={showLoadingSkeleton}>
            <TableText>{protocolVersion.getValue?.() ?? '-'}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.feeTier, {
        id: 'feeTier',
        size: 80,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('fee.tier')}
            </Text>
          </HeaderCell>
        ),
        cell: (feeTier) => (
          <Cell loading={showLoadingSkeleton}>
            <TableText>
              {feeTier.getValue?.()
                ? `${isDynamicFeeTier(feeTier.getValue()!) ? t('common.dynamic') : formatPercent(feeTier.getValue()!.feeAmount / BIPS_BASE, 4)}`
                : '-'}
            </TableText>
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
      !hiddenColumns?.includes(PoolSortFields.RewardApr) && isLPIncentivesEnabled
        ? columnHelper.accessor((row) => row.rewardApr, {
            id: PoolSortFields.RewardApr,
            size: 130,
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
                return null
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
            size: 120,
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
    isLPIncentivesEnabled,
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
      v2={false}
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
