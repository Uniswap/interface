import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import { Token } from '@uniswap/sdk-core'
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
import { useUpdateManualOutage } from 'featureFlags/flags/outageBanner'
import { TokenTransactionType, useTokenTransactions } from 'graphql/data/useTokenTransactions'
import { OrderDirection, unwrapToken } from 'graphql/data/util'
import { useMemo, useReducer, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, styled } from 'ui/src'
import { Token as GQLToken } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { useFormatter } from 'utils/formatNumbers'

const StyledSwapAmount = styled(Text, {
  display: 'inline-block' as any,
  maxWidth: 75,
  variant: 'body2',
  color: '$neutral1',
  ...EllipsisTamaguiStyle,
})

const TableWrapper = styled(Flex, {
  position: 'relative',
  minHeight: 158,
})

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

export function TransactionsTable({ chainId, referenceToken }: { chainId: UniverseChainId; referenceToken: Token }) {
  const activeLocalCurrency = useAppFiatCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const filterAnchorRef = useRef<HTMLDivElement>(null)
  const [filter, setFilters] = useState<TokenTransactionType[]>([TokenTransactionType.BUY, TokenTransactionType.SELL])
  const { transactions, loading, loadMore, errorV2, errorV3 } = useTokenTransactions(
    referenceToken.address,
    chainId,
    filter,
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
    [transactions],
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
            <Flex row gap="$gap4" alignItems="center">
              <HeaderArrow direction={OrderDirection.Desc} />
              <HeaderSortText active>
                <Trans i18nKey="common.time" />
              </HeaderSortText>
            </Flex>
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
            <FilterHeaderRow
              clickable={filterModalIsOpen}
              onPress={filterModalIsOpen ? undefined : toggleFilterModal}
              alignItems="center"
              ref={filterAnchorRef}
            >
              <Filter
                allFilters={Object.values(TokenTransactionType)}
                activeFilter={filter}
                setFilters={setFilters}
                isOpen={filterModalIsOpen}
                toggleFilterModal={toggleFilterModal}
                anchorRef={filterAnchorRef}
              />
              <Text variant="body2" color="$neutral2">
                <Trans i18nKey="common.type.label" />
              </Text>
            </FilterHeaderRow>
          </Cell>
        ),
        cell: (outputTokenAddress) => {
          const isBuy = String(outputTokenAddress.getValue?.()).toLowerCase() === referenceToken.address.toLowerCase()
          return (
            <Cell loading={showLoadingSkeleton} minWidth={75} justifyContent="flex-start" grow>
              <Text variant="body2" color={isBuy ? '$statusSuccess' : '$statusCritical'}>
                {isBuy ? <Trans i18nKey="common.buy.label" /> : <Trans i18nKey="common.sell.label" />}
              </Text>
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
              <Text variant="body2" color="$neutral2">
                ${unwrappedReferenceToken.symbol}
              </Text>
            </Cell>
          ),
          cell: (inputTokenAmount) => (
            <Cell loading={showLoadingSkeleton} minWidth={100} justifyContent="flex-end">
              <Text variant="body2" color="$neutral1">
                {formatNumber({
                  input: Math.abs(inputTokenAmount.getValue?.()) || 0,
                })}
              </Text>
            </Cell>
          ),
        },
      ),
      columnHelper.accessor(
        (row) => {
          const nonReferenceSwapLeg =
            row.input.address?.toLowerCase() === referenceToken.address.toLowerCase() ? row.output : row.input
          return (
            <Flex row gap="$gap8" justifyContent="flex-end">
              <StyledSwapAmount>
                {formatNumber({
                  input: Math.abs(nonReferenceSwapLeg.amount) || 0,
                })}
              </StyledSwapAmount>
              <TokenLinkCell token={nonReferenceSwapLeg.token} />
            </Flex>
          )
        },
        {
          id: 'non-reference-amount',
          header: () => (
            <Cell minWidth={160} justifyContent="flex-end">
              <Text variant="body2" color="$neutral2">
                <Trans i18nKey="common.for" />
              </Text>
            </Cell>
          ),
          cell: (swapOutput) => (
            <Cell loading={showLoadingSkeleton} minWidth={160} justifyContent="flex-end">
              {swapOutput.getValue?.()}
            </Cell>
          ),
        },
      ),
      columnHelper.accessor((row) => row.usdValue, {
        id: 'fiat-value',
        header: () => (
          <Cell minWidth={125} justifyContent="flex-end">
            <Flex row gap="$gap4" justifyContent="flex-end">
              <HeaderSortText>{activeLocalCurrency}</HeaderSortText>
            </Flex>
          </Cell>
        ),
        cell: (fiat) => (
          <Cell loading={showLoadingSkeleton} minWidth={125} justifyContent="flex-end">
            <Text variant="body2" color="$neutral1">
              {formatFiatPrice({ price: fiat.getValue?.() })}
            </Text>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.makerAddress, {
        id: 'maker-address',
        header: () => (
          <Cell minWidth={150} justifyContent="flex-end">
            <Text variant="body2" color="$neutral2">
              <Trans i18nKey="common.wallet.label" />
            </Text>
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
