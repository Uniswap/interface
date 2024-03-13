import { ApolloError } from '@apollo/client'
import { Trans } from '@lingui/macro'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { ChainId, Percent } from '@uniswap/sdk-core'
import { DoubleTokenAndChainLogo } from 'components/Pools/PoolDetails/PoolDetailsHeader'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from 'components/Table/styled'
import { NameText } from 'components/Tokens/TokenTable'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { MouseoverTooltip } from 'components/Tooltip'
import { BIPS_BASE } from 'constants/misc'
import { ProtocolVersion, Token } from 'graphql/data/__generated__/types-and-hooks'
import { PoolSortFields, TablePool, useTopPools } from 'graphql/data/pools/useTopPools'
import {
  OrderDirection,
  chainIdToBackendName,
  supportedChainIdFromGQLChain,
  unwrapToken,
  validateUrlChainParam,
} from 'graphql/data/util'
import { useAtom } from 'jotai'
import { atomWithReset, useAtomValue, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { ReactElement, ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const HEADER_DESCRIPTIONS: Record<PoolSortFields, ReactNode | undefined> = {
  [PoolSortFields.TVL]: undefined,
  [PoolSortFields.Volume24h]: undefined,
  [PoolSortFields.VolumeWeek]: undefined,
  [PoolSortFields.TxCount]: undefined,
  [PoolSortFields.Turnover]: (
    <Trans>
      Turnover refers to the amount of trading volume relative to total value locked (TVL) within a pool. Turnover = 24H
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
  const tokens = [token0, token1]
  return (
    <Row gap="sm">
      <DoubleTokenAndChainLogo chainId={chainId} tokens={tokens} size={28} />
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
  [PoolSortFields.Turnover]: <Trans>Turnover</Trans>,
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
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  const resetSortMethod = useResetAtom(sortMethodAtom)
  const resetSortAscending = useResetAtom(sortAscendingAtom)
  useEffect(() => {
    resetSortMethod()
    resetSortAscending()
  }, [resetSortAscending, resetSortMethod])

  const { topPools, loading, error } = useTopPools(
    { sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc },
    chainId
  )

  return (
    <TableWrapper data-testid="top-pools-explore-table">
      <PoolsTable pools={topPools} loading={loading} error={error} chainId={chainId} maxWidth={1200} />
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
  chainId: ChainId
  maxWidth?: number
  maxHeight?: number
  hiddenColumns?: PoolTableColumns[]
}) {
  const { formatNumber, formatPercent } = useFormatter()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const sortMethod = useAtomValue(sortMethodAtom)

  const poolTableValues: PoolTableValues[] | undefined = useMemo(
    () =>
      pools?.map((pool, index) => {
        return {
          index: index + 1,
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
          turnover: pool.turnover,
          link: `/explore/pools/${chainIdToBackendName(chainId).toLowerCase()}/${pool.hash}`,
        }
      }) ?? [],
    [chainId, pools]
  )

  const showLoadingSkeleton = loading || !!error
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
      !hiddenColumns?.includes(PoolTableColumns.Turnover)
        ? columnHelper.accessor((row) => row.turnover, {
            id: 'turnover',
            header: () => (
              <Cell minWidth={100} grow>
                <PoolTableHeader
                  category={PoolSortFields.Turnover}
                  isCurrentSortMethod={sortMethod === PoolSortFields.Turnover}
                  direction={orderDirection}
                />
              </Cell>
            ),
            cell: (turnover) => (
              <Cell minWidth={100} loading={showLoadingSkeleton} grow>
                <ThemedText.BodyPrimary>{formatPercent(turnover.getValue?.())}</ThemedText.BodyPrimary>
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
