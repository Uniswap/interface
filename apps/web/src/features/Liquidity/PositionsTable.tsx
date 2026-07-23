/* oxlint-disable typescript/no-unnecessary-condition */

import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { getPositionUrl } from 'uniswap/src/features/positions/getPositionUrl'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getPositionKey } from 'uniswap/src/features/positions/utils'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { HeaderCell } from '~/components/Table/styled'
import { getColumnLabel, type ColumnId, type SortKey } from '~/features/Liquidity/PositionsTableColumns'
import {
  PositionsTableControlBar,
  type PositionsTableControlBarProps,
} from '~/features/Liquidity/PositionsTableControlBar'
import {
  AprCellContent,
  CreatedCellContent,
  DistributionCellContent,
  FeesCellContent,
  LiquidityCellContent,
  MenuCellContent,
  PoolCellContent,
  RangeCellContent,
} from '~/features/Liquidity/PositionsTableRow'
import { warnNotImplemented } from '~/features/Liquidity/positionsV2Stub'

const ROW_HEIGHT = 64
const TABLE_MAX_WIDTH = 1200

interface PositionRow {
  position: PositionInfo
  isVisible: boolean
  link: string
}

interface PositionsTableProps extends PositionsTableControlBarProps {
  visiblePositions: PositionInfo[]
  hiddenPositions: PositionInfo[]
  hasNextPage: boolean
  isFetching: boolean
  isPlaceholderData: boolean
  loadMorePositions: () => void
  showHiddenPositions: boolean
  setShowHiddenPositions: (show: boolean) => void
  entryPoint?: string
}

type CellAlign = 'flex-start' | 'flex-end' | 'center'

function HeaderLabel({ id, align, sortKey }: { id: ColumnId; align: CellAlign; sortKey?: SortKey }): JSX.Element {
  const { t } = useTranslation()
  const label = (
    <Text variant="body3" color="$neutral2" userSelect="none">
      {getColumnLabel(id, t)}
    </Text>
  )
  return (
    <HeaderCell justifyContent={align} clickable={!!sortKey}>
      {sortKey ? (
        <TouchableArea hoverable onPress={() => warnNotImplemented('sort', sortKey)}>
          {label}
        </TouchableArea>
      ) : (
        label
      )}
    </HeaderCell>
  )
}

function usePositionsTableColumns(loading: boolean) {
  return useMemo(() => {
    const columnHelper = createColumnHelper<PositionRow>()
    return [
      columnHelper.display({
        id: 'pool',
        size: 228,
        header: () => <HeaderLabel id="pool" align="flex-start" />,
        cell: (info) => {
          const position = info.row?.original?.position
          return (
            <Cell loading={loading} justifyContent="flex-start">
              {position ? <PoolCellContent position={position} /> : null}
            </Cell>
          )
        },
      }),
      columnHelper.display({
        id: 'position',
        size: 220,
        header: () => <HeaderLabel id="position" align="flex-start" sortKey="range_distance" />,
        cell: (info) => {
          const position = info.row?.original?.position
          return (
            <Cell loading={loading} justifyContent="flex-start">
              {position ? <RangeCellContent position={position} /> : null}
            </Cell>
          )
        },
      }),
      columnHelper.display({
        id: 'distribution',
        size: 180,
        meta: { overflowVisible: true },
        header: () => <HeaderLabel id="distribution" align="flex-start" />,
        cell: (info) => {
          const position = info.row?.original?.position
          return (
            <Cell loading={loading} justifyContent="flex-start" overflow="visible">
              {position ? <DistributionCellContent position={position} /> : null}
            </Cell>
          )
        },
      }),
      columnHelper.display({
        id: 'liquidity',
        size: 108,
        header: () => <HeaderLabel id="liquidity" align="flex-end" sortKey="value_usd" />,
        cell: (info) => {
          const position = info.row?.original?.position
          return <Cell loading={loading}>{position ? <LiquidityCellContent position={position} /> : null}</Cell>
        },
      }),
      columnHelper.display({
        id: 'fees',
        size: 100,
        header: () => <HeaderLabel id="fees" align="flex-end" sortKey="fees_usd" />,
        cell: (info) => {
          const position = info.row?.original?.position
          return <Cell loading={loading}>{position ? <FeesCellContent position={position} /> : null}</Cell>
        },
      }),
      columnHelper.display({
        id: 'apr',
        size: 80,
        header: () => <HeaderLabel id="apr" align="flex-end" sortKey="apr" />,
        cell: (info) => {
          const position = info.row?.original?.position
          return <Cell loading={loading}>{position ? <AprCellContent position={position} /> : null}</Cell>
        },
      }),
      columnHelper.display({
        id: 'created',
        size: 80,
        header: () => <HeaderLabel id="created" align="flex-end" sortKey="created_at" />,
        cell: (info) => {
          const position = info.row?.original?.position
          return <Cell loading={loading}>{position ? <CreatedCellContent /> : null}</Cell>
        },
      }),
      columnHelper.display({
        id: 'menu',
        size: 64,
        header: () => <HeaderLabel id="menu" align="center" />,
        cell: (info) => {
          const original = info.row?.original
          return (
            <Cell loading={loading} justifyContent="center">
              {original ? <MenuCellContent position={original.position} isVisible={original.isVisible} /> : null}
            </Cell>
          )
        },
      }),
    ]
  }, [loading])
}

