import { Trans } from '@lingui/macro'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { ChainId, Percent } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { ClickableHeaderRow, HeaderArrow } from 'components/Table/styled'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { BIPS_BASE } from 'constants/misc'
import { ProtocolVersion, Token } from 'graphql/data/__generated__/types-and-hooks'
import { PoolSortFields, PoolTableSortState, TablePool, useTopPools } from 'graphql/data/pools/useTopPools'
import {
  OrderDirection,
  chainIdToBackendName,
  supportedChainIdFromGQLChain,
  validateUrlChainParam,
} from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { ReactElement, useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { DoubleCurrencyAndChainLogo } from '../PoolDetails/PoolDetailsHeader'

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
  turnover: Percent
  link: string
}

export enum PoolTableColumns {
  Index,
  PoolDescription,
  Transactions,
  TVL,
  Volume24h,
  VolumeWeek,
  Turnover,
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
  const currencies = [useCurrency(token0.address, chainId), useCurrency(token1.address, chainId)]
  return (
    <Row gap="sm">
      <DoubleCurrencyAndChainLogo chainId={chainId} currencies={currencies} size={28} />
      <ThemedText.BodyPrimary>
        {token0.symbol}/{token1.symbol}
      </ThemedText.BodyPrimary>
      {protocolVersion === ProtocolVersion.V2 && <Badge>{protocolVersion.toLowerCase()}</Badge>}
      <Badge>{feeTier / BIPS_BASE}%</Badge>
    </Row>
  )
}

export function TopPoolTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const [sortState, setSortMethod] = useState<PoolTableSortState>({
    sortBy: PoolSortFields.TVL,
    sortDirection: OrderDirection.Desc,
  })
  const { topPools, loading, error } = useTopPools(sortState, chainId)

  const handleHeaderClick = useCallback(
    (newSortMethod: PoolSortFields) => {
      if (sortState.sortBy === newSortMethod) {
        setSortMethod({
          sortBy: newSortMethod,
          sortDirection: sortState.sortDirection === OrderDirection.Asc ? OrderDirection.Desc : OrderDirection.Asc,
        })
      } else {
        setSortMethod({
          sortBy: newSortMethod,
          sortDirection: OrderDirection.Desc,
        })
      }
    },
    [sortState.sortBy, sortState.sortDirection]
  )

  if (error) {
    return (
      <TableWrapper>
        <ThemedText.BodyPrimary>
          <Trans>Error loading Top Pools</Trans>
        </ThemedText.BodyPrimary>
      </TableWrapper>
    )
  }

  return (
    <TableWrapper data-testid="top-pools-explore-table">
      <PoolsTable
        pools={topPools}
        loading={loading}
        chainId={chainId}
        sortState={sortState}
        handleHeaderClick={handleHeaderClick}
      />
    </TableWrapper>
  )
}

