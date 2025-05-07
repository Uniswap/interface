import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { Percent } from '@uniswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import {
  ClickableHeaderRow,
  EllipsisText,
  HeaderArrow,
  HeaderCell,
  HeaderSortText,
  TableText,
} from 'components/Table/styled'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { PoolSortFields, TablePool } from 'graphql/data/pools/useTopPools'
import { OrderDirection, gqlToCurrency, supportedChainIdFromGQLChain, unwrapToken } from 'graphql/data/util'
import useSimplePagination from 'hooks/useSimplePagination'
import { useAtom } from 'jotai'
import { atomWithReset, useAtomValue, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { exploreProtocolVersionFilterAtom } from 'pages/Explore/ProtocolFilter'
import { ReactElement, memo, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TABLE_PAGE_SIZE, giveExploreStatDefaultValue } from 'state/explore'
import { useExploreContextTopPools } from 'state/explore/topPools'
import { PoolStat } from 'state/explore/types'
import { Flex, Text, styled, useMedia } from 'ui/src'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { Chain, Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainUrlParam } from 'utils/chainParams'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const TableWrapper = styled(Flex, {
  m: '0 auto',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
})

export const PoolDetailsBadge = styled(Text, {
  py: 2,
  px: 6,
  backgroundColor: '$surface2',
  color: '$neutral2',
  variants: {
    $position: {
      right: {
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
      },
      left: {
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
      },
    },
  },
})

interface PoolTableValues {
  index: number
  poolDescription: ReactElement
  tvl: number
  apr: Percent
  volume24h: number
  volume30d: number
  volOverTvl?: number
  link: string
  protocolVersion?: string
  feeTier?: number
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
      {/* TODO: Figure out if still needed for the table */}
      {/* <Flex row gap="$gap4" alignItems="center">
         {hookAddress && (
          <ExternalLink
            href={getExplorerLink(chainId, hookAddress, ExplorerDataType.ADDRESS)}
            onClick={(e) => e.stopPropagation()}
          >
            <PoolDetailsBadge variant="body4" {...ClickableTamaguiStyle}>
              {shortenAddress(hookAddress, 0, 4)}
            </PoolDetailsBadge>
          </ExternalLink>
        )}
      </Flex> */}
    </Flex>
  )
}

// Used to keep track of sorting state for Pool Tables
// declared as atomWithReset because sortMethodAtom and sortAscendingAtom are shared across multiple Pool Table instances - want to be able to reset sorting state between instances
export const sortMethodAtom = atomWithReset<PoolSortFields>(PoolSortFields.TVL)
export const sortAscendingAtom = atomWithReset<boolean>(false)

function useSetSortMethod(newSortMethod: PoolSortFields) {
  const [sortMethod, setSortMethod] = useAtom(sortMethodAtom)
  const setSortAscending = useUpdateAtom(sortAscendingAtom)

  return useCallback(() => {
    if (sortMethod === newSortMethod) {
      setSortAscending((sortAscending) => !sortAscending)
    } else {
      setSortMethod(newSortMethod)
      setSortAscending(false)
    }
  }, [sortMethod, setSortMethod, setSortAscending, newSortMethod])
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
  const handleSortCategory = useSetSortMethod(category)
  const { t } = useTranslation()

  const HEADER_DESCRIPTIONS = {
    [PoolSortFields.TVL]: t('stats.tvl'),
    [PoolSortFields.Volume24h]: t('stats.volume.1d'),
    [PoolSortFields.Volume30D]: t('pool.volume.thirtyDay'),
    [PoolSortFields.VolOverTvl]: undefined,
    [PoolSortFields.Apr]: t('pool.apr.description'),
  }
  const HEADER_TEXT = {
    [PoolSortFields.TVL]: t('common.totalValueLocked'),
    [PoolSortFields.Volume24h]: t('stats.volume.1d.short'),
    [PoolSortFields.Volume30D]: t('pool.volume.thirtyDay.short'),
    [PoolSortFields.Apr]: t('pool.apr'),
    [PoolSortFields.VolOverTvl]: t('pool.volOverTvl'),
  }

  return (
    <Flex width="100%">
      <MouseoverTooltip
        disabled={!HEADER_DESCRIPTIONS[category]}
        size={TooltipSize.Max}
        text={HEADER_DESCRIPTIONS[category]}
        placement="top"
      >
        <ClickableHeaderRow justifyContent="flex-end" onPress={handleSortCategory} group>
          <HeaderArrow orderDirection={direction} size={14} opacity={isCurrentSortMethod ? 1 : 0} />
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
}

export const ExploreTopPoolTable = memo(function ExploreTopPoolTable() {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)
  const selectedProtocol = useAtomValue(exploreProtocolVersionFilterAtom)

  const resetSortMethod = useResetAtom(sortMethodAtom)
  const resetSortAscending = useResetAtom(sortAscendingAtom)
  useEffect(() => {
    resetSortMethod()
    resetSortAscending()
  }, [resetSortAscending, resetSortMethod])

  const { topPools, isLoading, isError } = useExploreContextTopPools(
    {
      sortBy: sortMethod,
      sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc,
    },
    selectedProtocol,
  )

  return <TopPoolTable topPoolData={{ topPools, isLoading, isError }} />
})

