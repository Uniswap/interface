/* eslint-disable import/no-unused-modules */
import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { SparklineMap } from 'appGraphql/data/types'
import { OrderDirection, getTokenDetailsURL, unwrapFewToken, unwrapToken } from 'appGraphql/data/util'
import SparklineChart from 'components/Charts/SparklineChart'
import QueryTokenLogo, { QueryRingTokenLogo } from 'components/Logo/QueryTokenLogo'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import {
  ClickableHeaderRow,
  EllipsisText,
  HeaderArrow,
  HeaderCell,
  HeaderSortText,
  TableText,
} from 'components/Table/styled'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import {
  RingTokenSortMethod,
  TokenSortMethod,
  exploreSearchStringAtom,
  filterRingTimeAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  sortRingMethodAtom,
  useSetSortMethod,
  useSetSortRingMethod,
} from 'components/Tokens/state'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import useSimplePagination from 'hooks/useSimplePagination'
import { useAtomValue } from 'jotai/utils'
import { ReactElement, ReactNode, memo, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { TABLE_PAGE_SIZE, giveExploreStatDefaultValue } from 'state/explore'
import { useRingTopTokens as useRestTopTokens } from 'state/explore/topTokens'
import { RingTokenStat, TokenStat } from 'state/explore/types'
import { useDefaultRingActiveTokens } from 'state/lists/hooks'
import { Flex, Text, View, styled, useMedia } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { getChainIdFromChainUrlParam, useChainIdFromUrlParam } from 'utils/chainParams'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const TableWrapper = styled(Flex, {
  m: '0 auto',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
})

interface TokenTableValue {
  index: number
  tokenDescription: ReactElement
  price: number
  percentChange1hr: ReactElement
  percentChange1d: ReactElement
  fdv: number
  volume: number
  sparkline: ReactElement
  link: string
  /** Used for pre-loading TDP with logo to extract color from */
  linkState: { preloadedLogoSrc?: string }
}

interface TokenTableValue {
  index: number
  tokenDescription: ReactElement
  price: number
  percentChange1hr: ReactElement
  percentChange1d: ReactElement
  fdv: number
  volume: number
  sparkline: ReactElement
  link: string
  /** Used for pre-loading TDP with logo to extract color from */
  linkState: { preloadedLogoSrc?: string }
}

interface RingTokenTableValue {
  index: number
  tokenDescription: ReactElement
  price: number
  percentChange1hr: ReactElement
  percentChange1d: ReactElement
  tvl: number
  volume: number
  sparkline: ReactElement
  link: string
  /** Used for pre-loading TDP with logo to extract color from */
  linkState: { preloadedLogoSrc?: string }
}

function TokenDescription({ token }: { token: TokenStat }) {
  return (
    <Flex row gap="$gap8" alignItems="center" justifyContent="flex-start">
      <View pr="$spacing4">
        <QueryTokenLogo token={token} size={24} />
      </View>
      <EllipsisText data-testid="token-name">{token.name ?? token.project?.name}</EllipsisText>
      <TableText $platform-web={{ minWidth: 'fit-content' }} $lg={{ display: 'none' }} color="$neutral2">
        {token.symbol}
      </TableText>
    </Flex>
  )
}

function RingTokenDescription({ token }: { token: RingTokenStat }) {
  return (
    <Flex row gap="$gap8" alignItems="center" justifyContent="flex-start">
      <View pr="$spacing4">
        <QueryRingTokenLogo token={token} size={24} />
      </View>
      <EllipsisText data-testid="token-name">{token.name ?? token.project?.name}</EllipsisText>
      <TableText $platform-web={{ minWidth: 'fit-content' }} $lg={{ display: 'none' }} color="$neutral2">
        {token.symbol}
      </TableText>
    </Flex>
  )
}

export const TopTokensTable = memo(function TopTokensTable() {
  const {
    topTokens: ringTopTokens,
    tokenSortRank: ringTokenSortRank,
    sparklines: ringSparklines,
    ethPrice,
    isLoading: ringIsLoading,
    error: ringIsError,
  } = useRestTopTokens()

  const { page, loadMore } = useSimplePagination()

  return (
    <TableWrapper data-testid="top-tokens-explore-table">
      <RingTokenTable
        tokens={ringTopTokens?.slice(0, page * TABLE_PAGE_SIZE)}
        tokenSortRank={ringTokenSortRank}
        sparklines={ringSparklines}
        ethPrice={ethPrice}
        loading={ringIsLoading}
        loadMore={loadMore}
        error={ringIsError}
      />
    </TableWrapper>
  )
})

const HEADER_TEXT: Record<TokenSortMethod, ReactNode> = {
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: <Trans i18nKey="stats.fdv" />,
  [TokenSortMethod.PRICE]: <Trans i18nKey="common.price" />,
  [TokenSortMethod.VOLUME]: <Trans i18nKey="common.volume" />,
  [TokenSortMethod.HOUR_CHANGE]: <Trans i18nKey="common.oneHour.short" />,
  [TokenSortMethod.DAY_CHANGE]: <Trans i18nKey="common.oneDay.short" />,
}

export const HEADER_DESCRIPTIONS: Record<TokenSortMethod, ReactNode | undefined> = {
  [TokenSortMethod.PRICE]: undefined,
  [TokenSortMethod.DAY_CHANGE]: undefined,
  [TokenSortMethod.HOUR_CHANGE]: undefined,
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: <Trans i18nKey="stats.fdv.description" />,
  [TokenSortMethod.VOLUME]: <Trans i18nKey="stats.volume.description" />,
}

const HEADER_RING_TEXT: Record<RingTokenSortMethod, ReactNode> = {
  [RingTokenSortMethod.TOTAL_VALUE_LOCKED]: <Trans i18nKey="common.totalValueLocked" />,
  [RingTokenSortMethod.PRICE]: <Trans i18nKey="common.price" />,
  [RingTokenSortMethod.VOLUME]: <Trans i18nKey="common.volume" />,
  [RingTokenSortMethod.DAY_CHANGE]: <Trans i18nKey="common.oneDay.short" />,
  [RingTokenSortMethod.HOUR_CHANGE]: <Trans i18nKey="common.oneHour.short" />,
}

const HEADER_RING_DESCRIPTIONS: Record<RingTokenSortMethod, ReactNode | undefined> = {
  [RingTokenSortMethod.PRICE]: undefined,
  [RingTokenSortMethod.DAY_CHANGE]: undefined,
  [RingTokenSortMethod.HOUR_CHANGE]: undefined,
  [RingTokenSortMethod.TOTAL_VALUE_LOCKED]: <Trans i18nKey="stats.tvl.description" />,
  [RingTokenSortMethod.VOLUME]: <Trans i18nKey="stats.volume.description" />,
}

function TokenTableHeader({
  category,
  isCurrentSortMethod,
  direction,
}: {
  category: TokenSortMethod
  isCurrentSortMethod: boolean
  direction: OrderDirection
}) {
  const handleSortCategory = useSetSortMethod(category)

  return (
    <Flex width="100%">
      <MouseoverTooltip
        disabled={!HEADER_DESCRIPTIONS[category]}
        size={TooltipSize.Max}
        text={HEADER_DESCRIPTIONS[category]}
        placement="top"
      >
        <ClickableHeaderRow justifyContent="flex-end" onPress={handleSortCategory} group>
          <HeaderArrow orderDirection={direction} size={14} opacity={isCurrentSortMethod ? 1 : 0} />
          <HeaderSortText active={isCurrentSortMethod} variant="body3">
            {HEADER_TEXT[category]}
          </HeaderSortText>
        </ClickableHeaderRow>
      </MouseoverTooltip>
    </Flex>
  )
}

function RingTokenTableHeader({
  category,
  isCurrentSortMethod,
  direction,
}: {
  category: RingTokenSortMethod
  isCurrentSortMethod: boolean
  direction: OrderDirection
}) {
  const handleSortCategory = useSetSortRingMethod(category)

  return (
    <Flex width="100%">
      <MouseoverTooltip
        disabled={!HEADER_RING_DESCRIPTIONS[category]}
        size={TooltipSize.Max}
        text={HEADER_RING_DESCRIPTIONS[category]}
        placement="top"
      >
        <ClickableHeaderRow justifyContent="flex-end" onPress={handleSortCategory} group>
          <HeaderArrow orderDirection={direction} size={14} opacity={isCurrentSortMethod ? 1 : 0} />
          <HeaderSortText active={isCurrentSortMethod} variant="body3">
            {HEADER_RING_TEXT[category]}
          </HeaderSortText>
        </ClickableHeaderRow>
      </MouseoverTooltip>
    </Flex>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TokenTable({
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
  const { formatFiatPrice, formatNumber, formatDelta } = useFormatter()
  const { defaultChainId } = useEnabledChains()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const sortMethod = useAtomValue(sortMethodAtom)
  const filterString = useAtomValue(exploreSearchStringAtom)
  const timePeriod = useAtomValue(filterTimeAtom)

  const tokenTableValues: TokenTableValue[] | undefined = useMemo(
    () =>
      tokens?.map((token, i) => {
        const delta1hr = token.pricePercentChange1Hour?.value
        const delta1d = token.pricePercentChange1Day?.value
        const currCurrencyId = buildCurrencyId(fromGraphQLChain(token.chain) ?? UniverseChainId.Mainnet, token.address)
        const tokenSortIndex = tokenSortRank[currCurrencyId]
        const chainId = getChainIdFromChainUrlParam(token.chain.toLowerCase())
        const unwrappedToken = chainId ? unwrapToken(chainId, token) : token

        return {
          index: tokenSortIndex,
          tokenDescription: <TokenDescription token={unwrappedToken} />,
          price: giveExploreStatDefaultValue(token.price?.value),
          testId: `token-table-row-${unwrappedToken.address}`,
          percentChange1hr: (
            <Flex row gap="$gap4" alignItems="center">
              <DeltaArrow delta={delta1hr} formattedDelta={formatDelta(delta1hr)} />
              <TableText>{formatDelta(delta1hr)}</TableText>
            </Flex>
          ),
          percentChange1d: (
            <Flex row gap="$gap4" alignItems="center">
              <DeltaArrow delta={delta1d} formattedDelta={formatDelta(delta1d)} />
              <TableText>{formatDelta(delta1d)}</TableText>
            </Flex>
          ),
          fdv: giveExploreStatDefaultValue(token.fullyDilutedValuation?.value),
          volume: giveExploreStatDefaultValue(token.volume?.value),
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
            elementName: InterfaceElementName.TOKENS_TABLE_ROW,
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
    [defaultChainId, filterString, formatDelta, sparklines, timePeriod, tokenSortRank, tokens],
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
              <Trans i18nKey="common.tokenName" />
            </Text>
          </HeaderCell>
        ),
        cell: (tokenDescription) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} testId="name-cell">
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
          <Cell loading={showLoadingSkeleton} testId="price-cell" justifyContent="flex-end">
            <TableText>
              {/* A simple 0 price indicates the price is not currently available from the api */}
              {price.getValue?.() === 0
                ? '-'
                : formatFiatPrice({ price: price.getValue?.(), type: NumberType.FiatTokenPrice })}
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
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end" testId="fdv-cell">
            <EllipsisText>{formatNumber({ input: fdv.getValue?.(), type: NumberType.FiatTokenStats })}</EllipsisText>
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
          <Cell loading={showLoadingSkeleton} grow testId="volume-cell">
            <EllipsisText>{formatNumber({ input: volume.getValue?.(), type: NumberType.FiatTokenStats })}</EllipsisText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.sparkline, {
        id: 'sparkline',
        maxSize: 120,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2" fontWeight="500">
              1D chart
            </Text>
          </HeaderCell>
        ),
        cell: (sparkline) => <Cell loading={showLoadingSkeleton}>{sparkline.getValue?.()}</Cell>,
      }),
    ]

    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [formatFiatPrice, formatNumber, orderDirection, showLoadingSkeleton, sortMethod, media])

  return (
    <Table
      columns={columns}
      data={tokenTableValues}
      loading={loading}
      error={error}
      loadMore={loadMore}
      maxWidth={1200}
      defaultPinnedColumns={['index', 'tokenDescription']}
    />
  )
}

function RingTokenTable({
  tokens,
  tokenSortRank,
  sparklines,
  ethPrice,
  loading,
  error,
  loadMore,
}: {
  tokens?: readonly RingTokenStat[]
  tokenSortRank: Record<string, number>
  sparklines: SparklineMap
  ethPrice: number
  loading: boolean
  error?: ApolloError | boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
}) {
  const { formatFiatPrice, formatNumber, formatDelta } = useFormatter()
  const { defaultChainId } = useEnabledChains()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const sortMethod = useAtomValue(sortRingMethodAtom)
  const filterString = useAtomValue(exploreSearchStringAtom)
  const timePeriod = useAtomValue(filterRingTimeAtom)
  const chainId = useChainIdFromUrlParam()
  const ringTokens = useDefaultRingActiveTokens(chainId ?? defaultChainId)

  const tokenTableValues: RingTokenTableValue[] | undefined = useMemo(
    () =>
      tokens?.map((token, i) => {
        const delta1hr = token.pricePercentChange1Hour
        const delta1d = token.pricePercentChange1Day
        const currCurrencyId = buildCurrencyId(fromGraphQLChain(token.chain) ?? UniverseChainId.Mainnet, token.address)
        const tokenSortIndex = tokenSortRank[currCurrencyId]
        const chainId = getChainIdFromChainUrlParam(token.chain.toLowerCase())
        const tokenInfo = Object.values(ringTokens).find(
          (item) => item.address.toLowerCase() === token?.originToken?.address?.toLowerCase(),
        ) as any
        const unwrappedToken = chainId ? unwrapFewToken(chainId, token, tokenInfo?.logoURI) : token

        return {
          index: tokenSortIndex,
          tokenDescription: <RingTokenDescription token={unwrappedToken} />,
          price: giveExploreStatDefaultValue(Number(token.derivedETH) * ethPrice),
          testId: `token-table-row-${unwrappedToken.address}`,
          percentChange1hr: (
            <Flex row gap="$gap4" alignItems="center">
              <DeltaArrow delta={delta1hr} formattedDelta={formatDelta(delta1hr)} />
              <TableText>{formatDelta(delta1hr)}</TableText>
            </Flex>
          ),
          percentChange1d: (
            <Flex row gap="$gap4" alignItems="center">
              <DeltaArrow delta={delta1d} formattedDelta={formatDelta(delta1d)} />
              <TableText>{formatDelta(delta1d)}</TableText>
            </Flex>
          ),
          tvl: giveExploreStatDefaultValue(token.tvl),
          volume: giveExploreStatDefaultValue(token.volume),
          sparkline: (
            <SparklineChart
              width={80}
              height={20}
              tokenData={token}
              pricePercentChange={Number(token.pricePercentChange1Day)}
              sparklineMap={sparklines}
            />
          ),
          link: getTokenDetailsURL({
            address: unwrappedToken.address,
            chain: toGraphQLChain(chainId ?? defaultChainId),
          }),
          analytics: {
            elementName: InterfaceElementName.TOKENS_TABLE_ROW,
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
          linkState: { preloadedLogoSrc: token.logo, token: unwrappedToken.address, fewtoken: token.address },
        }
      }) ?? [],
    [defaultChainId, filterString, formatDelta, sparklines, timePeriod, tokenSortRank, tokens, ethPrice, ringTokens],
  )

  const showLoadingSkeleton = loading || !!error

  const media = useMedia()
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<RingTokenTableValue>()
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
              <Trans i18nKey="common.tokenName" />
            </Text>
          </HeaderCell>
        ),
        cell: (tokenDescription) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton} testId="name-cell">
            <TableText>{tokenDescription.getValue?.()}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.price, {
        id: 'price',
        maxSize: 140,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <RingTokenTableHeader
              category={RingTokenSortMethod.PRICE}
              isCurrentSortMethod={sortMethod === RingTokenSortMethod.PRICE}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (price) => (
          <Cell loading={showLoadingSkeleton} testId="price-cell" justifyContent="flex-end">
            <TableText>
              {/* A simple 0 price indicates the price is not currently available from the api */}
              {price.getValue?.() === 0
                ? '-'
                : formatFiatPrice({ price: price.getValue?.(), type: NumberType.FiatTokenPrice })}
            </TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.percentChange1hr, {
        id: 'percentChange1hr',
        maxSize: 100,
        header: () => (
          <HeaderCell>
            <RingTokenTableHeader
              category={RingTokenSortMethod.HOUR_CHANGE}
              isCurrentSortMethod={sortMethod === RingTokenSortMethod.HOUR_CHANGE}
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
            <RingTokenTableHeader
              category={RingTokenSortMethod.DAY_CHANGE}
              isCurrentSortMethod={sortMethod === RingTokenSortMethod.DAY_CHANGE}
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
      columnHelper.accessor((row) => row.tvl, {
        id: 'tvl',
        maxSize: 140,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <RingTokenTableHeader
              category={RingTokenSortMethod.TOTAL_VALUE_LOCKED}
              isCurrentSortMethod={sortMethod === RingTokenSortMethod.TOTAL_VALUE_LOCKED}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (tvl) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-end" testId="tvl-cell">
            <EllipsisText>{formatNumber({ input: tvl.getValue?.(), type: NumberType.FiatTokenStats })}</EllipsisText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.volume, {
        id: 'volume',
        maxSize: 130,
        header: () => (
          <HeaderCell>
            <RingTokenTableHeader
              category={RingTokenSortMethod.VOLUME}
              isCurrentSortMethod={sortMethod === RingTokenSortMethod.VOLUME}
              direction={orderDirection}
            />
          </HeaderCell>
        ),
        cell: (volume) => (
          <Cell loading={showLoadingSkeleton} grow testId="volume-cell">
            <EllipsisText>{formatNumber({ input: volume.getValue?.(), type: NumberType.FiatTokenStats })}</EllipsisText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.sparkline, {
        id: 'sparkline',
        maxSize: 120,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2" fontWeight="500">
              1D chart
            </Text>
          </HeaderCell>
        ),
        cell: (sparkline) => <Cell loading={showLoadingSkeleton}>{sparkline.getValue?.()}</Cell>,
      }),
    ]

    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [formatFiatPrice, formatNumber, orderDirection, showLoadingSkeleton, sortMethod, media])

  return (
    <Table
      columns={columns}
      data={tokenTableValues}
      loading={loading}
      error={error}
      loadMore={loadMore}
      maxWidth={1200}
      defaultPinnedColumns={['index', 'tokenDescription']}
    />
  )
}
