import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { HeaderCell } from '~/components/Table/styled'
import { LiquidityPositionDropdownMenu } from '~/features/Liquidity/LiquidityPositionDropdownMenu'
import { PoolBalanceCell } from '~/pages/Portfolio/Overview/MiniPoolsTable/columns/Balance'
import { ColumnHeader } from '~/pages/Portfolio/Overview/MiniPoolsTable/columns/ColumnHeader'
import { PoolFeesCell } from '~/pages/Portfolio/Overview/MiniPoolsTable/columns/Fees'
import { PoolInfoCell } from '~/pages/Portfolio/Overview/MiniPoolsTable/columns/Info'
import { PositionCell } from '~/pages/Portfolio/Overview/MiniPoolsTable/columns/PositionCell'
import { PoolStatusCell } from '~/pages/Portfolio/Overview/MiniPoolsTable/columns/Status'

export const useMiniPoolsTableColumns = ({ isLoading, readOnly }: { isLoading: boolean; readOnly?: boolean }) => {
  const { t } = useTranslation()

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PositionInfo>()

    return [
      // First Column - Pool Info
      columnHelper.display({
        id: 'poolInfo',
        minSize: 240,
        size: 240,
        header: () => <ColumnHeader label={t('common.pool')} justifyContent="flex-start" />,
        cell: (info) => (
          <PositionCell
            info={info}
            render={(position) => <PoolInfoCell position={position} />}
            justifyContent="flex-start"
            loading={isLoading}
          />
        ),
      }),

      // Second Column - Status
      columnHelper.display({
        id: 'status',
        header: () => <ColumnHeader label={t('common.status')} />,
        cell: (info) => (
          <PositionCell info={info} render={(position) => <PoolStatusCell position={position} />} loading={isLoading} />
        ),
      }),

      // Third Column - Fees
      columnHelper.display({
        id: 'fees',
        header: () => <ColumnHeader label={t('common.fees')} />,
        cell: (info) => (
          <PositionCell info={info} render={(position) => <PoolFeesCell position={position} />} loading={isLoading} />
        ),
      }),

      // Fourth Column - Balance
      columnHelper.display({
        id: 'balance',
        header: () => <ColumnHeader label={t('portfolio.overview.pools.column.balance')} />,
        cell: (info) => (
          <PositionCell
            info={info}
            render={(position) => <PoolBalanceCell position={position} />}
            loading={isLoading}
          />
        ),
      }),

      // Fifth Column - Actions
      columnHelper.display({
        id: 'actions',
        size: 48,
        header: () => <HeaderCell />,
        cell: (info) => (
          <PositionCell
            info={info}
            render={(position) => <LiquidityPositionDropdownMenu liquidityPosition={position} readOnly={readOnly} />}
            justifyContent="center"
            loading={isLoading}
          />
        ),
      }),
    ]
  }, [isLoading, readOnly, t])

  return columns
}
