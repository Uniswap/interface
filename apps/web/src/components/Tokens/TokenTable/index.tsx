import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { ParentSize } from '@visx/responsive'
import SparklineChart from 'components/Charts/SparklineChart'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from 'components/Table/styled'
import { DeltaArrow, DeltaText } from 'components/Tokens/TokenDetails/Delta'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import {
  TokenSortMethod,
  exploreSearchStringAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  useSetSortMethod,
} from 'components/Tokens/state'
import { MouseoverTooltip } from 'components/Tooltip'
import { chainIdToBackendChain, getChainFromChainUrlParam, useChainFromUrlParam } from 'constants/chains'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { SparklineMap, TopToken, useTopTokens } from 'graphql/data/TopTokens'
import { OrderDirection, getSupportedGraphQlChain, getTokenDetailsURL, unwrapToken } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { ReactElement, ReactNode, useMemo } from 'react'
import { giveExploreStatDefaultValue } from 'state/explore'
import { useTopTokens as useRestTopTokens } from 'state/explore/topTokens'
import { TokenStat } from 'state/explore/types'
import { Flex, Text, styled } from 'ui/src'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Trans } from 'uniswap/src/i18n'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const TableWrapper = styled(Flex, {
  m: '0 auto',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
})

export const EllipsisText = styled(Text, {
  variant: 'body2',
  color: '$neutral1',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const SparklineContainer = styled(Flex, {
  width: '124px',
  height: '$spacing40',
})

const TokenTableText = styled(Text, {
  variant: 'body2',
  color: '$neutral2',
  maxWidth: '100%',
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

function TokenDescription({ token }: { token: TopToken | TokenStat }) {
  return (
    <Flex row gap="$gap8">
      <QueryTokenLogo token={token} size={28} />
      <EllipsisText data-testid="token-name">{token?.project?.name ?? token?.name}</EllipsisText>
      <TokenTableText
        $platform-web={{
          minWidth: 'fit-content',
        }}
      >
        {token?.symbol}
      </TokenTableText>
    </Flex>
  )
}

export function TopTokensTable() {
  const chain = getSupportedGraphQlChain(useChainFromUrlParam(), { fallbackToEthereum: true })
  const isRestExploreEnabled = useFeatureFlag(FeatureFlags.RestExplore)
  const {
    tokens: gqlTokens,
    tokenSortRank: gqlTokenSortRank,
    loadingTokens: gqlLoadingTokens,
    sparklines: gqlSparklines,
    error: gqlError,
  } = useTopTokens(chain.backendChain.chain, isRestExploreEnabled /* skip */)
  const {
    topTokens: restTopTokens,
    tokenSortRank: restTokenSortRank,
    isLoading: restIsLoading,
    sparklines: restSparklines,
    isError: restError,
  } = useRestTopTokens()

  const { tokens, tokenSortRank, sparklines, loading, error } = useMemo(() => {
    return isRestExploreEnabled
      ? {
          tokens: restTopTokens,
          tokenSortRank: restTokenSortRank,
          loading: restIsLoading,
          sparklines: restSparklines,
          error: restError,
        }
      : {
          tokens: gqlTokens,
          tokenSortRank: gqlTokenSortRank,
          loading: gqlLoadingTokens,
          sparklines: gqlSparklines,
          error: gqlError,
        }
  }, [
    isRestExploreEnabled,
    restTopTokens,
    restTokenSortRank,
    restIsLoading,
    restSparklines,
    restError,
    gqlTokens,
    gqlTokenSortRank,
    gqlLoadingTokens,
    gqlSparklines,
    gqlError,
  ])

  return (
    <TableWrapper data-testid="top-tokens-explore-table">
      <TokenTable
        tokens={tokens}
        tokenSortRank={tokenSortRank}
        sparklines={sparklines}
        loading={loading}
        error={error}
      />
    </TableWrapper>
  )
}

const HEADER_TEXT: Record<TokenSortMethod, ReactNode> = {
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: <Trans i18nKey="stats.fdv" />,
  [TokenSortMethod.PRICE]: <Trans i18nKey="common.price" />,
  [TokenSortMethod.VOLUME]: <Trans i18nKey="common.volume" />,
  [TokenSortMethod.HOUR_CHANGE]: <Trans i18nKey="common.oneHour" />,
  [TokenSortMethod.DAY_CHANGE]: <Trans i18nKey="common.oneDay" />,
}

export const HEADER_DESCRIPTIONS: Record<TokenSortMethod, ReactNode | undefined> = {
  [TokenSortMethod.PRICE]: undefined,
  [TokenSortMethod.DAY_CHANGE]: undefined,
  [TokenSortMethod.HOUR_CHANGE]: undefined,
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: <Trans i18nKey="stats.fdv.description" />,
  [TokenSortMethod.VOLUME]: <Trans i18nKey="stats.volume.description" />,
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
    <MouseoverTooltip disabled={!HEADER_DESCRIPTIONS[category]} text={HEADER_DESCRIPTIONS[category]} placement="top">
      <ClickableHeaderRow justifyContent="flex-end" onPress={handleSortCategory}>
        {isCurrentSortMethod && <HeaderArrow direction={direction} />}
        <HeaderSortText active={isCurrentSortMethod}>{HEADER_TEXT[category]}</HeaderSortText>
      </ClickableHeaderRow>
    </MouseoverTooltip>
  )
}

function TokenTable({
  tokens,
  tokenSortRank,
  sparklines,
  loading,
  error,
  loadMore,
}: {
  tokens?: readonly TopToken[] | TokenStat[]
  tokenSortRank: Record<string, number>
  sparklines: SparklineMap
  loading: boolean
  error?: ApolloError | boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
}) {
  const { formatFiatPrice, formatNumber, formatDelta } = useFormatter()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const sortMethod = useAtomValue(sortMethodAtom)
  const filterString = useAtomValue(exploreSearchStringAtom)
  const timePeriod = useAtomValue(filterTimeAtom)

  const tokenTableValues: TokenTableValue[] | undefined = useMemo(
    () =>
      tokens?.map((token, i) => {
        const isGqlToken = !!token && 'id' in token
        const delta1hr = isGqlToken
          ? token?.market?.pricePercentChange1Hour?.value
          : token?.pricePercentChange1Hour?.value
        const delta1d = isGqlToken ? token?.market?.pricePercentChange1Day?.value : token?.pricePercentChange1Day?.value
        const tokenSortIndex = tokenSortRank[token?.address ?? NATIVE_CHAIN_ID]
        const chainId = getChainFromChainUrlParam(token?.chain.toLowerCase())?.id
        const unwrappedToken = chainId ? unwrapToken(chainId, token) : token

        return {
          index: tokenSortIndex,
          tokenDescription: <TokenDescription token={unwrappedToken} />,
          price: isGqlToken ? token?.market?.price?.value ?? 0 : giveExploreStatDefaultValue(token?.price?.value),
          testId: `token-table-row-${token?.address}`,
          percentChange1hr: (
            <>
              <DeltaArrow delta={delta1hr} />
              <DeltaText delta={delta1hr}>{formatDelta(delta1hr)}</DeltaText>
            </>
          ),
          percentChange1d: (
            <>
              <DeltaArrow delta={delta1d} />
              <DeltaText delta={delta1d}>{formatDelta(delta1d)}</DeltaText>
            </>
          ),
          fdv: isGqlToken
            ? token?.project?.markets?.[0]?.fullyDilutedValuation?.value ?? 0
            : giveExploreStatDefaultValue(token?.fullyDilutedValuation?.value),
          volume: isGqlToken ? token?.market?.volume?.value ?? 0 : giveExploreStatDefaultValue(token?.volume?.value),
          sparkline: (
            <SparklineContainer>
              <ParentSize>
                {({ width, height }) =>
                  sparklines && (
                    <SparklineChart
                      width={width}
                      height={height}
                      tokenData={token}
                      pricePercentChange={
                        isGqlToken ? token?.market?.pricePercentChange?.value : token?.pricePercentChange1Day?.value
                      }
                      sparklineMap={sparklines}
                    />
                  )
                }
              </ParentSize>
            </SparklineContainer>
          ),
          link: getTokenDetailsURL({
            address: unwrappedToken?.address,
            chain: chainIdToBackendChain({ chainId, withFallback: true }),
          }),
          analytics: {
            elementName: InterfaceElementName.TOKENS_TABLE_ROW,
            properties: {
              chain_id: chainId,
              token_address: token?.address,
              token_symbol: token?.symbol,
              token_list_index: i,
              token_list_rank: tokenSortIndex,
              token_list_length: tokens.length,
              time_frame: timePeriod,
              search_token_address_input: filterString,
            },
          },
          linkState: { preloadedLogoSrc: isGqlToken ? token?.project?.logoUrl : token?.logo },
        }
      }) ?? [],
    [filterString, formatDelta, sparklines, timePeriod, tokenSortRank, tokens],
  )

  const showLoadingSkeleton = loading || !!error
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TokenTableValue>()
    return [
      columnHelper.accessor((row) => row.index, {
        id: 'index',
        header: () => (
          <Cell justifyContent="center" minWidth={44}>
            <TokenTableText>#</TokenTableText>
          </Cell>
        ),
        cell: (index) => (
          <Cell justifyContent="center" loading={showLoadingSkeleton} minWidth={44}>
            <TokenTableText>{index.getValue?.()}</TokenTableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.tokenDescription, {
        id: 'tokenDescription',
        header: () => (
          <Cell justifyContent="flex-start" width={240} grow>
            <TokenTableText>
              <Trans i18nKey="common.tokenName" />
            </TokenTableText>
          </Cell>
        ),
        cell: (tokenDescription) => (
          <Cell justifyContent="flex-start" width={240} loading={showLoadingSkeleton} grow testId="name-cell">
            <TokenTableText>{tokenDescription.getValue?.()}</TokenTableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.price, {
        id: 'price',
        header: () => (
          <Cell minWidth={133} grow>
            <TokenTableHeader
              category={TokenSortMethod.PRICE}
              isCurrentSortMethod={sortMethod === TokenSortMethod.PRICE}
              direction={orderDirection}
            />
          </Cell>
        ),
        cell: (price) => (
          <Cell loading={showLoadingSkeleton} minWidth={133} grow testId="price-cell">
            <Text variant="body2" color="$neutral1">
              {/* A simple 0 price indicates the price is not currently available from the api */}
              {price.getValue?.() === 0
                ? '-'
                : formatFiatPrice({ price: price.getValue?.(), type: NumberType.FiatTokenPrice })}
            </Text>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.percentChange1hr, {
        id: 'percentChange1hr',
        header: () => (
          <Cell minWidth={133} grow>
            <TokenTableHeader
              category={TokenSortMethod.HOUR_CHANGE}
              isCurrentSortMethod={sortMethod === TokenSortMethod.HOUR_CHANGE}
              direction={orderDirection}
            />
          </Cell>
        ),
        cell: (percentChange1hr) => (
          <Cell loading={showLoadingSkeleton} minWidth={133} grow>
            {percentChange1hr.getValue?.()}
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.percentChange1d, {
        id: 'percentChange1d',
        header: () => (
          <Cell minWidth={133} grow>
            <TokenTableHeader
              category={TokenSortMethod.DAY_CHANGE}
              isCurrentSortMethod={sortMethod === TokenSortMethod.DAY_CHANGE}
              direction={orderDirection}
            />
          </Cell>
        ),
        cell: (percentChange1d) => (
          <Cell loading={showLoadingSkeleton} minWidth={133} grow>
            {percentChange1d.getValue?.()}
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.fdv, {
        id: 'fdv',
        header: () => (
          <Cell width={133} grow>
            <TokenTableHeader
              category={TokenSortMethod.FULLY_DILUTED_VALUATION}
              isCurrentSortMethod={sortMethod === TokenSortMethod.FULLY_DILUTED_VALUATION}
              direction={orderDirection}
            />
          </Cell>
        ),
        cell: (fdv) => (
          <Cell loading={showLoadingSkeleton} width={133} grow testId="fdv-cell">
            <EllipsisText>{formatNumber({ input: fdv.getValue?.(), type: NumberType.FiatTokenStats })}</EllipsisText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.volume, {
        id: 'volume',
        header: () => (
          <Cell width={133} grow>
            <TokenTableHeader
              category={TokenSortMethod.VOLUME}
              isCurrentSortMethod={sortMethod === TokenSortMethod.VOLUME}
              direction={orderDirection}
            />
          </Cell>
        ),
        cell: (volume) => (
          <Cell width={133} loading={showLoadingSkeleton} grow testId="volume-cell">
            <EllipsisText>{formatNumber({ input: volume.getValue?.(), type: NumberType.FiatTokenStats })}</EllipsisText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.sparkline, {
        id: 'sparkline',
        header: () => <Cell minWidth={172} />,
        cell: (sparkline) => (
          <Cell minWidth={172} loading={showLoadingSkeleton}>
            {sparkline.getValue?.()}
          </Cell>
        ),
      }),
    ]
  }, [formatFiatPrice, formatNumber, orderDirection, showLoadingSkeleton, sortMethod])

  return (
    <Table
      columns={columns}
      data={tokenTableValues}
      loading={loading}
      error={error}
      loadMore={loadMore}
      maxWidth={1200}
    />
  )
}
