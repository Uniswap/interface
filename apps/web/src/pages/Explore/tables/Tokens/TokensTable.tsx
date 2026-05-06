/* oxlint-disable typescript/no-unnecessary-condition */

import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { ReactElement, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenSpotPriceWrapper'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { FiatNumberType, NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { SparklineMap } from '~/appGraphql/data/types'
import { getTokenDetailsURL, OrderDirection, unwrapToken } from '~/appGraphql/data/util'
import SparklineChart from '~/components/Charts/SparklineChart'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { EllipsisText, TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { getChainIdFromChainUrlParam } from '~/features/params/chainParams'
import { useExploreParams } from '~/pages/Explore/redirects'
import { getTokenDescriptionColumnSize, TokenDescription } from '~/pages/Explore/tables/Tokens/TokenDescription'
import { TokenTableHeader } from '~/pages/Explore/tables/Tokens/TokenTableHeader'
import { useTokenTableSortStore } from '~/pages/Explore/tables/Tokens/tokenTableSortStore'
import { VolumeByNetworkPopover } from '~/pages/Explore/tables/Tokens/VolumeByNetworkPopover/VolumeByNetworkPopover'
import { useExploreTablesFilterStore } from '~/state/explore/exploreTablesFilterStore'
import { getExploreMultichainExpandRowMetrics } from '~/state/explore/listTokens/utils/getExploreMultichainExpandRowMetrics'
import { multichainTokenToDisplayToken } from '~/state/explore/listTokens/utils/multichainTokenToDisplayToken'
import { getChainIdsByVolume } from '~/state/explore/listTokens/utils/multichainVolume'
import { TokenStat } from '~/state/explore/types'

interface TokenTableValue {
  index: number
  token: TokenStat
  mcToken: MultichainToken | undefined
  tokenDescription: ReactElement
  percentChange1hr: ReactElement
  percentChange1d: ReactElement
  fdv: string
  volume: string
  sparkline: ReactElement
  link: string
  /** Used for pre-loading TDP with logo to extract color from */
  linkState: { preloadedLogoSrc?: string }
}

function LivePriceCell({ token }: { token?: TokenStat }) {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const chainId = token ? fromGraphQLChain(token.chain) : undefined
  const currencyId = chainId && token?.address ? buildCurrencyId(chainId, token.address) : undefined
  const livePrice = useTokenSpotPrice(currencyId)

  const price = livePrice ?? token?.price?.value
  const formatted = price ? convertFiatAmountFormatted(price, NumberType.FiatTokenPrice) : '-'

  return <TableText>{formatted}</TableText>
}

export function TokenTable({
  tokens,
  tokenSortRank,
  sparklines,
  loading,
  error,
  loadMore,
}: {
  tokens?: readonly MultichainToken[]
  tokenSortRank: Record<string, number>
  sparklines: SparklineMap
  loading: boolean
  error?: ApolloError | boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
}) {
  const { t } = useTranslation()
  const trace = useTrace()
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
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
  const chainFilter = useExploreParams().chainName
  const exploreChainId = chainFilter ? getChainIdFromChainUrlParam(chainFilter) : undefined

  const tokenTableValues: TokenTableValue[] | undefined = useMemo(
    () =>
      tokens?.flatMap((mcToken, i) => {
        const token = multichainTokenToDisplayToken({ mcToken, filterTimePeriod: timePeriod, exploreChainId })
        if (!token) {
          return []
        }
        const delta1hr = token.pricePercentChange1Hour?.value
        const delta1hrAbs = delta1hr !== undefined ? Math.abs(delta1hr) : undefined
        const delta1d = token.pricePercentChange1Day?.value
        const delta1dAbs = delta1d !== undefined ? Math.abs(delta1d) : undefined
        const tokenSortIndex = tokenSortRank[mcToken.multichainId]
        const chainId = getChainIdFromChainUrlParam(token.chain.toLowerCase())
        const unwrappedToken = chainId ? unwrapToken(chainId, token) : token

        const parseAmount = (amount: number | undefined, type: FiatNumberType): string => {
          return amount ? convertFiatAmountFormatted(amount, type) : '-'
        }

        return [
          {
            index: tokenSortIndex,
            token,
            mcToken,
            tokenDescription: (
              <TokenDescription
                chainFilter={chainFilter}
                chainIdsByVolume={getChainIdsByVolume(mcToken, timePeriod)}
                token={unwrappedToken}
              />
            ),
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
              chainUrlParam: chainFilter,
              chainQueryParam: chainFilter,
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
          },
        ]
      }) ?? [],
    [
      chainFilter,
      exploreChainId,
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

  useEffect(() => {
    if (!multichainTokenUxEnabled || showLoadingSkeleton) {
      return
    }
    const { totalTokenRowCount, multichainRowReductionCount, multichainAssetCount } =
      getExploreMultichainExpandRowMetrics(tokens)
    sendAnalyticsEvent(UniswapEventName.MultichainExploreMetrics, {
      ...trace,
      total_token_row_count: totalTokenRowCount,
      multichain_row_reduction_count: multichainRowReductionCount,
      multichain_asset_count: multichainAssetCount,
      element: ElementName.ExploreTokensTab,
      section: SectionName.ExploreTopTokensSection,
    })
  }, [multichainTokenUxEnabled, showLoadingSkeleton, tokens, trace])

  const rowHeight = useMemo(() => (multichainTokenUxEnabled ? 64 : undefined), [multichainTokenUxEnabled])

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
        size: getTokenDescriptionColumnSize(media.lg, multichainTokenUxEnabled),
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('explore.table.column.token')}
            </Text>
          </HeaderCell>
        ),
        cell: (tokenDescription) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} testId={TestID.NameCell}>
            <TableText flex={1} minWidth={0} width="100%">
              {tokenDescription.getValue?.()}
            </TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.token, {
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
        cell: (tokenCell) => (
          <Cell loading={showLoadingSkeleton} testId={TestID.PriceCell} justifyContent="flex-end">
            <LivePriceCell token={tokenCell.getValue?.()} />
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
        cell: (volume) => {
          const row = volume.row?.original as TokenTableValue | undefined
          if (!row) {
            return (
              <Cell loading={showLoadingSkeleton} grow testId={TestID.VolumeCell}>
                <EllipsisText>{volume.getValue?.()}</EllipsisText>
              </Cell>
            )
          }
          return (
            <Cell loading={showLoadingSkeleton} grow testId={TestID.VolumeCell}>
              <VolumeByNetworkPopover mcToken={row.mcToken} timePeriod={timePeriod} volumeFormatted={row.volume}>
                <EllipsisText>{volume.getValue?.()}</EllipsisText>
              </VolumeByNetworkPopover>
            </Cell>
          )
        },
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
  }, [orderDirection, multichainTokenUxEnabled, showLoadingSkeleton, sortMethod, media, t, timePeriod])

  return (
    <Table
      columns={columns}
      data={tokenTableValues}
      loading={loading}
      error={error}
      v2={multichainTokenUxEnabled}
      rowHeight={rowHeight}
      compactRowHeight={rowHeight}
      loadMore={loadMore}
      maxWidth={1200}
      defaultPinnedColumns={['index', 'tokenDescription']}
    />
  )
}
