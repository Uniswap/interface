import { TokenInfo } from '@uniswap/token-lists'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cells'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useMemo } from 'react'
import { ExternalLink as ExternalLinkIcon } from 'react-feather'
import { Column } from 'react-table'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { shortenAddress } from 'utils/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { mockSwapData } from './mockData'
import { Swap, SwapAction, SwapInOut } from './types'
import { getLocaleTimeString, getSwapType } from './utils'

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.neutral2};
  stroke: ${({ theme }) => theme.neutral2};
`

enum ColumnHeader {
  Time = 'Time',
  Type = 'Type',
  Amount = 'Amount',
  For = 'For',
  USD = 'USD',
  Maker = 'Maker',
  Txn = 'Txn',
}

export function TransactionsTable({ referenceToken }: { referenceToken: TokenInfo }) {
  const locale = useActiveLocale()
  const { formatNumber } = useFormatter()
  const theme = useTheme()

  const columns: Column<Swap>[] = useMemo(() => {
    const getColor = (action: SwapAction) => (action === SwapAction.Buy ? theme.success : theme.critical)
    return [
      {
        Header: (
          <Cell justifyContent="flex-start">
            <ThemedText.BodySecondary>{ColumnHeader.Time}</ThemedText.BodySecondary>
          </Cell>
        ),
        accessor: (swap) => swap,
        Cell: ({ value }: { value: { timestamp: number; transactionHash: string } }) => (
          <Cell justifyContent="flex-start">
            <ThemedText.BodySecondary>
              {getLocaleTimeString(value.timestamp, locale ?? 'en-US')}
            </ThemedText.BodySecondary>
          </Cell>
        ),
        disableSortBy: true,
        id: ColumnHeader.Time,
      },
      {
        Header: (
          <Cell justifyContent="flex-start">
            <ThemedText.BodySecondary>{ColumnHeader.Type}</ThemedText.BodySecondary>
          </Cell>
        ),
        accessor: (swap) => swap,
        Cell: ({ value }: { value: { input: SwapInOut } }) => {
          const swapType = getSwapType(value.input.contractAddress, referenceToken.address)
          return (
            <Cell justifyContent="flex-start">
              <Text color={getColor(swapType)}>{swapType}</Text>
            </Cell>
          )
        },
        disableSortBy: true,
        id: ColumnHeader.Type,
      },
      {
        Header: (
          <Cell>
            <ThemedText.BodySecondary>{`$${referenceToken.symbol}`}</ThemedText.BodySecondary>
          </Cell>
        ),
        accessor: (swap) => swap,
        Cell: ({ value }: { value: { input: SwapInOut; output: SwapInOut } }) => {
          const swapType = getSwapType(value.input.contractAddress, referenceToken.address)
          const token = swapType === SwapAction.Buy ? value.output : value.input
          return (
            <Cell>
              <Text color={getColor(swapType)}>
                {`${formatNumber({ input: token.amount, type: NumberType.TokenTx })}`}
              </Text>
            </Cell>
          )
        },
        disableSortBy: true,
        id: ColumnHeader.Amount,
      },
      {
        Header: (
          <Cell>
            <ThemedText.BodySecondary>{ColumnHeader.For}</ThemedText.BodySecondary>
          </Cell>
        ),
        accessor: (swap) => swap,
        Cell: ({ value }: { value: { input: SwapInOut; output: SwapInOut } }) => {
          const swapType = getSwapType(value.input.contractAddress, referenceToken.address)
          const token = swapType === SwapAction.Buy ? value.input : value.output
          return (
            <Cell>
              <Text color={getColor(swapType)}>
                {`${formatNumber({ input: token.amount, type: NumberType.TokenTx })} ${token.symbol}`}
              </Text>
            </Cell>
          )
        },
        disableSortBy: true,
        id: ColumnHeader.For,
      },
      {
        Header: (
          <Cell>
            <ThemedText.BodySecondary>{ColumnHeader.USD}</ThemedText.BodySecondary>
          </Cell>
        ),
        accessor: (swap) => swap,
        Cell: ({ value }: { value: { input: SwapInOut; usdValue: number } }) => {
          const swapType = getSwapType(value.input.contractAddress, referenceToken.address)
          return (
            <Cell>
              <Text color={getColor(swapType)}>
                {formatNumber({ input: value.usdValue, type: NumberType.PortfolioBalance })}
              </Text>
            </Cell>
          )
        },
        disableSortBy: true,
        id: ColumnHeader.USD,
      },
      {
        Header: (
          <Cell>
            <ThemedText.BodySecondary>{ColumnHeader.Maker}</ThemedText.BodySecondary>
          </Cell>
        ),
        accessor: 'maker',
        Cell: ({ value }: { value: string }) => (
          <Cell>
            <ThemedText.BodySecondary>{shortenAddress(value, 0)}</ThemedText.BodySecondary>
          </Cell>
        ),
        disableSortBy: true,
        id: ColumnHeader.Maker,
      },
      {
        Header: (
          <Cell>
            <ThemedText.BodySecondary>{ColumnHeader.Txn}</ThemedText.BodySecondary>
          </Cell>
        ),
        accessor: 'transactionHash',
        Cell: ({ value }: { value: string }) => (
          <Cell>
            <StyledExternalLink href={`https://etherscan.io/tx/${value}`} color={theme.neutral2}>
              <ExternalLinkIcon size="16px" />
            </StyledExternalLink>
          </Cell>
        ),
        disableSortBy: true,
        id: ColumnHeader.Txn,
      },
    ]
  }, [
    referenceToken.symbol,
    referenceToken.address,
    theme.success,
    theme.critical,
    theme.neutral2,
    locale,
    formatNumber,
  ])
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