export const TopPoolTable = memo(function TopPoolTable({
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
  const { topPools, isLoading, isError } = topPoolData
  const { page, loadMore } = useSimplePagination()

  return (
    <TableWrapper data-testid="top-pools-explore-table">
      <PoolsTable
        pools={topPools?.slice(0, page * pageSize)}
        loading={isLoading}
        error={isError}
        loadMore={staticSize ? undefined : loadMore}
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
  const { formatNumber, formatPercent } = useFormatter()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const sortMethod = useAtomValue(sortMethodAtom)
  const filterString = useAtomValue(exploreSearchStringAtom)
  const { defaultChainId } = useEnabledChains()
  const { t } = useTranslation()

  const poolTableValues: PoolTableValues[] | undefined = useMemo(
    () =>
      pools?.map((pool, index) => {
        const poolSortRank = index + 1
        const isGqlPool = 'hash' in pool
        const chainId = supportedChainIdFromGQLChain(pool.token0?.chain as Chain) ?? defaultChainId
        return {
          index: poolSortRank,
          poolDescription: (
            <PoolDescription
              token0={unwrapToken(chainId, pool.token0)}
              token1={unwrapToken(chainId, pool.token1)}
              chainId={chainId}
            />
          ),
          protocolVersion: pool.protocolVersion?.toLowerCase(),
          feeTier: pool.feeTier,
          tvl: isGqlPool ? pool.tvl : giveExploreStatDefaultValue(pool.totalLiquidity?.value),
          volume24h: isGqlPool ? pool.volume24h : giveExploreStatDefaultValue(pool.volume1Day?.value),
          volume30d: isGqlPool ? pool.volume30d : giveExploreStatDefaultValue(pool.volume30Day?.value),
          volOverTvl: pool.volOverTvl,
          apr: pool.apr,
          link: `/explore/pools/${getChainUrlParam(chainId ?? defaultChainId)}/${isGqlPool ? pool.hash : pool.id}`,
          analytics: {
            elementName: InterfaceElementName.POOLS_TABLE_ROW,
            properties: {
              chain_id: chainId,
              pool_address: isGqlPool ? pool.hash : pool?.id,
              token0_address: pool?.token0?.address,
              token0_symbol: pool?.token0?.symbol,
              token1_address: pool?.token1?.address,
              token1_symbol: pool?.token1?.symbol,
              pool_list_index: index,
              pool_list_rank: poolSortRank,
              pool_list_length: pools.length,
              search_pool_input: filterString,
            },
          },
        }
      }) ?? [],
    [defaultChainId, filterString, pools],
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
        size: media.lg ? 170 : 240,
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
        size: 120,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2">
              {t('common.protocol')}
            </Text>
          </HeaderCell>
        ),
        cell: (protocolVersion) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
            <TableText>{protocolVersion.getValue?.() ?? '-'}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.feeTier, {
        id: 'feeTier',
        size: 120,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('common.fee')}
            </Text>
          </HeaderCell>
        ),
        cell: (feeTier) => (
          <Cell loading={showLoadingSkeleton}>
            <TableText>{feeTier.getValue?.() ? `${(feeTier.getValue()! / BIPS_BASE).toFixed(2)}%` : '-'}</TableText>
          </Cell>
        ),
      }),
      !hiddenColumns?.includes(PoolSortFields.TVL)
        ? columnHelper.accessor((row) => row.tvl, {
            id: 'tvl',
            size: 100,
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
                <TableText>{formatNumber({ input: tvl.getValue?.(), type: NumberType.FiatTokenStats })}</TableText>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.Apr)
        ? columnHelper.accessor((row) => row.apr, {
            id: 'apr',
            size: 100,
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
                <TableText>{formatPercent(oneDayApr.getValue?.())}</TableText>
              </Cell>
            ),
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
            cell: (volume24h) => (
              <Cell loading={showLoadingSkeleton}>
                <TableText>
                  {formatNumber({ input: volume24h.getValue?.(), type: NumberType.FiatTokenStats })}
                </TableText>
              </Cell>
            ),
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
                <TableText>
                  {formatNumber({ input: volumeWeek.getValue?.(), type: NumberType.FiatTokenStats })}
                </TableText>
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
                  {formatNumber({
                    input: volOverTvl.getValue?.(),
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
  }, [formatNumber, formatPercent, hiddenColumns, orderDirection, showLoadingSkeleton, sortMethod, t, media.lg])

  return (
    <Table
      columns={columns}
      data={poolTableValues ?? []}
      loading={loading}
      error={error}
      loadMore={loadMore}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      defaultPinnedColumns={['index', 'poolDescription']}
      forcePinning={forcePinning}
    />
  )
}
