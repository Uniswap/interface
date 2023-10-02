import { Table } from 'components/Table'
import { LinkCell, TextCell } from 'components/Table/Cells'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useMemo } from 'react'
import { Column } from 'react-table'
import { useTheme } from 'styled-components'
import { shortenAddress } from 'utils/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { mockSwapData } from './mockData'
import { Swap, SwapAction, SwapInOut } from './types'
import { getLocaleTimeString, getSwapType } from './utils'

enum ColumnHeader {
  Time = 'Time',
  Type = 'Type',
  Amount = 'Amount',
  For = 'For',
  USD = 'USD',
  Maker = 'Maker',
}

export function TransactionsTable({ referenceTokenAddress }: { referenceTokenAddress: string }) {
  const locale = useActiveLocale()
  const { formatNumber } = useFormatter()
  const theme = useTheme()

  const columns: Column<Swap>[] = useMemo(() => {
    const getColor = (action: SwapAction) => (action === SwapAction.Buy ? theme.success : theme.critical)
    return [
      {
        Header: ColumnHeader.Time,
        accessor: (swap) => swap,
        Cell: ({ value }: { value: { timestamp: number; transactionHash: string } }) => (
          <TextCell justifyContent="left" color={theme.neutral2}>
            {getLocaleTimeString(value.timestamp, locale ?? 'en-US')}
          </TextCell>
        ),
        disableSortBy: true,
        id: ColumnHeader.Time,
      },
      {
        Header: ColumnHeader.Type,
        accessor: (swap) => swap,
        Cell: ({ value }: { value: { input: SwapInOut } }) => {
          const swapType = getSwapType(value.input.contractAddress, referenceTokenAddress)
          return <TextCell color={getColor(swapType)}>{swapType}</TextCell>
        },
        disableSortBy: true,
        id: ColumnHeader.Type,
      },
      {
        Header: ColumnHeader.Amount,
        accessor: (swap) => swap,
        Cell: ({ value }: { value: { input: SwapInOut; output: SwapInOut } }) => {
          const swapType = getSwapType(value.input.contractAddress, referenceTokenAddress)
          const token = swapType === SwapAction.Buy ? value.output : value.input
          return (
            <TextCell color={getColor(swapType)}>{`${formatNumber({ input: token.amount, type: NumberType.TokenTx })} ${
              token.symbol
            }`}</TextCell>
          )
        },
        disableSortBy: true,
        id: ColumnHeader.Amount,
      },
      {
        Header: ColumnHeader.For,
        accessor: (swap) => swap,
        Cell: ({ value }: { value: { input: SwapInOut; output: SwapInOut } }) => {
          const swapType = getSwapType(value.input.contractAddress, referenceTokenAddress)
          const token = swapType === SwapAction.Buy ? value.input : value.output
          return (
            <TextCell color={getColor(swapType)}>{`${formatNumber({ input: token.amount, type: NumberType.TokenTx })} ${
              token.symbol
            }`}</TextCell>
          )
        },
        disableSortBy: true,
        id: ColumnHeader.For,
      },
      {
        Header: ColumnHeader.USD,
        accessor: (swap) => swap,
        Cell: ({ value }: { value: { input: SwapInOut; usdValue: number } }) => {
          const swapType = getSwapType(value.input.contractAddress, referenceTokenAddress)
          return (
            <TextCell color={getColor(swapType)}>
              {formatNumber({ input: value.usdValue, type: NumberType.PortfolioBalance })}
            </TextCell>
          )
        },
        disableSortBy: true,
        id: ColumnHeader.USD,
      },
      {
        Header: ColumnHeader.Maker,
        accessor: 'maker',
        Cell: ({ value }: { value: string }) => (
          <TextCell color={theme.neutral2}>{shortenAddress(value, 0)}</TextCell>
        ),
        disableSortBy: true,
        id: ColumnHeader.Maker,
      },
    ]
  }, [theme.success, theme.critical, locale, referenceTokenAddress, formatNumber])
  return (
    <Table
      columns={columns}
      data={mockSwapData}
      smallHiddenColumns={[ColumnHeader.For, ColumnHeader.USD, ColumnHeader.Maker]}
      mediumHiddenColumns={[ColumnHeader.For, ColumnHeader.Maker]}
      largeHiddenColumns={[ColumnHeader.Maker]}
      extraLargeHiddenColumns={[]}
      dataTestId="transactions-table"
    />
  )
}