export function PoolsTable({
  pools,
  loading,
  loadMore,
  chainId,
  sortState,
  handleHeaderClick,
  maxHeight,
  hiddenColumns,
}: {
  pools?: TablePool[]
  loading: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  chainId: ChainId
  sortState: PoolTableSortState
  handleHeaderClick: (newSortMethod: PoolSortFields) => void
  maxHeight?: number
  hiddenColumns?: PoolTableColumns[]
}) {
  const { formatNumber, formatPercent } = useFormatter()
  const poolTableValues: PoolTableValues[] | undefined = useMemo(
    () =>
      pools?.map((pool, index) => {
        return {
          index: index + 1,
          poolDescription: (
            <PoolDescription
              token0={pool.token0}
              token1={pool.token1}
              feeTier={pool.feeTier}
              chainId={chainId}
              protocolVersion={pool.protocolVersion}
            />
          ),
          txCount: pool.txCount,
          tvl: pool.tvl,
          volume24h: pool.volume24h,
          volumeWeek: pool.volumeWeek,
          turnover: pool.turnover,
          link: `/explore/pools/${chainIdToBackendName(chainId).toLowerCase()}/${pool.hash}`,
        }
      }) ?? [],
    [chainId, pools]
  )
  // TODO(WEB-3236): once GQL BE Pool query add 1 day, 7 day, turnover sort support
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
              <Cell justifyContent="center" loading={loading} minWidth={44}>
                <ThemedText.BodySecondary>{index.getValue?.()}</ThemedText.BodySecondary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolTableColumns.PoolDescription)
        ? columnHelper.accessor((row) => row.poolDescription, {
            id: 'poolDescription',
            header: () => (
              <Cell justifyContent="flex-start" minWidth={240} grow>
                <ThemedText.BodySecondary>
                  <Trans>Pool</Trans>
                </ThemedText.BodySecondary>
              </Cell>
            ),
            cell: (poolDescription) => (
              <Cell justifyContent="flex-start" loading={loading} minWidth={240} grow>
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
                <ClickableHeaderRow $justify="flex-end" onClick={() => handleHeaderClick(PoolSortFields.TxCount)}>
                  {sortState.sortBy === PoolSortFields.TxCount && <HeaderArrow direction={sortState.sortDirection} />}
                  <ThemedText.BodySecondary>
                    <Trans>Transactions</Trans>
                  </ThemedText.BodySecondary>
                </ClickableHeaderRow>
              </Cell>
            ),
            cell: (txCount) => (
              <Cell justifyContent="flex-end" loading={loading} minWidth={120} grow>
                <ThemedText.BodySecondary>
                  {formatNumber({ input: txCount.getValue?.(), type: NumberType.NFTCollectionStats })}
                </ThemedText.BodySecondary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolTableColumns.TVL)
        ? columnHelper.accessor((row) => row.tvl, {
            id: 'tvl',
            header: () => (
              <Cell minWidth={120} grow>
                <ClickableHeaderRow $justify="flex-end" onClick={() => handleHeaderClick(PoolSortFields.TVL)}>
                  {sortState.sortBy === PoolSortFields.TVL && <HeaderArrow direction={sortState.sortDirection} />}
                  <ThemedText.BodySecondary>
                    <Trans>TVL</Trans>
                  </ThemedText.BodySecondary>
                </ClickableHeaderRow>
              </Cell>
            ),
            cell: (tvl) => (
              <Cell loading={loading} minWidth={120} grow>
                <ThemedText.BodySecondary>
                  {formatNumber({ input: tvl.getValue?.(), type: NumberType.FiatTokenStats })}
                </ThemedText.BodySecondary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolTableColumns.Volume24h)
        ? columnHelper.accessor((row) => row.volume24h, {
            id: 'volume24h',
            header: () => (
              <Cell minWidth={120} grow>
                <ClickableHeaderRow $justify="flex-end" onClick={() => handleHeaderClick(PoolSortFields.Volume24h)}>
                  {sortState.sortBy === PoolSortFields.Volume24h && <HeaderArrow direction={sortState.sortDirection} />}
                  <ThemedText.BodySecondary>
                    <Trans>1 day volume</Trans>
                  </ThemedText.BodySecondary>
                </ClickableHeaderRow>
              </Cell>
            ),
            cell: (volume24h) => (
              <Cell minWidth={120} loading={loading} grow>
                <ThemedText.BodySecondary>
                  {formatNumber({ input: volume24h.getValue?.(), type: NumberType.FiatTokenStats })}
                </ThemedText.BodySecondary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolTableColumns.VolumeWeek)
        ? columnHelper.accessor((row) => row.volumeWeek, {
            id: 'volumeWeek',
            header: () => (
              <Cell minWidth={120} grow>
                <ClickableHeaderRow $justify="flex-end" onClick={() => handleHeaderClick(PoolSortFields.VolumeWeek)}>
                  {sortState.sortBy === PoolSortFields.VolumeWeek && (
                    <HeaderArrow direction={sortState.sortDirection} />
                  )}
                  <ThemedText.BodySecondary>
                    <Trans>7 day volume</Trans>
                  </ThemedText.BodySecondary>
                </ClickableHeaderRow>
              </Cell>
            ),
            cell: (volumeWeek) => (
              <Cell minWidth={120} loading={loading} grow>
                <ThemedText.BodySecondary>
                  {formatNumber({ input: volumeWeek.getValue?.(), type: NumberType.FiatTokenStats })}
                </ThemedText.BodySecondary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolTableColumns.Turnover)
        ? columnHelper.accessor((row) => row.turnover, {
            id: 'turnover',
            header: () => (
              <Cell minWidth={100} grow>
                <ClickableHeaderRow $justify="flex-end" onClick={() => handleHeaderClick(PoolSortFields.Turnover)}>
                  {sortState.sortBy === PoolSortFields.Turnover && <HeaderArrow direction={sortState.sortDirection} />}
                  <ThemedText.BodySecondary>
                    <Trans>Turnover</Trans>
                  </ThemedText.BodySecondary>
                </ClickableHeaderRow>
              </Cell>
            ),
            cell: (turnover) => (
              <Cell minWidth={100} loading={loading} grow>
                <ThemedText.BodySecondary>{formatPercent(turnover.getValue?.())}</ThemedText.BodySecondary>
              </Cell>
            ),
          })
        : null,
      // Filter out null values
    ].filter(Boolean) as ColumnDef<PoolTableValues, any>[]
  }, [
    formatNumber,
    formatPercent,
    handleHeaderClick,
    hiddenColumns,
    loading,
    sortState.sortBy,
    sortState.sortDirection,
  ])

  return <Table columns={columns} data={poolTableValues} loading={loading} loadMore={loadMore} maxHeight={maxHeight} />
}
