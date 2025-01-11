import { ApolloError } from '@apollo/client'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { ChainId } from '@ubeswap/sdk-core'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { NameText } from 'components/Tokens/TokenTable'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { Trans } from 'i18n'
import { ReactElement, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { TableLaunchpad, useLaunchpads } from '../../data/useLaunchpads'

const TableWrapper = styled.div`
  margin: 0 auto;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
`

// Active tablosu için değerler
interface ActiveTableValues {
  index: number
  name: ReactElement
  symbol: string
  status: string
  targetAmount: string
  remainingTime: string
}

// Completed tablosu için değerler
interface CompletedTableValues {
  index: number
  name: ReactElement
  symbol: string
  status: string
  raisedAmount: string
  endDate: string
}

// Tablo sütunlarını tanımlayan enum
export enum LaunchpadTableColumns {
  Index,
  Name,
  Symbol,
  Status,
  TargetAmount,
  RemainingTime,
  RaisedAmount,
  EndDate,
}

// Token bilgilerini gösteren bileşen
function TokenDescription({ tokenName, logoUrl }: { tokenName: string; logoUrl: string }) {
  return (
    <Row gap="sm">
      <img src={logoUrl} alt={tokenName} style={{ width: 28, height: 28, borderRadius: '50%' }} />
      <NameText>{tokenName}</NameText>
    </Row>
  )
}

// Kalan süreyi hesaplayan yardımcı fonksiyon
function calculateRemainingTime(endDate: Date): string {
  const now = new Date()
  const timeDiff = endDate.getTime() - now.getTime()

  if (timeDiff <= 0) return 'Ended'

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) {
    return `in ${days} days ${hours} hours`
  }
  return `in ${hours} hours`
}

// Tarihi formatlayan yardımcı fonksiyon
function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Active tablo bileşeni
export function ActiveLaunchpadTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const { launchpads, loading } = useLaunchpads()

  return (
    <TableWrapper data-testid="active-launchpads-table">
      <LaunchpadsTable<ActiveTableValues>
        launchpads={launchpads.active}
        loading={loading}
        error={undefined}
        chainId={chainId}
        maxWidth={1200}
        isCompleted={false}
      />
    </TableWrapper>
  )
}

// Completed tablo bileşeni
export function CompletedLaunchpadTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const { launchpads, loading } = useLaunchpads()

  return (
    <TableWrapper data-testid="completed-launchpads-table">
      <LaunchpadsTable<CompletedTableValues>
        launchpads={launchpads.completed}
        loading={loading}
        error={undefined}
        chainId={chainId}
        maxWidth={1200}
        isCompleted={true}
      />
    </TableWrapper>
  )
}

