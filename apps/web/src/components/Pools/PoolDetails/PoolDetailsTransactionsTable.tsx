import { Trans } from '@lingui/macro'
import { createColumnHelper } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { getLocaleTimeString } from 'components/Table/utils'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { Token } from 'graphql/thegraph/__generated__/types-and-hooks'
import { PoolTransaction, PoolTransactionType, usePoolTransactions } from 'graphql/thegraph/PoolTransactions'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useMemo } from 'react'
import { ExternalLink as ExternalLinkIcon } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { ExternalLink, StyledInternalLink, ThemedText } from 'theme/components'
import { countSignificantFigures } from 'utils'
import { shortenAddress } from 'utils/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.neutral2};
  stroke: ${({ theme }) => theme.neutral2};
`

export function PoolDetailsTransactionsTable({
  poolAddress,
  token0,
  token1,
}: {
  poolAddress: string
  token0?: Token
  token1?: Token
}) {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const theme = useTheme()
  const locale = useActiveLocale()
  const activeLocalCurrency = useActiveLocalCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const { transactions, loading, loadMore, error } = usePoolTransactions(poolAddress, chainId)

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTransaction>()
    return [
      columnHelper.accessor((row) => row.timestamp, {
        id: 'timestamp',
        header: () => (
          <Cell minWidth={150} justifyContent="flex-start">
            <ThemedText.BodySecondary>
              <Trans>Time</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (timestamp) => (
          <Cell loading={loading} minWidth={150} justifyContent="flex-start">
            <ThemedText.BodySecondary>
              {getLocaleTimeString(Number(timestamp.getValue?.()) * 1000, locale)}
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor(
        (row) => {
          let color, text
          if (row.type === PoolTransactionType.SWAP) {
            // Determine which of token0 and token1 is the input and which is the output token
            const [tokenIn, tokenOut] =
              row.amount0 > 0 ? [row.pool.token0, row.pool.token1] : [row.pool.token1, row.pool.token0]
            // Determine if swap is exact in vs exact out based on which amount has fewer sig figs
            const token0SigFigs = countSignificantFigures(row.amount0)
            const token1SigFigs = countSignificantFigures(row.amount1)
            const isExactIn =
              tokenIn.id.toLowerCase() === token0?.id.toLowerCase()
                ? token0SigFigs < token1SigFigs
                : token1SigFigs < token0SigFigs
            // If swap is exactIn, tx type is Sell tokenIn, otherwise Buy tokenOut
            color = isExactIn ? 'critical' : 'success'
            text = isExactIn ? (
              <span>
                <Trans>Sell</Trans>&nbsp;{tokenIn.symbol}
              </span>
            ) : (
              <span>
                <Trans>Buy</Trans>&nbsp;{tokenOut.symbol}
              </span>
            )
          } else {
            color = row.type === PoolTransactionType.MINT ? 'success' : 'critical'
            text = row.type === PoolTransactionType.MINT ? <Trans>Add</Trans> : <Trans>Remove</Trans>
          }
          return <ThemedText.BodyPrimary color={color}>{text}</ThemedText.BodyPrimary>
        },
        {
          id: 'swap-type',
          header: () => (
            <Cell minWidth={100} justifyContent="flex-start">
              <ThemedText.BodySecondary>
                <Trans>Type</Trans>
              </ThemedText.BodySecondary>
            </Cell>
          ),
          cell: (poolTransactionType) => (
            <Cell loading={loading} minWidth={100} justifyContent="flex-start">
              {poolTransactionType.getValue?.()}
            </Cell>
          ),
        }
      ),
      columnHelper.accessor((row) => row.amountUSD, {
        id: 'fiat-value',
        header: () => (
          <Cell minWidth={125} justifyContent="flex-end" grow>
            <ThemedText.BodySecondary>
              <Trans>{activeLocalCurrency}</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (fiat) => (
          <Cell loading={loading} minWidth={125} justifyContent="flex-end" grow>
            <ThemedText.BodyPrimary>{formatFiatPrice({ price: fiat.getValue?.() })}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor(
        (row) => (row.pool.token0.id.toLowerCase() === token0?.id.toLowerCase() ? row.amount0 : row.amount1),
        {
          id: 'input-amount',
          header: () => (
            <Cell loading={loading} minWidth={125} justifyContent="flex-end" grow>
              <StyledInternalLink to={`/explore/tokens/${chainName.toLowerCase()}/${token0?.id}`}>
                <ThemedText.BodySecondary>{token0?.symbol}</ThemedText.BodySecondary>
              </StyledInternalLink>
            </Cell>
          ),
          cell: (inputTokenAmount) => (
            <Cell loading={loading} minWidth={125} justifyContent="flex-end" grow>
              <ThemedText.BodyPrimary>
                {formatNumber({ input: Math.abs(inputTokenAmount.getValue?.() ?? 0), type: NumberType.TokenTx })}
              </ThemedText.BodyPrimary>
            </Cell>
          ),
        }
      ),
      columnHelper.accessor(
        (row) => (row.pool.token0.id.toLowerCase() === token0?.id.toLowerCase() ? row.amount1 : row.amount0),
        {
          id: 'output-amount',
          header: () => (
            <Cell loading={loading} minWidth={125} justifyContent="flex-end" grow>
              <StyledInternalLink to={`/explore/tokens/${chainName.toLowerCase()}/${token1?.id}`}>
                <ThemedText.BodySecondary>{token1?.symbol}</ThemedText.BodySecondary>
              </StyledInternalLink>
            </Cell>
          ),
          cell: (outputTokenAmount) => (
            <Cell loading={loading} minWidth={125} justifyContent="flex-end" grow>
              <ThemedText.BodyPrimary>
                {formatNumber({ input: Math.abs(outputTokenAmount.getValue?.() ?? 0), type: NumberType.TokenTx })}
              </ThemedText.BodyPrimary>
            </Cell>
          ),
        }
      ),
      columnHelper.accessor((row) => row.maker, {
        id: 'maker-address',
        header: () => (
          <Cell minWidth={100} justifyContent="flex-end" grow>
            <ThemedText.BodySecondary>
              <Trans>Wallet</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (makerAddress) => (
          <Cell loading={loading} minWidth={100} justifyContent="flex-end" grow>
            <StyledExternalLink href={getExplorerLink(chainId, makerAddress.getValue?.(), ExplorerDataType.ADDRESS)}>
              <ThemedText.BodyPrimary>{shortenAddress(makerAddress.getValue?.(), 0)}</ThemedText.BodyPrimary>
            </StyledExternalLink>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => getExplorerLink(chainId, row.transaction, ExplorerDataType.TRANSACTION), {
        id: 'etherscan-link',
        header: () => (
          <Cell minWidth={32} justifyContent="flex-end">
            <ThemedText.BodySecondary>
              <Trans>Tx</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (explorerLink) => (
          <Cell loading={loading} minWidth={32} justifyContent="flex-end">
            <StyledExternalLink href={explorerLink.getValue?.()} data-testid={explorerLink.getValue?.()}>
              <ExternalLinkIcon size="16px" stroke={theme.neutral1} />
            </StyledExternalLink>
          </Cell>
        ),
      }),
    ]
  }, [
    activeLocalCurrency,
    chainId,
    chainName,
    formatFiatPrice,
    formatNumber,
    loading,
    locale,
    theme.neutral1,
    token0?.id,
    token0?.symbol,
    token1?.id,
    token1?.symbol,
  ])

  if (error) {
    return <Trans>Error fetching Pool Transactions</Trans>
  }

  return (
    <div data-testid="pool-details-transactions-table">
      <Table columns={columns} data={transactions} loading={loading} loadMore={loadMore} maxHeight={600} />
    </div>
  )
}
