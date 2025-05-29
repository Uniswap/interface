import { createColumnHelper } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import { FilterHeaderRow, TableText, TimestampCell } from 'components/Table/styled'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import {
  PoolTableTransaction,
  PoolTableTransactionType,
  usePoolTransactions,
} from 'graphql/data/pools/usePoolTransactions'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'
import styled from 'lib/styled-components'
import { useMemo, useReducer, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { ExternalLink } from 'theme/components/Links'
import { Flex, Text, useMedia } from 'ui/src'
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
  [PoolTransactionColumn.Timestamp]: 80,
  [PoolTransactionColumn.Type]: 90,
  [PoolTransactionColumn.MakerAddress]: 125,
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
        size: PoolTransactionColumnWidth[PoolTransactionColumn.Timestamp],
        header: () => (
          <Cell justifyContent="flex-start">
            <Flex row gap="4px">
              <Text variant="body3" color="$neutral1">
                <Trans i18nKey="common.time" />
              </Text>
            </Flex>
          </Cell>
        ),
        cell: (row) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
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
            color = '$statusSuccess'
            text = (
              <span>
                <Trans i18nKey="common.buy.label" />
                &nbsp;{token0?.symbol}
              </span>
            )
          } else if (row.type === PoolTableTransactionType.SELL) {
            color = '$statusCritical'
            text = (
              <span>
                <Trans i18nKey="common.sell.label" />
                &nbsp;{token0?.symbol}
              </span>
            )
          } else {
            color = row.type === PoolTableTransactionType.ADD ? '$statusSuccess' : '$statusCritical'
            text =
              row.type === PoolTableTransactionType.ADD ? (
                <Trans i18nKey="common.add.label" />
              ) : (
                <Trans i18nKey="common.remove.label" />
              )
          }
          return <TableText color={color}>{text}</TableText>
        },
        {
          id: 'swap-type',
          size: PoolTransactionColumnWidth[PoolTransactionColumn.Type],
          header: () => (
            <Cell justifyContent="flex-start">
              <FilterHeaderRow clickable={filterModalIsOpen} onPress={() => toggleFilterModal()} ref={filterAnchorRef}>
                <Filter
                  allFilters={Object.values(PoolTableTransactionType)}
                  activeFilter={filter}
                  setFilters={setFilters}
                  isOpen={filterModalIsOpen}
                  toggleFilterModal={toggleFilterModal}
                  anchorRef={filterAnchorRef}
                />
                <Text variant="body3" color="$neutral1">
                  <Trans i18nKey="common.type.label" />
                </Text>
              </FilterHeaderRow>
            </Cell>
          ),
          cell: (PoolTransactionTableType) => (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
              {PoolTransactionTableType.getValue?.()}
            </Cell>
          ),
        },
      ),
      columnHelper.accessor((row) => row.amountUSD, {
        id: 'fiat-value',
        maxSize: PoolTransactionColumnWidth[PoolTransactionColumn.FiatValue],
        header: () => (
          <Cell justifyContent="flex-end" grow>
            <Text variant="body3" color="$neutral1">
              {activeLocalCurrency}
            </Text>
          </Cell>
        ),
        cell: (fiat) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end" grow>
            <TableText>{formatFiatPrice({ price: fiat.getValue?.() })}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => (comparePoolTokens(row.pool.token0, token0) ? row.amount0 : row.amount1), {
        id: 'input-amount',
        maxSize: PoolTransactionColumnWidth[PoolTransactionColumn.InputAmount],
        header: () => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end" grow>
            <Text variant="body3" color="$neutral1">
              {token0?.symbol}
            </Text>
          </Cell>
        ),
        cell: (inputTokenAmount) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end" grow>
            <TableText>
              {formatNumber({ input: Math.abs(inputTokenAmount.getValue?.() ?? 0), type: NumberType.TokenTx })}
            </TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => (comparePoolTokens(row.pool.token0, token0) ? row.amount1 : row.amount0), {
        id: 'output-amount',
        maxSize: PoolTransactionColumnWidth[PoolTransactionColumn.OutputAmount],
        header: () => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end" grow>
            <Text variant="body3" color="$neutral1">
              {token1?.symbol}
            </Text>
          </Cell>
        ),
        cell: (outputTokenAmount) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end" grow>
            <TableText>
              {formatNumber({ input: Math.abs(outputTokenAmount.getValue?.() ?? 0), type: NumberType.TokenTx })}
            </TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.maker, {
        id: 'maker-address',
        maxSize: PoolTransactionColumnWidth[PoolTransactionColumn.MakerAddress],
        header: () => (
          <Cell justifyContent="flex-end" grow>
            <Text variant="body3" color="$neutral1">
              <Trans i18nKey="common.wallet.label" />
            </Text>
          </Cell>
        ),
        cell: (makerAddress) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end" grow>
            <StyledExternalLink href={getExplorerLink(chainId, makerAddress.getValue?.(), ExplorerDataType.ADDRESS)}>
              <TableText>{shortenAddress(makerAddress.getValue?.(), 0)}</TableText>
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

  const media = useMedia()

  return (
    <TableWrapper data-testid="pool-details-transactions-table">
      <Table
        columns={columns}
        data={transactions}
        loading={loading}
        error={error}
        loadMore={loadMore}
        maxHeight={600}
        defaultPinnedColumns={['timestamp', 'swap-type']}
        forcePinning={media.xxl}
      />
    </TableWrapper>
  )
}