// Ana tablo bileşeni
export function LaunchpadsTable<T extends ActiveTableValues | CompletedTableValues>({
  launchpads,
  loading,
  error,
  loadMore,
  chainId,
  maxWidth,
  maxHeight,
  hiddenColumns,
  isCompleted,
}: {
  launchpads: TableLaunchpad[]
  loading: boolean
  error?: ApolloError
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  chainId: ChainId
  maxWidth?: number
  maxHeight?: number
  hiddenColumns?: LaunchpadTableColumns[]
  isCompleted: boolean
}) {
  const showLoadingSkeleton = loading || !!error

  // Active tablo verilerini oluştur
  const activeTableValues: ActiveTableValues[] = useMemo(
    () =>
      !isCompleted
        ? launchpads?.map((launchpad, index) => ({
            index: index + 1,
            name: <TokenDescription tokenName={launchpad.tokenName} logoUrl={launchpad.logoUrl} />,
            symbol: launchpad.tokenSymbol,
            status: new Date() > launchpad.startDate ? 'Active' : 'Upcoming',
            targetAmount: `${launchpad.hardCap} ${launchpad.quoteTokenSymbol}`,
            remainingTime: calculateRemainingTime(launchpad.endDate),
          }))
        : [],
    [isCompleted, launchpads]
  )

  // Completed tablo verilerini oluştur
  const completedTableValues: CompletedTableValues[] = useMemo(
    () =>
      isCompleted
        ? launchpads?.map((launchpad, index) => ({
            index: index + 1,
            name: <TokenDescription tokenName={launchpad.tokenName} logoUrl={launchpad.logoUrl} />,
            symbol: launchpad.tokenSymbol,
            status:
              launchpad.totalRaised >= launchpad.hardCap
                ? 'Succeeded'
                : launchpad.totalRaised >= launchpad.softCap
                ? 'Partially Succeeded'
                : 'Failed',
            raisedAmount: `${launchpad.totalRaised} / ${launchpad.hardCap} ${launchpad.quoteTokenSymbol}`,
            endDate: formatDate(launchpad.endDate),
          }))
        : [],
    [isCompleted, launchpads]
  )

  // Active tablo sütunlarını oluştur
  const activeColumns = useMemo(() => {
    const columnHelper = createColumnHelper<ActiveTableValues>()
    return [
      columnHelper.accessor((row) => row.index, {
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
      }),
      columnHelper.accessor((row) => row.name, {
        id: 'name',
        header: () => (
          <Cell justifyContent="flex-start" width={240} grow>
            <ThemedText.BodySecondary>
              <Trans>Name</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (name) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} width={240} grow>
            {name.getValue?.()}
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.symbol, {
        id: 'symbol',
        header: () => (
          <Cell justifyContent="flex-start" minWidth={100}>
            <ThemedText.BodySecondary>
              <Trans>Symbol</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (symbol) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} minWidth={100}>
            <ThemedText.BodyPrimary>{symbol.getValue?.()}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.status, {
        id: 'status',
        header: () => (
          <Cell justifyContent="flex-start" minWidth={100}>
            <ThemedText.BodySecondary>
              <Trans>Status</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (status) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} minWidth={100}>
            <ThemedText.BodyPrimary>{status.getValue?.()}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.targetAmount, {
        id: 'targetAmount',
        header: () => (
          <Cell justifyContent="flex-start" minWidth={150}>
            <ThemedText.BodySecondary>
              <Trans>Target Amount</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (targetAmount) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} minWidth={150}>
            <ThemedText.BodyPrimary>{targetAmount.getValue?.()}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.remainingTime, {
        id: 'remainingTime',
        header: () => (
          <Cell justifyContent="flex-start" minWidth={150}>
            <ThemedText.BodySecondary>
              <Trans>Remaining Time</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (remainingTime) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} minWidth={150}>
            <ThemedText.BodyPrimary>{remainingTime.getValue?.()}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
    ]
  }, [showLoadingSkeleton])

  // Completed tablo sütunlarını oluştur
  const completedColumns = useMemo(() => {
    const columnHelper = createColumnHelper<CompletedTableValues>()
    return [
      columnHelper.accessor((row) => row.index, {
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
      }),
      columnHelper.accessor((row) => row.name, {
        id: 'name',
        header: () => (
          <Cell justifyContent="flex-start" width={240} grow>
            <ThemedText.BodySecondary>
              <Trans>Name</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (name) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} width={240} grow>
            {name.getValue?.()}
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.symbol, {
        id: 'symbol',
        header: () => (
          <Cell justifyContent="flex-start" minWidth={100}>
            <ThemedText.BodySecondary>
              <Trans>Symbol</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (symbol) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} minWidth={100}>
            <ThemedText.BodyPrimary>{symbol.getValue?.()}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.status, {
        id: 'status',
        header: () => (
          <Cell justifyContent="flex-start" minWidth={100}>
            <ThemedText.BodySecondary>
              <Trans>Status</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (status) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} minWidth={100}>
            <ThemedText.BodyPrimary>{status.getValue?.()}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.raisedAmount, {
        id: 'raisedAmount',
        header: () => (
          <Cell justifyContent="flex-start" minWidth={150}>
            <ThemedText.BodySecondary>
              <Trans>Raised Amount</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (raisedAmount) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} minWidth={150}>
            <ThemedText.BodyPrimary>{raisedAmount.getValue?.()}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.endDate, {
        id: 'endDate',
        header: () => (
          <Cell justifyContent="flex-start" minWidth={150}>
            <ThemedText.BodySecondary>
              <Trans>End Date</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (endDate) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} minWidth={150}>
            <ThemedText.BodyPrimary>{endDate.getValue?.()}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
    ]
  }, [showLoadingSkeleton])

  // Tablo verilerini ve sütunlarını seç
  const tableData = isCompleted ? completedTableValues : activeTableValues
  const columns = isCompleted ? completedColumns : activeColumns

  return (
    <Table<T>
      columns={columns as ColumnDef<T, any>[]}
      data={tableData as T[]}
      loading={loading}
      error={error}
      loadMore={loadMore}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
    />
  )
}
