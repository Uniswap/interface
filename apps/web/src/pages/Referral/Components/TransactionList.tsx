import { createColumnHelper } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell, StyledExternalLink, TableText, TimestampCell } from 'components/Table/styled'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { GqlChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { getChainIdFromBackendChain } from 'utils/chainParams'

type TransactionListItem = {
  txHash: string
  createdAt: string
  chain?: string
  swapPoints?: string | number
  invitePoints?: string | number
  volumeUSD?: string | number
  token0Symbol?: string
  token1Symbol?: string
  token0Quantity?: string | number
  token1Quantity?: string | number
  protocolVersion?: string
  feeBps?: number
  timestamp?: number
  source?: 'self' | 'invite'
}

function shortenHash(hash: string): string {
  if (!hash) {
    return ''
  }
  if (hash.length <= 12) {
    return hash
  }
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

function formatTimestamp(value: string): string {
  if (!value) {
    return '--'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

function toNumber(value: string | number | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatNumber(value: string | number | undefined, digits = 4): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(toNumber(value))
}

function getTxLink(transaction?: TransactionListItem): string | undefined {
  if (!transaction?.chain || !transaction.txHash) {
    return undefined
  }
  const chainId = getChainIdFromBackendChain(transaction.chain as GqlChainId)
  if (!chainId) {
    return undefined
  }
  return getExplorerLink(chainId, transaction.txHash, ExplorerDataType.TRANSACTION)
}

export function PointTxList({ transactions, loading }: { transactions: TransactionListItem[]; loading: boolean }) {
  const { t } = useTranslation()
  const media = useMedia()
  const isMobile = media.md
  const hasDetailedColumns = useMemo(
    () =>
      transactions.some(
        (tx) =>
          Boolean(tx.token0Symbol && tx.token1Symbol) ||
          tx.volumeUSD !== undefined ||
          tx.swapPoints !== undefined ||
          tx.invitePoints !== undefined,
      ),
    [transactions],
  )
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TransactionListItem>()
    const baseColumns = [
      columnHelper.accessor((row) => row, {
        id: 'timestamp',
        size: 120,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2">
              {t('referral.transactionList.timestamp')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading} justifyContent="flex-start">
            {(() => {
              const value = row.getValue?.()
              const link = getTxLink(value)
              const timestamp = value?.timestamp
              if (link && typeof timestamp === 'number') {
                return <TimestampCell timestamp={timestamp} link={link} />
              }
              return <TableText>{formatTimestamp(value?.createdAt ?? '')}</TableText>
            })()}
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row, {
        id: 'source',
        size: 130,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.table.source')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>
              {row.getValue?.()?.source === 'invite'
                ? t('referral.table.source.inviteeTrade')
                : t('referral.table.source.myTrade')}
            </TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.txHash, {
        id: 'txHash',
        size: 140,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.transactionList.transactionHash')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            {getTxLink(row.row?.original) ? (
              <StyledExternalLink href={getTxLink(row.row?.original)}>
                <TableText>{shortenHash(row.getValue?.() ?? '')}</TableText>
              </StyledExternalLink>
            ) : (
              <TableText>{shortenHash(row.getValue?.() ?? '')}</TableText>
            )}
          </Cell>
        ),
      }),
    ]

    if (!hasDetailedColumns) {
      return baseColumns
    }

    return [
      ...baseColumns.slice(0, 1),
      columnHelper.accessor((row) => row, {
        id: 'pair',
        size: 160,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2">
              {t('referral.table.pair')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading} justifyContent="flex-start">
            <TableText>
              {row.getValue?.()?.token0Symbol && row.getValue?.()?.token1Symbol
                ? `${row.getValue?.()?.token0Symbol}/${row.getValue?.()?.token1Symbol}`
                : '--'}
            </TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row, {
        id: 'volume',
        size: 140,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.table.volumeUsd')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>
              {toNumber(row.getValue?.()?.volumeUSD) > 0 ? `$${formatNumber(row.getValue?.()?.volumeUSD, 2)}` : '--'}
            </TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row, {
        id: 'points',
        size: 140,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.table.points')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>
              {formatNumber(toNumber(row.getValue?.()?.swapPoints) + toNumber(row.getValue?.()?.invitePoints))}
            </TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row, {
        id: 'swap-invite',
        size: 170,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.table.swapInvite')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>
              {formatNumber(row.getValue?.()?.swapPoints)} / {formatNumber(row.getValue?.()?.invitePoints)}
            </TableText>
          </Cell>
        ),
      }),
      ...baseColumns.slice(1),
    ]
  }, [hasDetailedColumns, loading, t])

  if (isMobile) {
    if (loading) {
      return (
        <Flex p="$spacing16" justifyContent="center" alignItems="center">
          <Text variant="body3" color="$neutral2">
            {t('common.loading')}
          </Text>
        </Flex>
      )
    }

    if (!transactions.length) {
      return (
        <Flex p="$spacing16" justifyContent="center" alignItems="center">
          <Text variant="body3" color="$neutral2">
            {t('common.noData')}
          </Text>
        </Flex>
      )
    }

    return (
      <Flex flexDirection="column" gap="$spacing8" width="100%">
        {transactions.map((item, index) => (
          <Flex
            key={`${item.txHash}-${item.createdAt}-${index}`}
            p="$spacing12"
            borderRadius="$rounded12"
            borderWidth={1}
            borderColor="$surface3"
            backgroundColor="$surface2"
            gap="$spacing8"
          >
            <Flex flexDirection="column" gap="$spacing2">
              <Text variant="body4" color="$neutral2">
                {t('referral.transactionList.timestamp')}
              </Text>
              <Text variant="body3" color="$neutral1">
                {formatTimestamp(item.createdAt)}
              </Text>
            </Flex>
            <Flex flexDirection="column" gap="$spacing2">
              <Text variant="body4" color="$neutral2">
                {t('referral.table.source')}
              </Text>
              <Text variant="body3" color="$neutral1">
                {item.source === 'invite'
                  ? t('referral.table.source.inviteeTrade')
                  : t('referral.table.source.myTrade')}
              </Text>
            </Flex>
            {hasDetailedColumns && (
              <>
                <Flex flexDirection="column" gap="$spacing2">
                  <Text variant="body4" color="$neutral2">
                    {t('referral.table.pair')}
                  </Text>
                  <Text variant="body3" color="$neutral1">
                    {item.token0Symbol && item.token1Symbol ? `${item.token0Symbol}/${item.token1Symbol}` : '--'}
                  </Text>
                </Flex>
                <Flex flexDirection="column" gap="$spacing2">
                  <Text variant="body4" color="$neutral2">
                    {t('referral.table.volumeUsd')}
                  </Text>
                  <Text variant="body3" color="$neutral1">
                    {toNumber(item.volumeUSD) > 0 ? `$${formatNumber(item.volumeUSD, 2)}` : '--'}
                  </Text>
                </Flex>
                <Flex flexDirection="column" gap="$spacing2">
                  <Text variant="body4" color="$neutral2">
                    {t('referral.table.points')}
                  </Text>
                  <Text variant="body3" color="$neutral1">
                    {formatNumber(toNumber(item.swapPoints) + toNumber(item.invitePoints))}
                  </Text>
                </Flex>
              </>
            )}
            <Flex flexDirection="column" gap="$spacing2">
              <Text variant="body4" color="$neutral2">
                {t('referral.transactionList.transactionHash')}
              </Text>
              {getTxLink(item) ? (
                <StyledExternalLink href={getTxLink(item)}>
                  <Text variant="body3" color="$neutral1">
                    {shortenHash(item.txHash)}
                  </Text>
                </StyledExternalLink>
              ) : (
                <Text variant="body3" color="$neutral1">
                  {shortenHash(item.txHash)}
                </Text>
              )}
            </Flex>
          </Flex>
        ))}
      </Flex>
    )
  }

  return (
    <Table
      columns={columns}
      data={transactions}
      loading={loading}
      maxWidth={1200}
      defaultPinnedColumns={hasDetailedColumns ? ['timestamp', 'pair'] : ['timestamp', 'source']}
    />
  )
}
