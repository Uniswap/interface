import { ApolloError } from '@apollo/client'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { ChainId, Percent } from '@uniswap/sdk-core'
import { DoubleCurrencyAndChainLogo } from 'components/DoubleLogo'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from 'components/Table/styled'
import { NameText } from 'components/Tokens/TokenTable'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import { MouseoverTooltip } from 'components/Tooltip'
import { SupportedInterfaceChainId, chainIdToBackendChain, useChainFromUrlParam } from 'constants/chains'
import { BIPS_BASE } from 'constants/misc'
import { useUpdateManualOutage } from 'featureFlags/flags/outageBanner'
import { PoolSortFields, TablePool, useTopPools } from 'graphql/data/pools/useTopPools'
import { OrderDirection, getSupportedGraphQlChain, gqlToCurrency, unwrapToken } from 'graphql/data/util'
import { Trans } from 'i18n'
import { useAtom } from 'jotai'
import { atomWithReset, useAtomValue, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { ReactElement, ReactNode, useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { ProtocolVersion, Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const HEADER_DESCRIPTIONS: Record<PoolSortFields, ReactNode | undefined> = {
  [PoolSortFields.TVL]: undefined,
  [PoolSortFields.Volume24h]: undefined,
  [PoolSortFields.VolumeWeek]: undefined,
  [PoolSortFields.TxCount]: undefined,
  [PoolSortFields.OneDayApr]: (
    <Trans>
      1 day APR refers to the amount of trading fees relative to total value locked (TVL) within a pool. 1 day APR = 24H
      Fees / TVL
    </Trans>
  ),
}

const TableWrapper = styled.div`
  margin: 0 auto;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
`

const Badge = styled(ThemedText.LabelMicro)`
  padding: 2px 6px;
  background: ${({ theme }) => theme.surface2};
  border-radius: 5px;
`

interface PoolTableValues {
  index: number
  poolDescription: ReactElement
  txCount: number
  tvl: number
  volume24h: number
  volumeWeek: number
  oneDayApr: Percent
  link: string
}

export enum PoolTableColumns {
  Index,
  PoolDescription,
  Transactions,
  TVL,
  Volume24h,
  VolumeWeek,
  OneDayApr,
}

function PoolDescription({
  token0,
  token1,
  feeTier,
  chainId,
  protocolVersion = ProtocolVersion.V3,
}: {
  token0: Token
  token1: Token
  feeTier: number
  chainId: ChainId
  protocolVersion: ProtocolVersion
}) {
  const currencies = [gqlToCurrency(token0), gqlToCurrency(token1)]
  return (
    <Row gap="sm">
      <DoubleCurrencyAndChainLogo chainId={chainId} currencies={currencies} size={28} />
      <NameText>
        {token0.symbol}/{token1.symbol}
      </NameText>
      {protocolVersion === ProtocolVersion.V2 && <Badge>{protocolVersion.toLowerCase()}</Badge>}
      <Badge>{feeTier / BIPS_BASE}%</Badge>
    </Row>
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
  [PoolSortFields.TVL]: <Trans>TVL</Trans>,
  [PoolSortFields.Volume24h]: <Trans>1 day volume</Trans>,
  [PoolSortFields.VolumeWeek]: <Trans>7 day volume</Trans>,
  [PoolSortFields.OneDayApr]: <Trans>1 day APR</Trans>,
  [PoolSortFields.TxCount]: <Trans>Transactions</Trans>,
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
    <MouseoverTooltip disabled={!HEADER_DESCRIPTIONS[category]} text={HEADER_DESCRIPTIONS[category]} placement="top">
      <ClickableHeaderRow $justify="flex-end" onClick={handleSortCategory}>
        {isCurrentSortMethod && <HeaderArrow direction={direction} />}
        <HeaderSortText $active={isCurrentSortMethod}>{HEADER_TEXT[category]}</HeaderSortText>
      </ClickableHeaderRow>
    </MouseoverTooltip>
  )
}

export function TopPoolTable() {
  const chain = getSupportedGraphQlChain(useChainFromUrlParam(), { fallbackToEthereum: true })
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  const resetSortMethod = useResetAtom(sortMethodAtom)
  const resetSortAscending = useResetAtom(sortAscendingAtom)
  useEffect(() => {
    resetSortMethod()
    resetSortAscending()
  }, [resetSortAscending, resetSortMethod])

  const { topPools, loading, errorV3, errorV2 } = useTopPools(
    { sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc },
    chain.id
  )
  const combinedError =
    errorV2 && errorV3
      ? new ApolloError({ errorMessage: `Could not retrieve V2 and V3 Top Pools on chain: ${chain.id}` })
      : undefined
  const allDataStillLoading = loading && !topPools.length
  useUpdateManualOutage({ chainId: chain.id, errorV3, errorV2 })

  return (
    <TableWrapper data-testid="top-pools-explore-table">
      <PoolsTable
        pools={topPools}
        loading={allDataStillLoading}
        error={combinedError}
        chainId={chain.id}
        maxWidth={1200}
      />
    </TableWrapper>
  )
}

export function PoolsTable({
  pools,
  loading,
  error,
  loadMore,
  chainId,
  maxWidth,
  maxHeight,
  hiddenColumns,
}: {
  pools?: TablePool[]
  loading: boolean
  error?: ApolloError
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  chainId: SupportedInterfaceChainId
  maxWidth?: number
  maxHeight?: number
  hiddenColumns?: PoolTableColumns[]
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
          txCount: pool.txCount,
          tvl: pool.tvl,
          volume24h: pool.volume24h,
          volumeWeek: pool.volumeWeek,
          oneDayApr: pool.oneDayApr,
          link: `/explore/pools/${chainIdToBackendChain({ chainId, withFallback: true }).toLowerCase()}/${pool.hash}`,
          analytics: {
            elementName: InterfaceElementName.POOLS_TABLE_ROW,
            properties: {
              chain_id: chainId,
              pool_address: pool.hash,
              token0_address: pool.token0.address,
              token0_symbol: pool.token0.symbol,
              token1_address: pool.token1.address,
              token1_symbol: pool.token1.symbol,
              pool_list_index: index,
              pool_list_rank: poolSortRank,
              pool_list_length: pools.length,
              search_pool_input: filterString,
            },
          },
        }
      }) ?? [],
    [chainId, filterString, pools]
  )

  const showLoadingSkeleton = loading || !!error
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTableValues>()
    return [
      !hiddenColumns?.includes(PoolTableColumns.Index)
        ? columnHelper.accessor((row) => row.index, {
            id: 'index',
            header: () => (
              <Cell justifyContent="center" minWidth={44}>
                <ThemedText.BodySecondary>#</ThemedText.BodySecondary>
              </Cell>
            ),
            cell: (index) => (
              <Cell justifyContent="center" loading={showLoadingSkeleton} minWidth={44}>
                <ThemedText.BodySecondary>{index.getValue?.()}</ThemedText.BodySecondary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolTableColumns.PoolDescription)
        ? columnHelper.accessor((row) => row.poolDescription, {
            id: 'poolDescription',
            header: () => (
              <Cell justifyContent="flex-start" width={240} grow>
                <ThemedText.BodySecondary>
                  <Trans>Pool</Trans>
                </ThemedText.BodySecondary>
              </Cell>
            ),
            cell: (poolDescription) => (
              <Cell justifyContent="flex-start" loading={showLoadingSkeleton} width={240} grow>
                {poolDescription.getValue?.()}
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolTableColumns.Transactions)
        ? columnHelper.accessor((row) => row.txCount, {
            id: 'transactions',
            header: () => (
              <Cell justifyContent="flex-end" minWidth={120} grow>
                <PoolTableHeader
                  category={PoolSortFields.TxCount}
                  isCurrentSortMethod={sortMethod === PoolSortFields.TxCount}
                  direction={orderDirection}
                />
              </Cell>
            ),
            cell: (txCount) => (
              <Cell justifyContent="flex-end" loading={showLoadingSkeleton} minWidth={120} grow>
                <ThemedText.BodyPrimary>
                  {formatNumber({ input: txCount.getValue?.(), type: NumberType.NFTCollectionStats })}
                </ThemedText.BodyPrimary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolTableColumns.TVL)
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
                <ThemedText.BodyPrimary>
                  {formatNumber({ input: tvl.getValue?.(), type: NumberType.FiatTokenStats })}
                </ThemedText.BodyPrimary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolTableColumns.Volume24h)
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
                <ThemedText.BodyPrimary>
                  {formatNumber({ input: volume24h.getValue?.(), type: NumberType.FiatTokenStats })}
                </ThemedText.BodyPrimary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolTableColumns.VolumeWeek)
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
                <ThemedText.BodyPrimary>
                  {formatNumber({ input: volumeWeek.getValue?.(), type: NumberType.FiatTokenStats })}
                </ThemedText.BodyPrimary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolTableColumns.OneDayApr)
        ? columnHelper.accessor((row) => row.oneDayApr, {
            id: 'oneDayApr',
            header: () => (
              <Cell minWidth={100} grow>
                <PoolTableHeader
                  category={PoolSortFields.OneDayApr}
                  isCurrentSortMethod={sortMethod === PoolSortFields.OneDayApr}
                  direction={orderDirection}
                />
              </Cell>
            ),
            cell: (oneDayApr) => (
              <Cell minWidth={100} loading={showLoadingSkeleton} grow>
                <ThemedText.BodyPrimary>{formatPercent(oneDayApr.getValue?.())}</ThemedText.BodyPrimary>
              </Cell>
            ),
          })
        : null,
      // Filter out null values
    ].filter(Boolean) as ColumnDef<PoolTableValues, any>[]
  }, [formatNumber, formatPercent, hiddenColumns, orderDirection, showLoadingSkeleton, sortMethod])

  return (
    <Table
      columns={columns}
      data={poolTableValues}
      loading={loading}
      error={error}
      loadMore={loadMore}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
    />
  )
}
