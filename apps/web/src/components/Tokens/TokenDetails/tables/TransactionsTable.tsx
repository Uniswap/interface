import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import { Token } from '@taraswap/sdk-core'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import {
  FilterHeaderRow,
  HeaderArrow,
  HeaderSortText,
  StyledExternalLink,
  TimestampCell,
  TokenLinkCell,
} from 'components/Table/styled'
import { SupportedInterfaceChainId } from 'constants/chains'
import { useUpdateManualOutage } from 'featureFlags/flags/outageBanner'
import { TokenTransactionType, useTokenTransactions } from 'graphql/data/useTokenTransactions'
import { OrderDirection, unwrapToken } from 'graphql/data/util'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { Trans } from 'i18n'
import { useMemo, useReducer, useState } from 'react'
import styled from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { Token as GQLToken } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { shortenAddress } from 'utilities/src/addresses'
import { useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const StyledSwapAmount = styled(ThemedText.BodyPrimary)`
  display: inline-block;
  ${EllipsisStyle}
  max-width: 75px;
`

const TableWrapper = styled.div`
  min-height: 158px;
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
  address?: string
  symbol?: string
  amount: number
  token: GQLToken
}

export function TransactionsTable({
  chainId,
  referenceToken,
}: {
  chainId: SupportedInterfaceChainId
  referenceToken: Token
}) {
  const activeLocalCurrency = useActiveLocalCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const [filter, setFilters] = useState<TokenTransactionType[]>([TokenTransactionType.BUY, TokenTransactionType.SELL])
  const { transactions, loading, loadMore, errorV2, errorV3 } = useTokenTransactions(
    referenceToken.address,
    chainId,
    filter
  )
  const combinedError =
    errorV2 && errorV3
      ? new ApolloError({
          errorMessage: `Could not retrieve V2 and V3 Transactions for token: ${referenceToken.address} on chain: ${chainId}`,
        })
      : undefined
  const allDataStillLoading = loading && !transactions.length
  useUpdateManualOutage({ chainId, errorV3, errorV2 })
  const unwrappedReferenceToken = unwrapToken(chainId, referenceToken)

  const data = useMemo(
    () =>
      transactions.map((transaction) => {
        const swapLeg0 = {
          address: transaction.token0.address,
          symbol: transaction.token0.symbol,
          amount: parseFloat(transaction.token0Quantity),
          token: transaction.token0,
        }
        const swapLeg1 = {
          address: transaction.token1.address,
          symbol: transaction.token1.symbol,
          amount: parseFloat(transaction.token1Quantity),
          token: transaction.token1,
        }
        const token0IsBeingSold = parseFloat(transaction.token0Quantity) > 0
        return {
          hash: transaction.hash,
          timestamp: transaction.timestamp,
          input: token0IsBeingSold ? swapLeg0 : swapLeg1,
          output: token0IsBeingSold ? swapLeg1 : swapLeg0,
          usdValue: transaction.usdValue.value,
          makerAddress: transaction.account,
        }
      }),
    [transactions]
  )

  const showLoadingSkeleton = allDataStillLoading || !!combinedError
  // TODO(WEB-3236): once GQL BE Transaction query is supported add usd, token0 amount, and token1 amount sort support
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<SwapTransaction>()
    return [
      columnHelper.accessor((row) => row, {
        id: 'timestamp',
        header: () => (
          <Cell minWidth={120} justifyContent="flex-start" grow>
            <Row gap="xs">
              <HeaderArrow direction={OrderDirection.Desc} />
              <HeaderSortText $active>
                <Trans i18nKey="common.time" />
              </HeaderSortText>
            </Row>
          </Cell>
        ),
        cell: (row) => (
          <Cell loading={showLoadingSkeleton} minWidth={120} justifyContent="flex-start" grow>
            <TimestampCell
              timestamp={Number(row.getValue?.().timestamp)}
              link={getExplorerLink(chainId, row.getValue?.().hash, ExplorerDataType.TRANSACTION)}
            />
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.output.address, {
        id: 'swap-type',
        header: () => (
          <Cell minWidth={75} justifyContent="flex-start" grow>
            <FilterHeaderRow modalOpen={filterModalIsOpen} onClick={toggleFilterModal}>
              <Filter
                allFilters={Object.values(TokenTransactionType)}
                activeFilter={filter}
                setFilters={setFilters}
                isOpen={filterModalIsOpen}
                toggleFilterModal={toggleFilterModal}
              />
              <ThemedText.BodySecondary>
                <Trans i18nKey="common.type.label" />
              </ThemedText.BodySecondary>
            </FilterHeaderRow>
          </Cell>
        ),
        cell: (outputTokenAddress) => {
          const isBuy = String(outputTokenAddress.getValue?.()).toLowerCase() === referenceToken.address.toLowerCase()
          return (
            <Cell loading={showLoadingSkeleton} minWidth={75} justifyContent="flex-start" grow>
              <ThemedText.BodyPrimary color={isBuy ? 'success' : 'critical'}>
                {isBuy ? <Trans i18nKey="common.buy.label" /> : <Trans i18nKey="common.sell.label" />}
              </ThemedText.BodyPrimary>
            </Cell>
          )
        },
      }),
      columnHelper.accessor(
        (row) =>
          row.input.address?.toLowerCase() === referenceToken.address.toLowerCase()
            ? row.input.amount
            : row.output.amount,
        {
          id: 'reference-amount',
          header: () => (
            <Cell minWidth={100} justifyContent="flex-end">
              <ThemedText.BodySecondary>${unwrappedReferenceToken.symbol}</ThemedText.BodySecondary>
            </Cell>
          ),
          cell: (inputTokenAmount) => (
            <Cell loading={showLoadingSkeleton} minWidth={100} justifyContent="flex-end">
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
            row.input.address?.toLowerCase() === referenceToken.address.toLowerCase() ? row.output : row.input
          return (
            <Row gap="8px" justify="flex-end">
              <StyledSwapAmount>
                {formatNumber({
                  input: Math.abs(nonReferenceSwapLeg.amount) || 0,
                })}
              </StyledSwapAmount>
              <TokenLinkCell token={nonReferenceSwapLeg.token} />
            </Row>
          )
        },
        {
          id: 'non-reference-amount',
          header: () => (
            <Cell minWidth={160} justifyContent="flex-end">
              <ThemedText.BodySecondary>
                <Trans i18nKey="common.for" />
              </ThemedText.BodySecondary>
            </Cell>
          ),
          cell: (swapOutput) => (
            <Cell loading={showLoadingSkeleton} minWidth={160} justifyContent="flex-end">
              {swapOutput.getValue?.()}
            </Cell>
          ),
        }
      ),
      columnHelper.accessor((row) => row.usdValue, {
        id: 'fiat-value',
        header: () => (
          <Cell minWidth={125} justifyContent="flex-end">
            <Row gap="xs" justify="flex-end">
              <HeaderSortText>{activeLocalCurrency}</HeaderSortText>
            </Row>
          </Cell>
        ),
        cell: (fiat) => (
          <Cell loading={showLoadingSkeleton} minWidth={125} justifyContent="flex-end">
            <ThemedText.BodyPrimary>{formatFiatPrice({ price: fiat.getValue?.() })}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.makerAddress, {
        id: 'maker-address',
        header: () => (
          <Cell minWidth={150} justifyContent="flex-end">
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.wallet.label" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (makerAddress) => (
          <Cell loading={showLoadingSkeleton} minWidth={150} justifyContent="flex-end">
            <StyledExternalLink href={getExplorerLink(chainId, makerAddress.getValue?.(), ExplorerDataType.ADDRESS)}>
              {shortenAddress(makerAddress.getValue?.())}
            </StyledExternalLink>
          </Cell>
        ),
      }),
    ]
  }, [
    showLoadingSkeleton,
    chainId,
    filterModalIsOpen,
    filter,
    referenceToken.address,
    unwrappedReferenceToken.symbol,
    formatNumber,
    activeLocalCurrency,
    formatFiatPrice,
  ])

  return (
    <TableWrapper>
      <Table
        columns={columns}
        data={data}
        loading={allDataStillLoading}
        error={combinedError}
        loadMore={loadMore}
        maxHeight={600}
      />
    </TableWrapper>
  )
}
