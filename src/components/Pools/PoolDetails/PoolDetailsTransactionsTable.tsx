import { Trans } from '@lingui/macro'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { Token } from '@uniswap/sdk-core'
import { Table, TableCell } from 'components/Table'
import { mockSwapData } from 'components/Tokens/TokenDetails/mockData'
import { getLocaleTimeString } from 'components/Tokens/TokenDetails/utils'
import { DEFAULT_LOCALE } from 'constants/locales'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { ExternalLink as ExternalLinkIcon } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { shortenAddress } from 'utils/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.neutral2};
  stroke: ${({ theme }) => theme.neutral2};
`

const referenceToken = new Token(
  1,
  '0x72e4f9f808c49a2a61de9c5896298920dc4eeea9',
  18,
  'BITCOIN',
  'HarryPotterObamaSonic10Inu'
)

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

export function PoolDetailsTransactionsTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const theme = useTheme()
  const locale = useActiveLocale()
  const { formatNumber } = useFormatter()

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
          <ThemedText.BodyPrimary
            color={
              String(outputTokenAddress.getValue()).toLowerCase() === referenceToken.address.toLowerCase()
                ? 'success'
                : 'critical'
            }
          >
            {/* TODO: Add add&remove types */}
            {String(outputTokenAddress.getValue()).toLowerCase() === referenceToken.address.toLowerCase()
              ? 'Buy'
              : 'Sell'}
          </ThemedText.BodyPrimary>
        </TableCell>
      ),
    }),
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
    // TODO: Change to token1
    columnHelper.accessor(
      (row) =>
        row.input.address.toLowerCase() === referenceToken.address.toLowerCase() ? row.input.amount : row.output.amount,
      {
        id: 'reference-amount',
        header: () => (
          <TableCell alignRight>
            <ThemedText.BodySecondary>USDC</ThemedText.BodySecondary>
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
    // TODO: Change to token2
    columnHelper.accessor(
      (row) => {
        const nonReferenceSwapLeg =
          row.input.address.toLowerCase() === referenceToken.address.toLowerCase() ? row.output : row.input
        return `${formatNumber({
          input: nonReferenceSwapLeg.amount,
          type: NumberType.TokenTx,
        })}`
      },
      {
        id: 'non-reference-amount',
        header: () => (
          <TableCell alignRight>
            <ThemedText.BodySecondary>
              <Trans>WETH</Trans>
            </ThemedText.BodySecondary>
          </TableCell>
        ),
        cell: (swapOutput) => (
          <TableCell alignRight>
            <ThemedText.BodyPrimary>{`${swapOutput.getValue()}`.split(' ')[0]}</ThemedText.BodyPrimary>
          </TableCell>
        ),
      }
    ),
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
