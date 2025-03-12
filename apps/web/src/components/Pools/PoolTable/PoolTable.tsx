import { ApolloError } from '@apollo/client'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { Percent } from '@uniswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from 'components/Table/styled'
import { EllipsisText } from 'components/Tokens/TokenTable'
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
import { ExternalLink, TamaguiClickableStyle } from 'theme/components'
import { Flex, Text, styled } from 'ui/src'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { Chain, ProtocolVersion, Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
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
}

function PoolDescription({
  token0,
  token1,
  feeTier,
  chainId,
  protocolVersion,
  hookAddress,
}: {
  token0?: Token | TokenStats
  token1?: Token | TokenStats
  feeTier?: number
  chainId: UniverseChainId
  protocolVersion?: ProtocolVersion | string
  hookAddress?: string
}) {
  const currencies = [token0 ? gqlToCurrency(token0) : undefined, token1 ? gqlToCurrency(token1) : undefined]

  return (
    <Flex row gap="$gap8" alignItems="center">
      <PortfolioLogo currencies={currencies} chainId={chainId} size={28} />
      <EllipsisText>
        {token0?.symbol}/{token1?.symbol}
      </EllipsisText>
      <Flex row gap="$gap4" alignItems="center">
        {protocolVersion && (
          <PoolDetailsBadge variant="body4" $position="left">
            {protocolVersion.toLowerCase()}
          </PoolDetailsBadge>
        )}
        {hookAddress && (
          <ExternalLink
            href={getExplorerLink(chainId, hookAddress, ExplorerDataType.ADDRESS)}
            onClick={(e) => e.stopPropagation()}
          >
            <PoolDetailsBadge variant="body4" {...TamaguiClickableStyle}>
              {shortenAddress(hookAddress, 0)}
            </PoolDetailsBadge>
          </ExternalLink>
        )}
        {feeTier && (
          <PoolDetailsBadge variant="body4" $position="right">
            {feeTier / BIPS_BASE}%
          </PoolDetailsBadge>
        )}
      </Flex>
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
    <MouseoverTooltip
      disabled={!HEADER_DESCRIPTIONS[category]}
      size={TooltipSize.Max}
      text={HEADER_DESCRIPTIONS[category]}
      placement="top"
    >
      <ClickableHeaderRow justifyContent="flex-end" onPress={handleSortCategory}>
        {isCurrentSortMethod && <HeaderArrow direction={direction} />}
        <HeaderSortText active={isCurrentSortMethod}>{HEADER_TEXT[category]}</HeaderSortText>
      </ClickableHeaderRow>
    </MouseoverTooltip>
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
}: {
  topPoolData: TopPoolTableProps
  pageSize?: number
  staticSize?: boolean
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
}: {
  pools?: TablePool[] | PoolStat[]
  loading: boolean
  error?: ApolloError | boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  maxWidth?: number
  maxHeight?: number
  hiddenColumns?: PoolSortFields[]
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
              feeTier={pool.feeTier}
              chainId={chainId}
              protocolVersion={pool.protocolVersion}
              hookAddress={pool.hookAddress}
            />
          ),
          tvl: isGqlPool ? pool.tvl : giveExploreStatDefaultValue(pool.totalLiquidity?.value),
          volume24h: isGqlPool ? pool.volume24h : giveExploreStatDefaultValue(pool.volume1Day?.value),
          volume30d: isGqlPool ? pool.volume30d : giveExploreStatDefaultValue(pool.volume30Day?.value),
          volOverTvl: pool.volOverTvl,
          apr: pool.apr,
          link: `/explore/pools/${toGraphQLChain(chainId ?? defaultChainId).toLowerCase()}/${isGqlPool ? pool.hash : pool.id}`,
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
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTableValues>()
    return [
      columnHelper.accessor((row) => row.index, {
        id: 'index',
        header: () => (
          <Cell justifyContent="center" maxWidth={44} width={44}>
            <Text variant="body2" color="$neutral2">
              #
            </Text>
          </Cell>
        ),
        cell: (index) => (
          <Cell justifyContent="center" loading={showLoadingSkeleton} maxWidth={44} width={44}>
            <Text variant="body2" color="$neutral2">
              {index.getValue?.()}
            </Text>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.poolDescription, {
        id: 'poolDescription',
        header: () => (
          <Cell justifyContent="flex-start" width={320} grow>
            <Text variant="body2" color="$neutral2">
              {t('common.pool')}
            </Text>
          </Cell>
        ),
        cell: (poolDescription) => (
          <Cell justifyContent="flex-start" alignItems="center" loading={showLoadingSkeleton} width={320} grow>
            {poolDescription.getValue?.()}
          </Cell>
        ),
      }),
      !hiddenColumns?.includes(PoolSortFields.TVL)
        ? columnHelper.accessor((row) => row.tvl, {
            id: 'tvl',
            header: () => (
              <Cell minWidth={100} grow>
                <PoolTableHeader
                  category={PoolSortFields.TVL}
                  isCurrentSortMethod={sortMethod === PoolSortFields.TVL}
                  direction={orderDirection}
                />
              </Cell>
            ),
            cell: (tvl) => (
              <Cell loading={showLoadingSkeleton} minWidth={100} grow>
                <Text variant="body2" color="$neutral1">
                  {formatNumber({ input: tvl.getValue?.(), type: NumberType.FiatTokenStats })}
                </Text>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.Apr)
        ? columnHelper.accessor((row) => row.apr, {
            id: 'apr',
            header: () => (
              <Cell minWidth={100} grow>
                <PoolTableHeader
                  category={PoolSortFields.Apr}
                  isCurrentSortMethod={sortMethod === PoolSortFields.Apr}
                  direction={orderDirection}
                />
              </Cell>
            ),
            cell: (oneDayApr) => (
              <Cell minWidth={100} loading={showLoadingSkeleton} grow>
                <Text variant="body2" color="$neutral1">
                  {formatPercent(oneDayApr.getValue?.())}
                </Text>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.Volume24h)
        ? columnHelper.accessor((row) => row.volume24h, {
            id: 'volume24h',
            header: () => (
              <Cell minWidth={120} grow>
                <PoolTableHeader
                  category={PoolSortFields.Volume24h}
                  isCurrentSortMethod={sortMethod === PoolSortFields.Volume24h}
                  direction={orderDirection}
                />
              </Cell>
            ),
            cell: (volume24h) => (
              <Cell minWidth={120} loading={showLoadingSkeleton} grow>
                <Text variant="body2" color="$neutral1">
                  {formatNumber({ input: volume24h.getValue?.(), type: NumberType.FiatTokenStats })}
                </Text>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.Volume30D)
        ? columnHelper.accessor((row) => row.volume30d, {
            id: 'volume30Day',
            header: () => (
              <Cell minWidth={120} grow>
                <PoolTableHeader
                  category={PoolSortFields.Volume30D}
                  isCurrentSortMethod={sortMethod === PoolSortFields.Volume30D}
                  direction={orderDirection}
                />
              </Cell>
            ),
            cell: (volumeWeek) => (
              <Cell minWidth={120} loading={showLoadingSkeleton} grow>
                <Text variant="body2" color="$neutral1">
                  {formatNumber({ input: volumeWeek.getValue?.(), type: NumberType.FiatTokenStats })}
                </Text>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.VolOverTvl)
        ? columnHelper.accessor((row) => row.volOverTvl, {
            id: 'volOverTvl',
            header: () => (
              <Cell minWidth={120} grow>
                <PoolTableHeader
                  category={PoolSortFields.VolOverTvl}
                  isCurrentSortMethod={sortMethod === PoolSortFields.VolOverTvl}
                  direction={orderDirection}
                />
              </Cell>
            ),
            cell: (volOverTvl) => (
              <Cell minWidth={120} loading={showLoadingSkeleton} grow>
                <Text variant="body2" color="$neutral1">
                  {formatNumber({
                    input: volOverTvl.getValue?.(),
                    type: NumberType.TokenQuantityStats,
                    placeholder: '-',
                  })}
                </Text>
              </Cell>
            ),
          })
        : null,
    ].filter((column): column is ColumnDef<PoolTableValues, any> => Boolean(column))
  }, [formatNumber, formatPercent, hiddenColumns, orderDirection, showLoadingSkeleton, sortMethod, t])

  return (
    <Table
      columns={columns}
      data={poolTableValues ?? []}
      loading={loading}
      error={error}
      loadMore={loadMore}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
    />
  )
}
