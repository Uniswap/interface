import { ApolloError } from '@apollo/client'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { InterfaceElementName } from '@uniswap/analytics-events'
// eslint-disable-next-line no-restricted-imports
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
import { chainIdToBackendChain, useChainFromUrlParam } from 'constants/chains'
import { BIPS_BASE } from 'constants/misc'
import { useUpdateManualOutage } from 'featureFlags/flags/outageBanner'
import { PoolSortFields, TablePool, useTopPools } from 'graphql/data/pools/useTopPools'
import {
  OrderDirection,
  getSupportedGraphQlChain,
  gqlToCurrency,
  supportedChainIdFromGQLChain,
  unwrapToken,
} from 'graphql/data/util'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAtom } from 'jotai'
import { atomWithReset, useAtomValue, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { ReactElement, ReactNode, memo, useCallback, useEffect, useMemo } from 'react'
import { giveExploreStatDefaultValue } from 'state/explore'
import { useTopPools as useRestTopPools } from 'state/explore/topPools'
import { PoolStat } from 'state/explore/types'
import { Flex, Text, styled } from 'ui/src'
import { Chain, ProtocolVersion, Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Trans } from 'uniswap/src/i18n'
import { InterfaceChainId, UniverseChainId } from 'uniswap/src/types/chains'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const HEADER_DESCRIPTIONS: Record<PoolSortFields, ReactNode | undefined> = {
  [PoolSortFields.TVL]: <Trans i18nKey="stats.tvl" />,
  [PoolSortFields.Volume24h]: <Trans i18nKey="stats.volume.1d" />,
  [PoolSortFields.VolumeWeek]: <Trans i18nKey="pool.volume.sevenDay" />,
  [PoolSortFields.VolOverTvl]: undefined,
  [PoolSortFields.Apr]: <Trans i18nKey="pool.apr.description" />,
}

const TableWrapper = styled(Flex, {
  m: '0 auto',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
})

const Badge = styled(Text, {
  py: 2,
  px: 6,
  backgroundColor: '$surface2',
  borderRadius: '$rounded6',
  variant: 'body4',
  color: '$neutral2',
})

interface PoolTableValues {
  index: number
  poolDescription: ReactElement
  tvl: number
  apr: Percent
  volume24h: number
  volumeWeek: number // TODO(WEB-4856): update to 30D once this data is available
  volOverTvl?: number
  link: string
}

function getRestTokenLogo(token?: Token | TokenStats, currencyLogo?: string | null): string | undefined {
  // We can retrieve currencies for native chain assets and should use that logo over the rest returned logo
  if (currencyLogo) {
    return currencyLogo
  }
  return token && !('id' in token) ? token?.logo : undefined
}

function PoolDescription({
  token0,
  token1,
  feeTier,
  chainId,
  protocolVersion = ProtocolVersion.V3,
}: {
  token0?: Token | TokenStats
  token1?: Token | TokenStats
  feeTier?: number
  chainId: InterfaceChainId
  protocolVersion?: ProtocolVersion | string
}) {
  const isRestExploreEnabled = useFeatureFlag(FeatureFlags.RestExplore)
  const currencies = [token0 ? gqlToCurrency(token0) : undefined, token1 ? gqlToCurrency(token1) : undefined]
  // skip is isRestExploreEnabled
  const currencyLogos = [
    useCurrencyInfo(currencies?.[0], chainId, isRestExploreEnabled)?.logoUrl,
    useCurrencyInfo(currencies?.[1], chainId, isRestExploreEnabled)?.logoUrl,
  ]
  const images = isRestExploreEnabled
    ? [getRestTokenLogo(token0, currencyLogos[0]), getRestTokenLogo(token1, currencyLogos[1])]
    : undefined
  return (
    <Flex row gap="$gap8" alignItems="center">
      <PortfolioLogo currencies={currencies} chainId={chainId} images={images} size={28} />
      <EllipsisText>
        {token0?.symbol}/{token1?.symbol}
      </EllipsisText>
      {protocolVersion === ProtocolVersion.V2 && <Badge>{protocolVersion.toLowerCase()}</Badge>}
      {feeTier && <Badge>{feeTier / BIPS_BASE}%</Badge>}
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

const HEADER_TEXT: Record<PoolSortFields, ReactNode> = {
  [PoolSortFields.TVL]: <Trans i18nKey="common.totalValueLocked" />,
  [PoolSortFields.Volume24h]: <Trans i18nKey="stats.volume.1d.short" />,
  [PoolSortFields.VolumeWeek]: <Trans i18nKey="pool.volume.sevenDay.short" />,
  [PoolSortFields.Apr]: <Trans i18nKey="pool.apr" />,
  [PoolSortFields.VolOverTvl]: <Trans i18nKey="pool.volOverTvl" />,
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

export const TopPoolTable = memo(function TopPoolTable() {
  const chain = getSupportedGraphQlChain(useChainFromUrlParam(), { fallbackToEthereum: true })
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  const resetSortMethod = useResetAtom(sortMethodAtom)
  const resetSortAscending = useResetAtom(sortAscendingAtom)
  useEffect(() => {
    resetSortMethod()
    resetSortAscending()
  }, [resetSortAscending, resetSortMethod])

  const {
    topPools: gqlTopPools,
    loading: gqlLoading,
    errorV3,
    errorV2,
  } = useTopPools(
    { sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc },
    chain.id,
  )
  const combinedError =
    errorV2 && errorV3
      ? new ApolloError({ errorMessage: `Could not retrieve V2 and V3 Top Pools on chain: ${chain.id}` })
      : undefined
  const allDataStillLoading = gqlLoading && !gqlTopPools.length
  useUpdateManualOutage({ chainId: chain.id, errorV3, errorV2 })

  const {
    topPools: restTopPools,
    isLoading: restIsLoading,
    isError: restIsError,
  } = useRestTopPools({ sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc })

  const isRestExploreEnabled = useFeatureFlag(FeatureFlags.RestExplore)
  const { topPools, loading, error } = isRestExploreEnabled
    ? { topPools: restTopPools, loading: restIsLoading, error: restIsError }
    : { topPools: gqlTopPools, loading: allDataStillLoading, error: combinedError }

  return (
    <TableWrapper data-testid="top-pools-explore-table">
      <PoolsTable pools={topPools} loading={loading} error={error} maxWidth={1200} />
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

  const poolTableValues: PoolTableValues[] | undefined = useMemo(
    () =>
      pools?.map((pool, index) => {
        const poolSortRank = index + 1
        const isGqlPool = 'hash' in pool
        const chainId = supportedChainIdFromGQLChain(pool.token0?.chain as Chain) ?? UniverseChainId.Mainnet
        return {
          index: poolSortRank,
          poolDescription: (
            <PoolDescription
              token0={unwrapToken(chainId, pool.token0)}
              token1={unwrapToken(chainId, pool.token1)}
              feeTier={pool.feeTier}
              chainId={chainId}
              protocolVersion={pool.protocolVersion}
            />
          ),
          tvl: isGqlPool ? pool.tvl : giveExploreStatDefaultValue(pool.totalLiquidity?.value),
          volume24h: isGqlPool ? pool.volume24h : giveExploreStatDefaultValue(pool.volume1Day?.value),
          volumeWeek: isGqlPool ? pool.volumeWeek : giveExploreStatDefaultValue(pool.volume1Week?.value),
          volOverTvl: pool.volOverTvl,
          apr: pool.apr,
          link: `/explore/pools/${chainIdToBackendChain({ chainId, withFallback: true }).toLowerCase()}/${isGqlPool ? pool.hash : pool.id}`,
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
    [filterString, pools],
  )

  const showLoadingSkeleton = loading || !!error
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTableValues>()
    return [
      columnHelper.accessor((row) => row.index, {
        id: 'index',
        header: () => (
          <Cell justifyContent="center" minWidth={44}>
            <Text variant="body2" color="$neutral2">
              #
            </Text>
          </Cell>
        ),
        cell: (index) => (
          <Cell justifyContent="center" loading={showLoadingSkeleton} minWidth={44}>
            <Text variant="body2" color="$neutral2">
              {index.getValue?.()}
            </Text>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.poolDescription, {
        id: 'poolDescription',
        header: () => (
          <Cell justifyContent="flex-start" width={240} grow>
            <Text variant="body2" color="$neutral2">
              <Trans i18nKey="common.pool" />
            </Text>
          </Cell>
        ),
        cell: (poolDescription) => (
          <Cell justifyContent="flex-start" alignItems="center" loading={showLoadingSkeleton} width={240} grow>
            {poolDescription.getValue?.()}
          </Cell>
        ),
      }),
      !hiddenColumns?.includes(PoolSortFields.TVL)
        ? columnHelper.accessor((row) => row.tvl, {
            id: 'tvl',
            header: () => (
              <Cell minWidth={120} grow>
                <PoolTableHeader
                  category={PoolSortFields.TVL}
                  isCurrentSortMethod={sortMethod === PoolSortFields.TVL}
                  direction={orderDirection}
                />
              </Cell>
            ),
            cell: (tvl) => (
              <Cell loading={showLoadingSkeleton} minWidth={120} grow>
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
      !hiddenColumns?.includes(PoolSortFields.VolumeWeek)
        ? columnHelper.accessor((row) => row.volumeWeek, {
            id: 'volumeWeek',
            header: () => (
              <Cell minWidth={120} grow>
                <PoolTableHeader
                  category={PoolSortFields.VolumeWeek}
                  isCurrentSortMethod={sortMethod === PoolSortFields.VolumeWeek}
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
              <Cell minWidth={100} loading={showLoadingSkeleton} grow>
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
  }, [formatNumber, formatPercent, hiddenColumns, orderDirection, showLoadingSkeleton, sortMethod])

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
