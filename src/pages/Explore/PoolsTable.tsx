import { Trans } from '@lingui/macro'
import { useTopPoolsTaiko } from 'graphql/taiko/TaikoTopPools'
import { AlertTriangle } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme'
import { useMemo, useState } from 'react'

const TableContainer = styled.div`
  background: ${({ theme }) => theme.surface1};
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.surface3};
  overflow: hidden;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const TableHeader = styled.thead`
  background: ${({ theme }) => theme.surface2};
`

const TableHeaderCell = styled.th<{ $clickable?: boolean }>`
  padding: 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 535;
  color: ${({ theme }) => theme.neutral2};
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  user-select: none;

  &:hover {
    color: ${({ theme, $clickable }) => ($clickable ? theme.neutral1 : theme.neutral2)};
  }
`

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.surface3};

  &:hover {
    background: ${({ theme }) => theme.surface2};
  }

  &:last-child {
    border-bottom: none;
  }
`

const TableCell = styled.td`
  padding: 16px;
  font-size: 14px;
`

const PoolCell = styled(TableCell)`
  display: flex;
  align-items: center;
  gap: 12px;
`

const PoolLink = styled(Link)`
  text-decoration: none;
  color: ${({ theme }) => theme.neutral1};
  font-weight: 535;

  &:hover {
    color: ${({ theme }) => theme.accent1};
  }
`

const FeeBadge = styled.span`
  background: ${({ theme }) => theme.surface3};
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 535;
  color: ${({ theme }) => theme.neutral2};
`

const NoPoolsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  gap: 16px;
  color: ${({ theme }) => theme.neutral2};
`

const LoadingContainer = styled(NoPoolsContainer)``

type SortField = 'tvl' | 'volume' | 'fees' | 'apr'

function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`
  }
  return `$${value.toFixed(2)}`
}

function formatPercent(value: number): string {
  if (value === 0) return '-'
  return `${value.toFixed(2)}%`
}

function formatFeeTier(feeTier: number): string {
  return `${(feeTier / 10000).toFixed(2)}%`
}

export function PoolsTable() {
  const [sortField, setSortField] = useState<SortField>('tvl')
  const [sortAscending, setSortAscending] = useState(false)

  const { pools, loadingPools, error } = useTopPoolsTaiko(100, 'totalValueLockedUSD')

  const sortedPools = useMemo(() => {
    if (!pools) return undefined

    const sorted = [...pools].sort((a, b) => {
      let aVal: number
      let bVal: number

      switch (sortField) {
        case 'tvl':
          aVal = a.tvlUSD
          bVal = b.tvlUSD
          break
        case 'volume':
          aVal = a.volumeUSD
          bVal = b.volumeUSD
          break
        case 'fees':
          aVal = a.feesUSD
          bVal = b.feesUSD
          break
        case 'apr':
          aVal = a.apr || 0
          bVal = b.apr || 0
          break
        default:
          return 0
      }

      return sortAscending ? aVal - bVal : bVal - aVal
    })

    return sorted
  }, [pools, sortField, sortAscending])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAscending(!sortAscending)
    } else {
      setSortField(field)
      setSortAscending(false)
    }
  }

  if (loadingPools) {
    return (
      <TableContainer>
        <LoadingContainer>
          <Trans>Loading pools...</Trans>
        </LoadingContainer>
      </TableContainer>
    )
  }

  if (error || !sortedPools) {
    return (
      <TableContainer>
        <NoPoolsContainer>
          <AlertTriangle size={24} />
          <Trans>Unable to load pool data. Please try again later.</Trans>
        </NoPoolsContainer>
      </TableContainer>
    )
  }

  if (sortedPools.length === 0) {
    return (
      <TableContainer>
        <NoPoolsContainer>
          <Trans>No pools found</Trans>
        </NoPoolsContainer>
      </TableContainer>
    )
  }

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <tr>
            <TableHeaderCell>
              <Trans>#</Trans>
            </TableHeaderCell>
            <TableHeaderCell>
              <Trans>Pool</Trans>
            </TableHeaderCell>
            <TableHeaderCell>
              <Trans>Protocol</Trans>
            </TableHeaderCell>
            <TableHeaderCell>
              <Trans>Fee tier</Trans>
            </TableHeaderCell>
            <TableHeaderCell $clickable onClick={() => handleSort('tvl')}>
              <Trans>TVL</Trans> {sortField === 'tvl' && (sortAscending ? '↑' : '↓')}
            </TableHeaderCell>
            <TableHeaderCell>
              <Trans>Pool APR</Trans>
            </TableHeaderCell>
            <TableHeaderCell $clickable onClick={() => handleSort('volume')}>
              <Trans>1D vol</Trans> {sortField === 'volume' && (sortAscending ? '↑' : '↓')}
            </TableHeaderCell>
            <TableHeaderCell $clickable onClick={() => handleSort('fees')}>
              <Trans>1D vol/TVL</Trans>
            </TableHeaderCell>
            <TableHeaderCell>
              <Trans>LPs</Trans>
            </TableHeaderCell>
          </tr>
        </TableHeader>
        <tbody>
          {sortedPools.map((pool, index) => (
            <TableRow key={pool.id}>
              <TableCell>{index + 1}</TableCell>
              <PoolCell>
                <PoolLink to={`/pools/${pool.id}`}>
                  {pool.token0Symbol}/{pool.token1Symbol}
                </PoolLink>
              </PoolCell>
              <TableCell>v3</TableCell>
              <TableCell>
                <FeeBadge>{formatFeeTier(pool.feeTier)}</FeeBadge>
              </TableCell>
              <TableCell>{formatNumber(pool.tvlUSD)}</TableCell>
              <TableCell>{formatPercent(pool.apr || 0)}</TableCell>
              <TableCell>{formatNumber(pool.volumeUSD)}</TableCell>
              <TableCell>{pool.tvlUSD > 0 ? `${((pool.volumeUSD / pool.tvlUSD) * 100).toFixed(2)}%` : '-'}</TableCell>
              <TableCell>{pool.liquidityProviderCount}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  )
}
