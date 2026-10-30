/* oxlint-disable typescript/no-unnecessary-condition */

import { createColumnHelper } from '@tanstack/react-table'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { Flex, Text, TouchableTextLink, type TouchableTextLinkProps } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { WalletHoverCard } from '~/components/HoverCard/WalletHoverCard/WalletHoverCard'
import { InternalLink } from '~/components/InternalLink'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { Filter } from '~/components/Table/Filter'
import { HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { EllipsisText, TableText } from '~/components/Table/shared/TableText'
import { TimestampCell } from '~/components/Table/shared/TimestampCell'
import { TokenLinkCell } from '~/components/Table/shared/TokenLinkCell'
import { FilterHeaderRow, HeaderCell } from '~/components/Table/styled'
import { unwrapToken } from '~/data/util'
import { TokenTransactionType, useTokenTransactions } from '~/features/Explore/state/transactions/useTokenTransactions'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

interface SwapTransaction {
  hash: string
  chainId: UniverseChainId
  timestamp: number
  direction: TokenTransactionType
  input: SwapLeg
  output: SwapLeg
  value: string
  makerAddress: string
}

interface SwapLeg {
  address?: string
  symbol?: string
  amount: number
  token: ParsedToken
}

export function TransactionsTable({
  chainId,
  referenceToken,
  isMultichainView,
}: {
  chainId: UniverseChainId
  referenceToken: Token
  isMultichainView: boolean
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const activeLocalCurrency = useAppFiatCurrency()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const filterAnchorRef = useRef<HTMLDivElement>(null)
  const [filter, setFilters] = useState<TokenTransactionType[]>([TokenTransactionType.BUY, TokenTransactionType.SELL])
  // The multichain view scopes by the token's multichain id (v2 lets the BE resolve every chain +
  // native/wrapped); the per-chain addresses let the hook classify Buy/Sell on cross-chain rows.
  const multichainToken = useTDPStore((s) => s.multichainToken)
  const { transactions, isLoading, loadMore, error } = useTokenTransactions({
    address: referenceToken.address,
    chainId,
    filter,
    multichain: isMultichainView,
    multichainId: multichainToken?.multichainId,
    multichainAddresses: multichainToken?.addresses,
  })

  const hasError = Boolean(error)

  const dataStillLoading = isLoading && !transactions.length
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
        const { token0IsBeingSold } = transaction
        return {
          hash: transaction.hash,
          chainId: transaction.chainId,
          timestamp: transaction.timestamp,
          direction: transaction.direction,
          input: token0IsBeingSold ? swapLeg0 : swapLeg1,
          output: token0IsBeingSold ? swapLeg1 : swapLeg0,
          value: convertFiatAmountFormatted(transaction.usdValue, NumberType.FiatTokenPrice),
          makerAddress: transaction.account,
        }
      }),
    [transactions, convertFiatAmountFormatted],
  )

  const getTokenTransactionTypeTranslation = useEvent((type: TokenTransactionType): string => {
    switch (type) {
      case TokenTransactionType.BUY:
        return t('common.buy.label')
      case TokenTransactionType.SELL:
        return t('common.sell.label')
      default:
        return ''
    }
  })

  const showLoadingSkeleton = dataStillLoading || hasError
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
                {t('common.time')}
              </Text>
            </Flex>
          </HeaderCell>
        ),
        cell: (row) => {
          const tx = row.getValue?.()
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-start" grow>
              <TimestampCell
                timestamp={Number(tx?.timestamp)}
                link={getExplorerLink({
                  chainId: tx?.chainId ?? chainId,
                  data: tx?.hash,
                  type: ExplorerDataType.TRANSACTION,
                })}
              />
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => row, {
        id: 'swap-type',
        maxSize: 80,
        header: () => (
          <HeaderCell justifyContent="flex-start" grow>
            <FilterHeaderRow
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
                {t('common.type.label')}
              </Text>
            </FilterHeaderRow>
          </HeaderCell>
        ),
        cell: (info) => {
          const tx = info.getValue?.()
          const isBuy = tx?.direction === TokenTransactionType.BUY
          const color = isBuy ? '$statusSuccess' : '$statusCritical'
          const text = isBuy ? t('common.buy.label') : t('common.sell.label')
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-start" grow>
              <TouchableTextLink
                onlyUseText
                noUnderline
                color={color}
                link={getExplorerLink({
                  chainId: tx?.chainId ?? chainId,
                  data: tx?.hash,
                  type: ExplorerDataType.TRANSACTION,
                })}
                variant={'body2' as TouchableTextLinkProps['variant']}
              >
                {text}
              </TouchableTextLink>
            </Cell>
          )
        },
      }),
      columnHelper.accessor(
        (row) => (row.direction === TokenTransactionType.SELL ? row.input.amount : row.output.amount),
        {
          id: 'reference-amount',
          maxSize: 80,
          header: () => (
            <HeaderCell justifyContent="flex-end">
              <Text variant="body3" color="$neutral2">
                {getSymbolDisplayText(unwrappedReferenceToken.symbol)}
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
          const nonReferenceSwapLeg = row.direction === TokenTransactionType.SELL ? row.output : row.input
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
                {t('common.for')}
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
      columnHelper.accessor((row) => row.value, {
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
            <TableText>{fiat.getValue?.()}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row, {
        id: 'maker-address',
        maxSize: 130,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2">
              {t('common.wallet.label')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          const tx = info.getValue?.()
          const address = tx?.makerAddress
          const shortenedAddress = shortenAddress({ address })

          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              <WalletHoverCard address={address} chainId={tx?.chainId ?? chainId}>
                <InternalLink to={buildPortfolioUrl({ externalAddress: address })}>
                  <TableText>{shortenedAddress}</TableText>
                </InternalLink>
              </WalletHoverCard>
            </Cell>
          )
        },
      }),
    ]
  }, [
    t,
    showLoadingSkeleton,
    chainId,
    filterModalIsOpen,
    filter,
    getTokenTransactionTypeTranslation,
    unwrappedReferenceToken.symbol,
    formatNumberOrString,
    activeLocalCurrency,
  ])

  return (
    <Flex position="relative" minHeight={158}>
      <Table
        mobileFullBleed
        columns={columns}
        data={data}
        loading={dataStillLoading}
        error={hasError}
        loadMore={loadMore}
        maxHeight={600}
        defaultPinnedColumns={media.lg ? ['timestamp'] : ['timestamp', 'swap-type']}
        forcePinning={media.xxl}
      />
    </Flex>
  )
}
