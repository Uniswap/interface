import { Trans } from '@lingui/macro'
import { createColumnHelper } from '@tanstack/react-table'
import { ChainId, Token } from '@uniswap/sdk-core'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { StyledExternalLink, StyledInternalLink } from 'components/Table/styled'
import { getLocaleTimeString } from 'components/Table/utils'
import { DEFAULT_LOCALE } from 'constants/locales'
import { validateUrlChainParam } from 'graphql/data/util'
import { useTokenTransactions } from 'graphql/thegraph/TokenTransactions'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { shortenAddress } from 'utils/addresses'
import { useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const StyledSwapAmount = styled(ThemedText.BodyPrimary)`
  display: inline-block;
  ${EllipsisStyle}
  max-width: 125px;
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
  const locale = useActiveLocale()
  const activeLocalCurrency = useActiveLocalCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const { transactions, loading, loadMore } = useTokenTransactions(referenceToken.address, chainId)

  const data = useMemo(
    () =>
      transactions.map((transaction) => {
        const swapLeg0 = {
          address: transaction.pool.token0.id,
          symbol: transaction.pool.token0.symbol,
          amount: transaction.amount0,
        }
        const swapLeg1 = {
          address: transaction.pool.token1.id,
          symbol: transaction.pool.token1.symbol,
          amount: transaction.amount1,
        }
        let input, output
        if (swapLeg0.amount < 0) {
          input = swapLeg0
          output = swapLeg1
        } else {
          input = swapLeg1
          output = swapLeg0
        }
        return {
          hash: transaction.transaction.id,
          timestamp: transaction.timestamp,
          input,
          output,
          usdValue: transaction.amountUSD,
          makerAddress: transaction.origin,
        }
      }),
    [transactions]
  )

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<SwapTransaction>()
    return [
      columnHelper.accessor((row) => row.timestamp, {
        id: 'timestamp',
        header: () => (
          <Cell minWidth={150} justifyContent="flex-start" grow>
            <ThemedText.BodySecondary>
              <Trans>Time</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (timestamp) => (
          <Cell loading={loading} minWidth={150} justifyContent="flex-start" grow>
            <ThemedText.BodySecondary>
              {getLocaleTimeString(Number(timestamp.getValue?.()) * 1000, locale ?? DEFAULT_LOCALE)}
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.output.address, {
        id: 'swap-type',
        header: () => (
          <Cell minWidth={50} justifyContent="flex-start" grow>
            <ThemedText.BodySecondary>
              <Trans>Type</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (outputTokenAddress) => (
          <Cell loading={loading} minWidth={50} justifyContent="flex-start" grow>
            <ThemedText.BodyPrimary>
              {String(outputTokenAddress.getValue?.()).toLowerCase() === referenceToken.address.toLowerCase() ? (
                <Trans>Buy</Trans>
              ) : (
                <Trans>Sell</Trans>
              )}
            </ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor(
        (row) =>
          row.input.address.toLowerCase() === referenceToken.address.toLowerCase()
            ? row.input.amount
            : row.output.amount,
        {
          id: 'reference-amount',
          header: () => (
            <Cell minWidth={150} justifyContent="flex-end">
              <ThemedText.BodySecondary>${referenceToken.symbol}</ThemedText.BodySecondary>
            </Cell>
          ),
          cell: (inputTokenAmount) => (
            <Cell loading={loading} minWidth={150} justifyContent="flex-end">
              <ThemedText.BodyPrimary>
                {formatNumber({
                  input: Math.abs(inputTokenAmount.getValue?.()) || 0,
                })}
              </ThemedText.BodyPrimary>
            </Cell>
          ),
        }
      ),
      columnHelper.accessor(
        (row) => {
          const nonReferenceSwapLeg =
            row.input.address.toLowerCase() === referenceToken.address.toLowerCase() ? row.output : row.input
          return (
            <StyledSwapAmount>
              {formatNumber({
                input: Math.abs(nonReferenceSwapLeg.amount) || 0,
              })}{' '}
              <StyledInternalLink to={`/explore/tokens/${chainName.toLowerCase()}/${nonReferenceSwapLeg.address}`}>
                {nonReferenceSwapLeg.symbol}
              </StyledInternalLink>
            </StyledSwapAmount>
          )
        },
        {
          id: 'non-reference-amount',
          header: () => (
            <Cell minWidth={150} justifyContent="flex-end">
              <ThemedText.BodySecondary>
                <Trans>For</Trans>
              </ThemedText.BodySecondary>
            </Cell>
          ),
          cell: (swapOutput) => (
            <Cell loading={loading} minWidth={150} justifyContent="flex-end">
              {swapOutput.getValue?.()}
            </Cell>
          ),
        }
      ),
      columnHelper.accessor((row) => row.usdValue, {
        id: 'fiat-value',
        header: () => (
          <Cell minWidth={125} justifyContent="flex-end">
            <ThemedText.BodySecondary>{activeLocalCurrency}</ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (fiat) => (
          <Cell loading={loading} minWidth={125} justifyContent="flex-end">
            <ThemedText.BodyPrimary>{formatFiatPrice({ price: fiat.getValue?.() })}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.makerAddress, {
        id: 'maker-address',
        header: () => (
          <Cell minWidth={100} justifyContent="flex-end">
            <ThemedText.BodySecondary>
              <Trans>Maker</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (makerAddress) => (
          <Cell loading={loading} minWidth={100} justifyContent="flex-end">
            <StyledExternalLink href={getExplorerLink(chainId, makerAddress.getValue?.(), ExplorerDataType.ADDRESS)}>
              {shortenAddress(makerAddress.getValue?.(), 0)}
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
    referenceToken.address,
    referenceToken.symbol,
  ])

  return <Table columns={columns} data={data} loading={loading} loadMore={loadMore} maxHeight={600} />
}
