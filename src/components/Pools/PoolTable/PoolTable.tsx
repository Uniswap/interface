import { Trans } from '@lingui/macro'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { ChainId } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { Table, TableCell } from 'components/Table'
import { BIPS_BASE } from 'constants/misc'
import { chainIdToBackendName, supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { useTopPools } from 'graphql/thegraph/TopPools'
import { useCurrency } from 'hooks/Tokens'
import { ReactElement, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { DoubleCurrencyLogo } from '../PoolDetails/PoolDetailsHeader'

const TableWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`

const PoolDescriptionCell = styled(Row)`
  gap: 8px;
  cursor: pointer;
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

function PoolDescription({
  token0,
  token1,
  feeTier,
  chainId,
  poolAddress,
}: {
  token0: string
  token1: string
  feeTier: number
  chainId: ChainId
  poolAddress: string
}) {
  const currencies = [useCurrency(token0, chainId) ?? undefined, useCurrency(token1, chainId) ?? undefined]
  const navigate = useNavigate()
  const chainName = chainIdToBackendName(chainId).toLowerCase()
  return (
    <PoolDescriptionCell onClick={() => navigate(`/explore/pools/${chainName}/${poolAddress}`)}>
      <DoubleCurrencyLogo data-testid="double-token-logo" chainId={chainId} currencies={currencies} size={28} />
      <ThemedText.BodyPrimary>
        {currencies[0]?.symbol}/{currencies[1]?.symbol}
      </ThemedText.BodyPrimary>
      <FeeTier>{feeTier / BIPS_BASE}%</FeeTier>
    </PoolDescriptionCell>
  )
}

export function PoolTable() {
  const { formatNumber } = useFormatter()
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const { topPools, loading, error } = useTopPools(chainId)

  const poolTableValues: PoolTableValues[] | undefined = useMemo(
    () =>
      topPools?.map((pool, index) => {
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
      }),
    [chainId, topPools]
  )

  // TODO: replace with loading skeleton and error state
  if (loading) return <ThemedText.BodyPrimary>Loading...</ThemedText.BodyPrimary>
  if (error) {
    console.error(error)
    return <ThemedText.BodyPrimary>Error loading Top Pools</ThemedText.BodyPrimary>
  }

  const columnHelper = createColumnHelper<PoolTableValues>()
  const columns: ColumnDef<PoolTableValues, any>[] = [
    columnHelper.accessor((row) => row.index, {
      id: 'index',
      header: () => (
        <TableCell>
          <ThemedText.BodySecondary>#</ThemedText.BodySecondary>
        </TableCell>
      ),
      cell: (index) => (
        <TableCell>
          <ThemedText.BodySecondary>{index.getValue()}</ThemedText.BodySecondary>
        </TableCell>
      ),
    }),
    columnHelper.accessor((row) => row.poolDescription, {
      id: 'poolDescription',
      header: () => (
        <TableCell>
          <ThemedText.BodySecondary>
            <Trans>Pool</Trans>
          </ThemedText.BodySecondary>
        </TableCell>
      ),
      cell: (poolDescription) => <TableCell>{poolDescription.getValue()}</TableCell>,
    }),
    columnHelper.accessor((row) => row.txCount, {
      id: 'transactions',
      header: () => (
        <TableCell>
          <ThemedText.BodySecondary>
            <Trans>Transactions</Trans>
          </ThemedText.BodySecondary>
        </TableCell>
      ),
      cell: (txCount) => (
        <TableCell>
          <ThemedText.BodySecondary>
            {formatNumber({ input: txCount.getValue(), type: NumberType.NFTCollectionStats })}
          </ThemedText.BodySecondary>
        </TableCell>
      ),
    }),
    columnHelper.accessor((row) => row.tvl, {
      id: 'tvl',
      header: () => (
        <TableCell>
          <ThemedText.BodySecondary>
            <Trans>TVL</Trans>
          </ThemedText.BodySecondary>
        </TableCell>
      ),
      cell: (tvl) => (
        <TableCell>
          <ThemedText.BodySecondary>
            {formatNumber({ input: tvl.getValue(), type: NumberType.FiatTokenStats })}
          </ThemedText.BodySecondary>
        </TableCell>
      ),
    }),
    columnHelper.accessor((row) => row.volume24h, {
      id: 'volume24h',
      header: () => (
        <TableCell>
          <ThemedText.BodySecondary>
            <Trans>1 day volume</Trans>
          </ThemedText.BodySecondary>
        </TableCell>
      ),
      cell: (volume24h) => (
        <TableCell>
          <ThemedText.BodySecondary>
            {formatNumber({ input: volume24h.getValue(), type: NumberType.FiatTokenStats })}
          </ThemedText.BodySecondary>
        </TableCell>
      ),
    }),
    columnHelper.accessor((row) => row.volumeWeek, {
      id: 'volumeWeek',
      header: () => (
        <TableCell>
          <ThemedText.BodySecondary>
            <Trans>7 day volume</Trans>
          </ThemedText.BodySecondary>
        </TableCell>
      ),
      cell: (volumeWeek) => (
        <TableCell>
          <ThemedText.BodySecondary>
            {formatNumber({ input: volumeWeek.getValue(), type: NumberType.FiatTokenStats })}
          </ThemedText.BodySecondary>
        </TableCell>
      ),
    }),
    columnHelper.accessor((row) => row.turnover, {
      id: 'turnover',
      header: () => (
        <TableCell>
          <ThemedText.BodySecondary>
            <Trans>Turnover</Trans>
          </ThemedText.BodySecondary>
        </TableCell>
      ),
      cell: (turnover) => (
        <TableCell>
          <ThemedText.BodySecondary>{formatNumber({ input: turnover.getValue() })}</ThemedText.BodySecondary>
        </TableCell>
      ),
    }),
  ]
  return <TableWrapper>{poolTableValues && <Table columns={columns} data={poolTableValues} />}</TableWrapper>
}
