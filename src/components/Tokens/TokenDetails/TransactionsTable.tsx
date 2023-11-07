import { Trans } from '@lingui/macro'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { ChainId, Token } from '@uniswap/sdk-core'
import { Table, TableCell } from 'components/Table'
import { mockSwapData } from 'components/Tokens/TokenDetails/mockData'
import { getLocaleTimeString } from 'components/Tokens/TokenDetails/utils'
import { DEFAULT_LOCALE } from 'constants/locales'
import { useTokenTransactions } from 'graphql/thegraph/TokenTransactions'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { ExternalLink as ExternalLinkIcon } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { shortenAddress } from 'utils/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.neutral2};
  stroke: ${({ theme }) => theme.neutral2};
`

interface SwapTransaction {
  hash: string
  timestamp: number
  input: SwapLeg
  output: SwapLeg
  usdValue: number
  makerAddress: string
}

interface SwapLeg {
  address: string
  symbol: string
  amount: number
}

export function TransactionsTable({ chainId, referenceToken }: { chainId: ChainId; referenceToken: Token }) {
  const theme = useTheme()
  const locale = useActiveLocale()
  const { formatNumber } = useFormatter()
  const { transactions, loading, loadMore } = useTokenTransactions(referenceToken.address, chainId)
  console.log('transactions', transactions)

  const columnHelper = createColumnHelper<SwapTransaction>()
  const columns: ColumnDef<SwapTransaction, any>[] = [
    columnHelper.accessor((row) => row.timestamp, {
      id: 'timestamp',
      header: () => (
        <TableCell>
          <ThemedText.BodySecondary>
            <Trans>Time</Trans>
          </ThemedText.BodySecondary>
        </TableCell>
      ),
      cell: (timestamp) => (
        <TableCell>
          <ThemedText.BodySecondary>
            {getLocaleTimeString(Number(timestamp.getValue()), locale ?? DEFAULT_LOCALE)}
          </ThemedText.BodySecondary>
        </TableCell>
      ),
    }),
    columnHelper.accessor((row) => row.output.address, {
      id: 'swap-type',
      header: () => (
        <TableCell>
          <ThemedText.BodySecondary>
            <Trans>Type</Trans>
          </ThemedText.BodySecondary>
        </TableCell>
      ),
      cell: (outputTokenAddress) => (
        <TableCell>
          <ThemedText.BodyPrimary>
            {String(outputTokenAddress.getValue()).toLowerCase() === referenceToken.address.toLowerCase()
              ? 'Buy'
              : 'Sell'}
          </ThemedText.BodyPrimary>
        </TableCell>
      ),
    }),
    columnHelper.accessor(
      (row) =>
        row.input.address.toLowerCase() === referenceToken.address.toLowerCase() ? row.input.amount : row.output.amount,
      {
        id: 'reference-amount',
        header: () => (
          <TableCell alignRight>
            <ThemedText.BodySecondary>${referenceToken.symbol}</ThemedText.BodySecondary>
          </TableCell>
        ),
        cell: (inputTokenAmount) => (
          <TableCell alignRight>
            <ThemedText.BodyPrimary>
              {formatNumber({ input: inputTokenAmount.getValue(), type: NumberType.TokenTx })}
            </ThemedText.BodyPrimary>
          </TableCell>
        ),
      }
    ),
    columnHelper.accessor(
      (row) => {
        const nonReferenceSwapLeg =
          row.input.address.toLowerCase() === referenceToken.address.toLowerCase() ? row.output : row.input
        return `${formatNumber({
          input: nonReferenceSwapLeg.amount,
          type: NumberType.TokenTx,
        })} ${nonReferenceSwapLeg.symbol}`
      },
      {
        id: 'non-reference-amount',
        header: () => (
          <TableCell alignRight>
            <ThemedText.BodySecondary>
              <Trans>For</Trans>
            </ThemedText.BodySecondary>
          </TableCell>
        ),
        cell: (swapOutput) => (
          <TableCell alignRight>
            <ThemedText.BodyPrimary>{swapOutput.getValue()}</ThemedText.BodyPrimary>
          </TableCell>
        ),
      }
    ),
    columnHelper.accessor((row) => row.usdValue, {
      id: 'usd-value',
      header: () => (
        <TableCell alignRight>
          <ThemedText.BodySecondary>
            <Trans>USD</Trans>
          </ThemedText.BodySecondary>
        </TableCell>
      ),
      cell: (usd) => (
        <TableCell alignRight>
          <ThemedText.BodyPrimary>
            {formatNumber({ input: usd.getValue(), type: NumberType.FiatTokenPrice })}
          </ThemedText.BodyPrimary>
        </TableCell>
      ),
    }),
    columnHelper.accessor((row) => row.makerAddress, {
      id: 'maker-address',
      header: () => (
        <TableCell alignRight>
          <ThemedText.BodySecondary>
            <Trans>Maker</Trans>
          </ThemedText.BodySecondary>
        </TableCell>
      ),
      cell: (makerAddress) => (
        <TableCell alignRight>
          <ThemedText.BodyPrimary>{shortenAddress(makerAddress.getValue(), 0)}</ThemedText.BodyPrimary>
        </TableCell>
      ),
    }),
    columnHelper.accessor((row) => getExplorerLink(chainId, row.hash, ExplorerDataType.TRANSACTION), {
      id: 'etherscan-link',
      header: () => (
        <TableCell alignRight>
          <ThemedText.BodySecondary>
            <Trans>Tx</Trans>
          </ThemedText.BodySecondary>
        </TableCell>
      ),
      cell: (explorerLink) => (
        <TableCell alignRight>
          <StyledExternalLink href={explorerLink.getValue()} data-testid={explorerLink.getValue()}>
            <ExternalLinkIcon size="16px" stroke={theme.neutral1} />
          </StyledExternalLink>
        </TableCell>
      ),
    }),
  ]
  // TODO: use live data
  return <Table columns={columns} data={mockSwapData} />
}
