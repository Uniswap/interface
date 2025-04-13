import { createColumnHelper } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import { FilterHeaderRow, HeaderArrow, HeaderSortText, TimestampCell } from 'components/Table/styled'
import Row from 'components/deprecated/Row'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import {
  PoolTableTransaction,
  PoolTableTransactionType,
  usePoolTransactions,
} from 'graphql/data/pools/usePoolTransactions'
import { OrderDirection, supportedChainIdFromGQLChain } from 'graphql/data/util'
import styled from 'lib/styled-components'
import { useMemo, useReducer, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { ProtocolVersion, Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { useChainIdFromUrlParam } from 'utils/chainParams'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.neutral2};
  stroke: ${({ theme }) => theme.neutral2};
`

const TableWrapper = styled.div`
  min-height: 256px;
`

enum PoolTransactionColumn {
  Timestamp = 0,
  Type = 1,
  MakerAddress = 2,
  FiatValue = 3,
  InputAmount = 4,
  OutputAmount = 5,
}

const PoolTransactionColumnWidth: { [key in PoolTransactionColumn]: number } = {
  [PoolTransactionColumn.Timestamp]: 120,
  [PoolTransactionColumn.Type]: 144,
  [PoolTransactionColumn.MakerAddress]: 100,
  [PoolTransactionColumn.FiatValue]: 125,
  [PoolTransactionColumn.InputAmount]: 125,
  [PoolTransactionColumn.OutputAmount]: 125,
}

function comparePoolTokens(tokenA: PoolTableTransaction['pool']['token0'], tokenB?: Token) {
  if (tokenB?.address === NATIVE_CHAIN_ID) {
    const chainId = supportedChainIdFromGQLChain(tokenB.chain)
    return chainId && tokenA.id?.toLowerCase() === WRAPPED_NATIVE_CURRENCY[chainId]?.address.toLowerCase()
  }
  return tokenA.id?.toLowerCase() === tokenB?.address?.toLowerCase()
}

export function PoolDetailsTransactionsTable({
  poolAddress,
  token0,
  token1,
  protocolVersion,
}: {
  poolAddress: string
  token0?: Token
  token1?: Token
  protocolVersion?: ProtocolVersion
}) {
  const chainId = useChainIdFromUrlParam() ?? UniverseChainId.Mainnet
  const activeLocalCurrency = useAppFiatCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const filterAnchorRef = useRef<HTMLDivElement>(null)
  const [filter, setFilters] = useState<PoolTableTransactionType[]>([
    PoolTableTransactionType.BUY,
    PoolTableTransactionType.SELL,
    PoolTableTransactionType.REMOVE,
    PoolTableTransactionType.ADD,
  ])

  const { transactions, loading, loadMore, error } = usePoolTransactions(
    poolAddress,
    chainId,
    filter,
    token0,
    protocolVersion,
  )

  const showLoadingSkeleton = loading || !!error
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTableTransaction>()
    return [
      columnHelper.accessor((row) => row, {
        id: 'timestamp',
        header: () => (
          <Cell minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Timestamp]} justifyContent="flex-start">
            <Row gap="4px">
              <HeaderArrow direction={OrderDirection.Desc} />
              <HeaderSortText active>
                <Trans i18nKey="common.time" />
              </HeaderSortText>
            </Row>
          </Cell>
        ),
        cell: (row) => (
          <Cell
            loading={showLoadingSkeleton}
            minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Timestamp]}
            justifyContent="flex-start"
          >
            <TimestampCell
              timestamp={Number(row.getValue?.().timestamp)}
              link={getExplorerLink(chainId, row.getValue?.().transaction, ExplorerDataType.TRANSACTION)}
            />
          </Cell>
        ),
      }),
      columnHelper.accessor(
        (row) => {
          let color, text
          if (row.type === PoolTableTransactionType.BUY) {
            color = 'success'
            text = (
              <span>
                <Trans i18nKey="common.buy.label" />
                &nbsp;{token0?.symbol}
              </span>
            )
          } else if (row.type === PoolTableTransactionType.SELL) {
            color = 'critical'
            text = (
              <span>
                <Trans i18nKey="common.sell.label" />
                &nbsp;{token0?.symbol}
              </span>
            )
          } else {
            color = row.type === PoolTableTransactionType.ADD ? 'success' : 'critical'
            text =
              row.type === PoolTableTransactionType.ADD ? (
                <Trans i18nKey="common.add.label" />
              ) : (
                <Trans i18nKey="common.remove.label" />
              )
          }
          return <ThemedText.BodyPrimary color={color}>{text}</ThemedText.BodyPrimary>
        },
        {
          id: 'swap-type',
          header: () => (
            <Cell minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Type]} justifyContent="flex-start">
              <FilterHeaderRow clickable={filterModalIsOpen} onPress={() => toggleFilterModal()} ref={filterAnchorRef}>
                <Filter
                  allFilters={Object.values(PoolTableTransactionType)}
                  activeFilter={filter}
                  setFilters={setFilters}
                  isOpen={filterModalIsOpen}
                  toggleFilterModal={toggleFilterModal}
                  anchorRef={filterAnchorRef}
                />
                <ThemedText.BodySecondary>
                  <Trans i18nKey="common.type.label" />
                </ThemedText.BodySecondary>
              </FilterHeaderRow>
            </Cell>
          ),
          cell: (PoolTransactionTableType) => (
            <Cell
              loading={showLoadingSkeleton}
              minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Type]}
              justifyContent="flex-start"
            >
              {PoolTransactionTableType.getValue?.()}
            </Cell>
          ),
        },
      ),
      columnHelper.accessor((row) => row.amountUSD, {
        id: 'fiat-value',
        header: () => (
          <Cell minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.FiatValue]} justifyContent="flex-end" grow>
            <ThemedText.BodySecondary>{activeLocalCurrency}</ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (fiat) => (
          <Cell
            loading={showLoadingSkeleton}
            minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.FiatValue]}
            justifyContent="flex-end"
            grow
          >
            <ThemedText.BodyPrimary>{formatFiatPrice({ price: fiat.getValue?.() })}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => (comparePoolTokens(row.pool.token0, token0) ? row.amount0 : row.amount1), {
        id: 'input-amount',
        header: () => (
          <Cell
            loading={showLoadingSkeleton}
            minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.InputAmount]}
            justifyContent="flex-end"
            grow
          >
            <ThemedText.BodySecondary>{token0?.symbol}</ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (inputTokenAmount) => (
          <Cell
            loading={showLoadingSkeleton}
            minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.InputAmount]}
            justifyContent="flex-end"
            grow
          >
            <ThemedText.BodyPrimary>
              {formatNumber({ input: Math.abs(inputTokenAmount.getValue?.() ?? 0), type: NumberType.TokenTx })}
            </ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => (comparePoolTokens(row.pool.token0, token0) ? row.amount1 : row.amount0), {
        id: 'output-amount',
        header: () => (
          <Cell
            loading={showLoadingSkeleton}
            minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.OutputAmount]}
            justifyContent="flex-end"
            grow
          >
            <ThemedText.BodySecondary>{token1?.symbol}</ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (outputTokenAmount) => (
          <Cell
            loading={showLoadingSkeleton}
            minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.OutputAmount]}
            justifyContent="flex-end"
            grow
          >
            <ThemedText.BodyPrimary>
              {formatNumber({ input: Math.abs(outputTokenAmount.getValue?.() ?? 0), type: NumberType.TokenTx })}
            </ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.maker, {
        id: 'maker-address',
        header: () => (
          <Cell
            minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.MakerAddress]}
            justifyContent="flex-end"
            grow
          >
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.wallet.label" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (makerAddress) => (
          <Cell
            loading={showLoadingSkeleton}
            minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.MakerAddress]}
            justifyContent="flex-end"
            grow
          >
            <StyledExternalLink href={getExplorerLink(chainId, makerAddress.getValue?.(), ExplorerDataType.ADDRESS)}>
              <ThemedText.BodyPrimary>{shortenAddress(makerAddress.getValue?.(), 0)}</ThemedText.BodyPrimary>
            </StyledExternalLink>
          </Cell>
        ),
      }),
    ]
  }, [
    activeLocalCurrency,
    chainId,
    filter,
    filterModalIsOpen,
    formatFiatPrice,
    formatNumber,
    showLoadingSkeleton,
    token0,
    token1?.symbol,
  ])

  return (
    <TableWrapper data-testid="pool-details-transactions-table">
      <Table
        columns={columns}
        data={transactions}
        loading={loading}
        error={error}
        loadMore={loadMore}
        maxHeight={600}
      />
    </TableWrapper>
  )
}