function PositionsTableBase({
  data,
  hiddenData,
  loading,
  isPlaceholderData,
  controlBarProps,
}: {
  data: PositionRow[]
  hiddenData: PositionRow[]
  loading: boolean
  isPlaceholderData: boolean
  controlBarProps: PositionsTableControlBarProps
}): JSX.Element {
  const { t } = useTranslation()
  const columns = usePositionsTableColumns(loading)
  const hiddenLabel = `${t('common.hidden')} (${hiddenData.length})`

  return (
    <Flex gap="$gap16" opacity={isPlaceholderData ? 0.6 : 1}>
      <PositionsTableControlBar {...controlBarProps} />
      <Table
        columns={columns}
        data={data}
        loading={loading}
        getRowId={(row) => getPositionKey(row.position)}
        rowHeight={ROW_HEIGHT}
        compactRowHeight={ROW_HEIGHT}
        defaultPinnedColumns={['pool']}
        maxWidth={TABLE_MAX_WIDTH}
        loadingRowsCount={5}
        loadMore={({ onComplete }) => {
          warnNotImplemented('load_more')
          onComplete?.()
        }}
        hiddenRows={hiddenData}
        showHiddenRowsLabel={hiddenLabel}
        hideHiddenRowsLabel={hiddenLabel}
      />
    </Flex>
  )
}

export function PositionsTable({
  visiblePositions,
  hiddenPositions,
  isPlaceholderData,
  entryPoint,
  statusFilter,
  setStatusFilter,
  versionFilter,
  toggleVersion,
  chainFilter,
  setChainFilter,
  showNetworkFilter,
}: PositionsTableProps): JSX.Element {
  const data = useMemo<PositionRow[]>(
    () =>
      visiblePositions.map((position) => ({
        position,
        isVisible: true,
        link: getPositionUrl(position, { entryPoint }),
      })),
    [visiblePositions, entryPoint],
  )

  const hiddenData = useMemo<PositionRow[]>(
    () =>
      hiddenPositions.map((position) => ({
        position,
        isVisible: false,
        link: getPositionUrl(position, { entryPoint }),
      })),
    [hiddenPositions, entryPoint],
  )

  return (
    <PositionsTableBase
      data={data}
      hiddenData={hiddenData}
      loading={false}
      isPlaceholderData={isPlaceholderData}
      controlBarProps={{
        statusFilter,
        setStatusFilter,
        versionFilter,
        toggleVersion,
        chainFilter,
        setChainFilter,
        showNetworkFilter,
      }}
    />
  )
}

export function PositionsTableLoader(props: PositionsTableControlBarProps): JSX.Element {
  return <PositionsTableBase data={[]} hiddenData={[]} loading isPlaceholderData={false} controlBarProps={props} />
}
