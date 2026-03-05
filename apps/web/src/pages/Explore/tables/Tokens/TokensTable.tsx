/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import { ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { FiatNumberType, NumberType } from 'utilities/src/format/types'
import { SparklineMap } from '~/appGraphql/data/types'
import { getTokenDetailsURL, OrderDirection, unwrapToken } from '~/appGraphql/data/util'
import SparklineChart from '~/components/Charts/SparklineChart'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { EllipsisText, HeaderCell, TableText } from '~/components/Table/styled'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { useExploreTablesFilterStore } from '~/pages/Explore/exploreTablesFilterStore'
import { TokenDescription } from '~/pages/Explore/tables/Tokens/TokenDescription'
import { TokenTableHeader } from '~/pages/Explore/tables/Tokens/TokenTableHeader'
import { useTokenTableSortStore } from '~/pages/Explore/tables/Tokens/tokenTableSortStore'
import { TokenStat } from '~/state/explore/types'
import { getChainIdFromChainUrlParam } from '~/utils/chainParams'

interface TokenTableValue {
  index: number
  tokenDescription: ReactElement
  price: string
  percentChange1hr: ReactElement
  percentChange1d: ReactElement
  fdv: string
  volume: string
  sparkline: ReactElement
  link: string
  /** Used for pre-loading TDP with logo to extract color from */
  linkState: { preloadedLogoSrc?: string }
}

export function TokenTable({
  tokens,
  tokenSortRank,
  sparklines,
  loading,
  error,
  loadMore,
}: {
  tokens?: readonly TokenStat[]
  tokenSortRank: Record<string, number>
  sparklines: SparklineMap
  loading: boolean
  error?: ApolloError | boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
}) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const { defaultChainId } = useEnabledChains()
  const { sortMethod, sortAscending } = useTokenTableSortStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const { filterString, timePeriod } = useExploreTablesFilterStore((s) => ({
    filterString: s.filterString,
    timePeriod: s.timePeriod,
  }))

  const tokenTableValues: TokenTableValue[] | undefined = useMemo(
    () =>
      tokens?.map((token, i) => {
        const delta1hr = token.pricePercentChange1Hour?.value
        const delta1hrAbs = delta1hr !== undefined ? Math.abs(delta1hr) : undefined
        const delta1d = token.pricePercentChange1Day?.value
        const delta1dAbs = delta1d !== undefined ? Math.abs(delta1d) : undefined
        const currCurrencyId = buildCurrencyId(fromGraphQLChain(token.chain) ?? UniverseChainId.Mainnet, token.address)
        const tokenSortIndex = tokenSortRank[currCurrencyId]
        const chainId = getChainIdFromChainUrlParam(token.chain.toLowerCase())
        const unwrappedToken = chainId ? unwrapToken(chainId, token) : token

        const parseAmount = (amount: number | undefined, type: FiatNumberType): string => {
          return amount ? convertFiatAmountFormatted(amount, type) : '-'
        }

        return {
          index: tokenSortIndex,
          tokenDescription: <TokenDescription token={unwrappedToken} />,
          price: parseAmount(token.price?.value, NumberType.FiatTokenPrice),
          testId: `${TestID.TokenTableRowPrefix}${unwrappedToken.address}`,
          percentChange1hr: (
            <Flex row gap="$gap4" alignItems="center">
              <DeltaArrow delta={delta1hr} formattedDelta={formatPercent(delta1hrAbs)} />
              <TableText>{formatPercent(delta1hrAbs)}</TableText>
            </Flex>
          ),
          percentChange1d: (
            <Flex row gap="$gap4" alignItems="center">
              <DeltaArrow delta={delta1d} formattedDelta={formatPercent(delta1dAbs)} />
              <TableText>{formatPercent(delta1dAbs)}</TableText>
            </Flex>
          ),
          fdv: parseAmount(token.fullyDilutedValuation?.value, NumberType.FiatTokenStats),
          volume: parseAmount(token.volume?.value, NumberType.FiatTokenStats),
          sparkline: (
            <SparklineChart
              width={80}
              height={20}
              tokenData={token}
              pricePercentChange={token.pricePercentChange1Day?.value}
              sparklineMap={sparklines}
            />
          ),
          link: getTokenDetailsURL({
            address: unwrappedToken.address,
            chain: toGraphQLChain(chainId ?? defaultChainId),
          }),
          analytics: {
            elementName: ElementName.TokensTableRow,
            properties: {
              chain_id: chainId,
              token_address: token.address,
              token_symbol: token.symbol,
              token_list_index: i,
              token_list_rank: tokenSortIndex,
              token_list_length: tokens.length,
              time_frame: timePeriod,
              search_token_address_input: filterString,
            },
          },
          linkState: { preloadedLogoSrc: token.logo },
        }
      }) ?? [],
    [
      convertFiatAmountFormatted,
      defaultChainId,
      filterString,
      formatPercent,
      sparklines,
      timePeriod,
      tokenSortRank,
      tokens,
    ],
  )

  const showLoadingSkeleton = loading || !!error

  const media = useMedia()
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TokenTableValue>()
    const filteredColumns = [
      !media.lg
        ? columnHelper.accessor((row) => row.index, {
            id: 'index',
            size: 60,
            header: () => (
              <HeaderCell justifyContent="flex-start">
                <Text variant="body3" color="$neutral2">
                  #
                </Text>
              </HeaderCell>
            ),
            cell: (index) => (
              <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
                <TableText>{index.getValue?.()}</TableText>
              </Cell>
            ),
          })
        : null,
      columnHelper.accessor((row) => row.tokenDescription, {
        id: 'tokenDescription',
        size: media.lg ? 150 : 300,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('common.tokenName')}
            </Text>
          </HeaderCell>
        ),
        cell: (tokenDescription) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} testId={TestID.NameCell}>
            <TableText>{tokenDescription.getValue?.()}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.price, {
        id: 'price',
        maxSize: 140,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <TokenTableHeader
              category={TokenSortMethod.PRICE}
              isCurrentSortMethod={sortMethod === TokenSortMethod.PRICE}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (price) => (
          <Cell loading={showLoadingSkeleton} testId={TestID.PriceCell} justifyContent="flex-end">
            <TableText>
              {/* A simple 0 price indicates the price is not currently available from the api */}
              {price.getValue?.()}
            </TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.percentChange1hr, {
        id: 'percentChange1hr',
        maxSize: 100,
        header: () => (
          <HeaderCell>
            <TokenTableHeader
              category={TokenSortMethod.HOUR_CHANGE}
              isCurrentSortMethod={sortMethod === TokenSortMethod.HOUR_CHANGE}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (percentChange1hr) => (
          <Cell loading={showLoadingSkeleton}>
            <TableText>{percentChange1hr.getValue?.()}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.percentChange1d, {
        id: 'percentChange1d',
        maxSize: 120,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <TokenTableHeader
              category={TokenSortMethod.DAY_CHANGE}
              isCurrentSortMethod={sortMethod === TokenSortMethod.DAY_CHANGE}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (percentChange1d) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
            <TableText>{percentChange1d.getValue?.()}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.fdv, {
        id: 'fdv',
        maxSize: 120,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <TokenTableHeader
              category={TokenSortMethod.FULLY_DILUTED_VALUATION}
              isCurrentSortMethod={sortMethod === TokenSortMethod.FULLY_DILUTED_VALUATION}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (fdv) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end" testId={TestID.FdvCell}>
            <EllipsisText>{fdv.getValue?.()}</EllipsisText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.volume, {
        id: 'volume',
        maxSize: 150,
        header: () => (
          <HeaderCell>
            <TokenTableHeader
              category={TokenSortMethod.VOLUME}
              isCurrentSortMethod={sortMethod === TokenSortMethod.VOLUME}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (volume) => (
          <Cell loading={showLoadingSkeleton} grow testId={TestID.VolumeCell}>
            <EllipsisText>{volume.getValue?.()}</EllipsisText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.sparkline, {
        id: 'sparkline',
        maxSize: 120,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('explore.tokens.table.column.sparkline')}
            </Text>
          </HeaderCell>
        ),
        cell: (sparkline) => <Cell loading={showLoadingSkeleton}>{sparkline.getValue?.()}</Cell>,
      }),
    ]

    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [orderDirection, showLoadingSkeleton, sortMethod, media, t])

  return (
    <Table
      columns={columns}
      data={tokenTableValues}
      loading={loading}
      error={error}
      v2={false}
      loadMore={loadMore}
      maxWidth={1200}
      defaultPinnedColumns={['index', 'tokenDescription']}
    />
  )
}
