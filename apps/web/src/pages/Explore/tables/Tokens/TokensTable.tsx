/* oxlint-disable typescript/no-unnecessary-condition */

import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { usePrice } from '@universe/prices'
import { ReactElement, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber.web'
import { DEFAULT_NATIVE_ADDRESS, DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/defaults'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { isRemotePriceServiceSupportedChain } from 'uniswap/src/features/prices/isRemotePriceServiceSupportedChain'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { FiatNumberType, NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { SparklineMap } from '~/appGraphql/data/types'
import { getTokenDetailsURL, OrderDirection, unwrapToken } from '~/appGraphql/data/util'
import { SparklineChart } from '~/components/Charts/SparklineChart'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { getExploreMultichainExpandRowMetrics } from '~/features/Explore/state/listTokens/utils/getExploreMultichainExpandRowMetrics'
import { multichainTokenToDisplayToken } from '~/features/Explore/state/listTokens/utils/multichainTokenToDisplayToken'
import { getChainIdsByVolume } from '~/features/Explore/state/listTokens/utils/multichainVolume'
import { useExploreParams } from '~/pages/Explore/redirects'
import { getTokenDescriptionColumnSize, TokenDescription } from '~/pages/Explore/tables/Tokens/TokenDescription'
import { TokenTableHeader } from '~/pages/Explore/tables/Tokens/TokenTableHeader'
import { useTokenTableSortStore } from '~/pages/Explore/tables/Tokens/tokenTableSortStore'
import { VolumeByNetworkPopover } from '~/pages/Explore/tables/Tokens/VolumeByNetworkPopover/VolumeByNetworkPopover'
import { TokenStat } from '~/types/explore'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

const VOLUME_INFO_ICON_WIDTH = 16

interface TokenTableValue {
  index: number
  token: TokenStat
  mcToken: MultichainToken | undefined
  tokenDescription: ReactElement
  percentChange1hr: ReactElement
  percentChange1d: ReactElement
  fdv: string
  fdvRawValue?: number
  volume: string
  volumeRawValue?: number
  sparkline: ReactElement
  link: string
  /** Used for pre-loading TDP with logo to extract color from */
  linkState: { preloadedLogoSrc?: string }
}

const ROW_HEIGHT = 64

function LivePriceCell({ token }: { token?: TokenStat }) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const chainId = token ? fromGraphQLChain(token.chain) : undefined
  const rawAddress = token?.address
  const isLegacyNative = areAddressesEqual({
    addressInput1: { address: rawAddress, platform: Platform.EVM },
    addressInput2: { address: DEFAULT_NATIVE_ADDRESS_LEGACY, platform: Platform.EVM },
  })
  const address = isLegacyNative ? DEFAULT_NATIVE_ADDRESS : rawAddress
  const isRemoteSupported = chainId != null && isRemotePriceServiceSupportedChain(chainId)
  const { price: remotePrice } = usePrice({
    chainId: isRemoteSupported ? chainId : undefined,
    address: isRemoteSupported ? address : undefined,
  })

  const price = remotePrice ?? token?.price?.value
  const formatted = price ? convertFiatAmountFormatted(price, NumberType.FiatTokenPrice) : '-'

  return <AnimatedNumber numericValue={price} textVariant="$body2" value={formatted} />
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
                <AnimatedNumber numericValue={delta1hr} textVariant="$body2" value={formatPercent(delta1hrAbs)} />
              </Flex>
            ),
            percentChange1d: (
              <Flex row gap="$gap4" alignItems="center">
                <DeltaArrow delta={delta1d} formattedDelta={formatPercent(delta1dAbs)} />
                <AnimatedNumber numericValue={delta1d} textVariant="$body2" value={formatPercent(delta1dAbs)} />
              </Flex>
            ),
            fdv: parseAmount(token.fullyDilutedValuation?.value, NumberType.FiatTokenStats),
            fdvRawValue: token.fullyDilutedValuation?.value,
            volume: parseAmount(token.volume?.value, NumberType.FiatTokenStats),
            volumeRawValue: token.volume?.value,
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
              chainQueryParam:
                !chainFilter && mcToken.chainTokens.length > 1 ? TDP_MULTICHAIN_CHAIN_QUERY_VALUE : undefined,
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
    if (showLoadingSkeleton) {
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
  }, [showLoadingSkeleton, tokens, trace])

  const { lg: isLg } = useMedia()
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TokenTableValue>()
    const filteredColumns = [
      !isLg
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
        size: getTokenDescriptionColumnSize(isLg),
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
          <HeaderCell clickable justifyContent="flex-end">
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
          <HeaderCell clickable>
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
        maxSize: 140,
        header: () => (
          <HeaderCell clickable justifyContent="flex-end">
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
          <HeaderCell clickable justifyContent="flex-end">
            <TokenTableHeader
              category={TokenSortMethod.FULLY_DILUTED_VALUATION}
              isCurrentSortMethod={sortMethod === TokenSortMethod.FULLY_DILUTED_VALUATION}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (fdv) => {
          const row = fdv.row?.original as TokenTableValue | undefined
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end" testId={TestID.FdvCell}>
              <AnimatedNumber
                ellipsis
                numericValue={row?.fdvRawValue}
                textVariant="$body2"
                value={fdv.getValue?.() ?? '-'}
              />
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => row.volume, {
        id: 'volume',
        meta: { overflowVisible: true },
        maxSize: 150,
        header: () => (
          <HeaderCell clickable>
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
              <Cell loading={showLoadingSkeleton} grow overflow="visible" testId={TestID.VolumeCell}>
                <AnimatedNumber
                  ellipsis
                  alignRight
                  numericValue={undefined}
                  textVariant="$body2"
                  value={volume.getValue?.() ?? '-'}
                />
              </Cell>
            )
          }
          const isMultichainAsset = (row.mcToken?.chainTokens.length ?? 0) > 1
          return (
            <Cell loading={showLoadingSkeleton} grow overflow="visible" testId={TestID.VolumeCell}>
              <Flex flex={1} minWidth={0} justifyContent="flex-end">
                <VolumeByNetworkPopover mcToken={row.mcToken} timePeriod={timePeriod} volumeFormatted={row.volume}>
                  <Flex position="relative">
                    <AnimatedNumber
                      ellipsis
                      alignRight
                      numericValue={row.volumeRawValue}
                      textVariant="$body2"
                      value={volume.getValue?.() ?? '-'}
                    />
                    {isMultichainAsset ? (
                      <Flex
                        centered
                        position="absolute"
                        width={VOLUME_INFO_ICON_WIDTH}
                        alignItems="flex-end"
                        top={0}
                        right={`-${VOLUME_INFO_ICON_WIDTH}px`}
                        bottom={0}
                        opacity={0}
                        cursor="default"
                        transition="opacity 0.15s ease"
                        $group-hover={{ opacity: 1 }}
                      >
                        <InfoCircle color="$neutral3" size="$icon.12" />
                      </Flex>
                    ) : null}
                  </Flex>
                </VolumeByNetworkPopover>
              </Flex>
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
  }, [orderDirection, showLoadingSkeleton, sortMethod, isLg, t, timePeriod])

  return (
    <Table
      columns={columns}
      data={tokenTableValues}
      loading={loading}
      error={error}
      rowHeight={ROW_HEIGHT}
      compactRowHeight={ROW_HEIGHT}
      loadMore={loadMore}
      maxWidth={1200}
      defaultPinnedColumns={['index', 'tokenDescription']}
    />
  )
}
