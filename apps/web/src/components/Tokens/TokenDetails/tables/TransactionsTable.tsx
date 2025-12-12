/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import {
  getTokenTransactionTypeTranslation,
  TokenTransactionType,
  useTokenTransactions,
} from 'appGraphql/data/useTokenTransactions'
import { unwrapToken } from 'appGraphql/data/util'
import { useUpdateManualOutage } from 'featureFlags/flags/outageBanner'
import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import { Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import {
  EllipsisText,
  FilterHeaderRow,
  HeaderCell,
  HeaderSortText,
  StyledExternalLink,
  TableText,
  TimestampCell,
  TokenLinkCell,
} from 'components/Table/styled'
import { useMemo, useReducer, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { Flex, styled, Text, useMedia } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'

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
  token: GraphQLApi.Token
}

export function TransactionsTable({ chainId, referenceToken }: { chainId: UniverseChainId; referenceToken: Token }) {
  const activeLocalCurrency = useAppFiatCurrency()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const filterAnchorRef = useRef<HTMLDivElement>(null)
  const [filter, setFilters] = useState<TokenTransactionType[]>([TokenTransactionType.BUY, TokenTransactionType.SELL])
  const { transactions, loading, loadMore, errorV2, errorV3 } = useTokenTransactions({
    address: referenceToken.address,
    chainId,
    filter,
  })
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

  const media = useMedia()

  const showLoadingSkeleton = allDataStillLoading || !!combinedError
  // TODO(WEB-3236): once GQL BE Transaction query is supported add usd, token0 amount, and token1 amount sort support
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<SwapTransaction>()
    return [
      columnHelper.accessor((row) => row, {
        id: 'timestamp',
        maxSize: 80,
        header: () => (
          <HeaderCell justifyContent="flex-start" grow>
            <Flex row gap="$gap4" alignItems="center">
              <Text variant="body3" color="$neutral2">
                <Trans i18nKey="common.time" />
              </Text>
            </Flex>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-start" grow>
            <TimestampCell
              timestamp={Number(row.getValue?.().timestamp)}
              link={getExplorerLink({
                chainId,
                data: row.getValue?.().hash,
                type: ExplorerDataType.TRANSACTION,
              })}
            />
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.output.address, {
        id: 'swap-type',
        maxSize: 80,
        header: () => (
          <HeaderCell justifyContent="flex-start" grow>
            <FilterHeaderRow
              clickable={filterModalIsOpen}
              onPress={filterModalIsOpen ? undefined : toggleFilterModal}
              alignItems="center"
              ref={filterAnchorRef}
            >
              <Filter
                allFilters={Object.values(TokenTransactionType).map((type) => ({
                  value: type,
                  label: getTokenTransactionTypeTranslation(type),
                }))}
                activeFilter={filter}
                setFilters={setFilters}
                isOpen={filterModalIsOpen}
                toggleFilterModal={toggleFilterModal}
                anchorRef={filterAnchorRef}
              />
              <Text variant="body3" color="$neutral2">
                <Trans i18nKey="common.type.label" />
              </Text>
            </FilterHeaderRow>
          </HeaderCell>
        ),
        cell: (outputTokenAddress) => {
          const isBuy = areAddressesEqual({
            addressInput1: { address: String(outputTokenAddress.getValue?.()), platform: Platform.EVM },
            addressInput2: { address: referenceToken.address, platform: Platform.EVM },
          })
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-start" grow>
              <TableText color={isBuy ? '$statusSuccess' : '$statusCritical'}>
                {isBuy ? <Trans i18nKey="common.buy.label" /> : <Trans i18nKey="common.sell.label" />}
              </TableText>
            </Cell>
          )
        },
      }),
      columnHelper.accessor(
        (row) =>
          areAddressesEqual({
            addressInput1: { address: row.input.address, platform: Platform.EVM },
            addressInput2: { address: referenceToken.address, platform: Platform.EVM },
          })
            ? row.input.amount
            : row.output.amount,
        {
          id: 'reference-amount',
          maxSize: 80,
          header: () => (
            <HeaderCell justifyContent="flex-end">
              <Text variant="body3" color="$neutral2">
                ${unwrappedReferenceToken.symbol}
              </Text>
            </HeaderCell>
          ),
          cell: (inputTokenAmount) => (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              <TableText>
                {formatNumberOrString({
                  value: Math.abs(inputTokenAmount.getValue?.()) || 0,
                  type: NumberType.TokenNonTx,
                })}
              </TableText>
            </Cell>
          ),
        },
      ),
      columnHelper.accessor(
        (row) => {
          const nonReferenceSwapLeg = areAddressesEqual({
            addressInput1: { address: row.input.address, platform: Platform.EVM },
            addressInput2: { address: referenceToken.address, platform: Platform.EVM },
          })
            ? row.output
            : row.input
          return (
            <Flex row gap="$gap8" justifyContent="flex-end" alignItems="center">
              <EllipsisText maxWidth={75}>
                {formatNumberOrString({
                  value: Math.abs(nonReferenceSwapLeg.amount) || 0,
                  type: NumberType.TokenQuantityStats,
                })}
              </EllipsisText>
              <TokenLinkCell token={nonReferenceSwapLeg.token} />
            </Flex>
          )
        },
        {
          id: 'non-reference-amount',
          maxSize: 160,
          header: () => (
            <HeaderCell justifyContent="flex-end">
              <Text variant="body3" color="$neutral2">
                <Trans i18nKey="common.for" />
              </Text>
            </HeaderCell>
          ),
          cell: (swapOutput) => (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              <TableText>{swapOutput.getValue?.()}</TableText>
            </Cell>
          ),
        },
      ),
      columnHelper.accessor((row) => row.usdValue, {
        id: 'fiat-value',
        maxSize: 100,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Flex row gap="$gap4" justifyContent="flex-end">
              <HeaderSortText>{activeLocalCurrency}</HeaderSortText>
            </Flex>
          </HeaderCell>
        ),
        cell: (fiat) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
            <TableText>{convertFiatAmountFormatted(fiat.getValue?.(), NumberType.FiatTokenPrice)}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.makerAddress, {
        id: 'maker-address',
        maxSize: 130,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="common.wallet.label" />
            </Text>
          </HeaderCell>
        ),
        cell: (makerAddress) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
            <StyledExternalLink
              href={getExplorerLink({
                chainId,
                data: makerAddress.getValue?.(),
                type: ExplorerDataType.ADDRESS,
              })}
            >
              <TableText>{shortenAddress({ address: makerAddress.getValue?.() })}</TableText>
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
    formatNumberOrString,
    activeLocalCurrency,
    convertFiatAmountFormatted,
  ])

  return (
    <TableWrapper>
      <Table
        columns={columns}
        data={data}
        loading={allDataStillLoading}
        error={combinedError}
        v2={false}
        loadMore={loadMore}
        maxHeight={600}
        defaultPinnedColumns={['timestamp', 'swap-type']}
        forcePinning={media.xxl}
      />
    </TableWrapper>
  )
}
