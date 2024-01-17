import { Trans } from '@lingui/macro'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { ChainId } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { BIPS_BASE } from 'constants/misc'
import { chainIdToBackendName, supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { Token } from 'graphql/thegraph/__generated__/types-and-hooks'
import { TablePool, useTopPools } from 'graphql/thegraph/TopPools'
import { useCurrency } from 'hooks/Tokens'
import { ReactElement, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { DoubleCurrencyAndChainLogo } from '../PoolDetails/PoolDetailsHeader'

const TableWrapper = styled.div`
  margin: 0 auto;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
`

const PoolDescriptionCell = styled(Row)`
  gap: 8px;
  cursor: pointer;
  ${ClickableStyle}
`

const FeeTier = styled(ThemedText.LabelMicro)`
  padding: 2px 6px;
  background: ${({ theme }) => theme.surface2};
`

interface PoolTableValues {
  index: number
  poolDescription: ReactElement
  txCount: number
  tvl: number
  volume24h: number
  volumeWeek: number
  turnover: number
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
  poolAddress,
}: {
  token0: Token
  token1: Token
  feeTier: number
  chainId: ChainId
  poolAddress: string
}) {
  const currencies = [useCurrency(token0.id, chainId), useCurrency(token1.id, chainId)]
  const navigate = useNavigate()
  const chainName = chainIdToBackendName(chainId).toLowerCase()
  return (
    <PoolDescriptionCell onClick={() => navigate(`/explore/pools/${chainName}/${poolAddress}`)}>
      <DoubleCurrencyAndChainLogo chainId={chainId} currencies={currencies} size={28} />
      <ThemedText.BodyPrimary>
        {token0.symbol}/{token1.symbol}
      </ThemedText.BodyPrimary>
      <FeeTier>{feeTier / BIPS_BASE}%</FeeTier>
    </PoolDescriptionCell>
  )
}

export function TopPoolTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const { topPools, loading, error } = useTopPools(chainId)

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
      <PoolsTable pools={topPools} loading={loading} chainId={chainId} />
    </TableWrapper>
  )
}

export function PoolsTable({
  pools,
  loading,
  loadMore,
  chainId,
  maxHeight,
  hiddenColumns,
}: {
  pools?: TablePool[]
  loading: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  chainId: ChainId
  maxHeight?: number
  hiddenColumns?: PoolTableColumns[]
}) {
  const { formatNumber } = useFormatter()
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
              poolAddress={pool.hash}
            />
          ),
          txCount: pool.txCount,
          tvl: pool.tvl,
          volume24h: pool.volume24h,
          volumeWeek: pool.volumeWeek,
          turnover: pool.turnover,
        }
      }) ?? [],
    [chainId, pools]
  )

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTableValues>()
    return [
      !hiddenColumns?.includes(PoolTableColumns.Index)
        ? columnHelper.accessor((row) => row.index, {
            id: 'index',
            header: () => (
              <Cell justifyContent="flex-start" minWidth={48}>
                <ThemedText.BodySecondary>#</ThemedText.BodySecondary>
              </Cell>
            ),
            cell: (index) => (
              <Cell justifyContent="flex-start" loading={loading} minWidth={48}>
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
                <ThemedText.BodySecondary>
                  <Trans>Transactions</Trans>
                </ThemedText.BodySecondary>
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
                <ThemedText.BodySecondary>
                  <Trans>TVL</Trans>
                </ThemedText.BodySecondary>
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
                <ThemedText.BodySecondary>
                  <Trans>1 day volume</Trans>
                </ThemedText.BodySecondary>
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
                <ThemedText.BodySecondary>
                  <Trans>7 day volume</Trans>
                </ThemedText.BodySecondary>
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
                <ThemedText.BodySecondary>
                  <Trans>Turnover</Trans>
                </ThemedText.BodySecondary>
              </Cell>
            ),
            cell: (turnover) => (
              <Cell minWidth={100} loading={loading} grow>
                <ThemedText.BodySecondary>{formatNumber({ input: turnover.getValue?.() })}</ThemedText.BodySecondary>
              </Cell>
            ),
          })
        : null,
      // Filter out null values
    ].filter(Boolean) as ColumnDef<PoolTableValues, any>[]
  }, [formatNumber, hiddenColumns, loading])

  return <Table columns={columns} data={poolTableValues} loading={loading} loadMore={loadMore} maxHeight={maxHeight} />
}
