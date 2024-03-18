import { Trans } from '@lingui/macro'
import { createColumnHelper } from '@tanstack/react-table'
import { ChainId } from '@uniswap/sdk-core'
import { ParentSize } from '@visx/responsive'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { SparklineMap, TopToken, useTopTokens } from 'graphql/data/TopTokens'
import {
  OrderDirection,
  chainIdToBackendName,
  getTokenDetailsURL,
  supportedChainIdFromGQLChain,
  validateUrlChainParam,
} from 'graphql/data/util'
import { ReactElement, ReactNode, useMemo } from 'react'
import styled from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { ApolloError } from '@apollo/client'
import SparklineChart from 'components/Charts/SparklineChart'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from 'components/Table/styled'
import { TokenSortMethod, sortAscendingAtom, sortMethodAtom, useSetSortMethod } from 'components/Tokens/state'
import { MouseoverTooltip } from 'components/Tooltip'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useAtomValue } from 'jotai/utils'
import { useExploreParams } from 'pages/Explore/redirects'
import { DeltaArrow, DeltaText } from '../TokenDetails/Delta'

const TableWrapper = styled.div`
  margin: 0 auto;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
`

export const NameText = styled(ThemedText.BodyPrimary)`
  ${EllipsisStyle}
`
const ValueText = styled(ThemedText.BodyPrimary)`
  ${EllipsisStyle}
`

const SparklineContainer = styled.div`
  width: 124px;
  height: 40px;
`

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

function TokenDescription({ token }: { token: TopToken }) {
  return (
    <Row gap="sm">
      <QueryTokenLogo token={token} size="28px" />
      <NameText data-testid="token-name">{token.name}</NameText>
      <ThemedText.BodySecondary style={{ minWidth: 'fit-content' }}>{token.symbol}</ThemedText.BodySecondary>
    </Row>
  )
}

export function TopTokensTable() {
  const chainName = validateUrlChainParam(useExploreParams().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const { tokens, tokenSortRank, loadingTokens, sparklines, error } = useTopTokens(chainName)

  return (
    <TableWrapper data-testid="top-tokens-explore-table">
      <TokenTable
        tokens={tokens}
        tokenSortRank={tokenSortRank}
        sparklines={sparklines}
        loading={loadingTokens}
        error={error}
        chainId={chainId}
      />
    </TableWrapper>
  )
}

const HEADER_TEXT: Record<TokenSortMethod, ReactNode> = {
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: <Trans>FDV</Trans>,
  [TokenSortMethod.PRICE]: <Trans>Price</Trans>,
  [TokenSortMethod.VOLUME]: <Trans>Volume</Trans>,
  [TokenSortMethod.HOUR_CHANGE]: <Trans>1 hour</Trans>,
  [TokenSortMethod.DAY_CHANGE]: <Trans>1 day</Trans>,
}

export const HEADER_DESCRIPTIONS: Record<TokenSortMethod, ReactNode | undefined> = {
  [TokenSortMethod.PRICE]: undefined,
  [TokenSortMethod.DAY_CHANGE]: undefined,
  [TokenSortMethod.HOUR_CHANGE]: undefined,
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: (
    <Trans>
      Fully diluted valuation (FDV) calculates the total market value assuming all tokens are in circulation.
    </Trans>
  ),
  [TokenSortMethod.VOLUME]: (
    <Trans>Volume is the amount of the asset that has been traded on Uniswap v3 during the selected time frame.</Trans>
  ),
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
      <ClickableHeaderRow $justify="flex-end" onClick={handleSortCategory}>
        {isCurrentSortMethod && <HeaderArrow direction={direction} />}
        <HeaderSortText $active={isCurrentSortMethod}>{HEADER_TEXT[category]}</HeaderSortText>
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
  chainId,
}: {
  tokens?: readonly TopToken[]
  tokenSortRank: Record<string, number>
  sparklines: SparklineMap
  loading: boolean
  error?: ApolloError
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  chainId: ChainId
}) {
  const { formatFiatPrice, formatNumber, formatDelta } = useFormatter()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const sortMethod = useAtomValue(sortMethodAtom)

  const tokenTableValues: TokenTableValue[] | undefined = useMemo(
    () =>
      tokens?.map((token) => {
        const delta1hr = token.market?.pricePercentChange1Hour?.value
        const delta1d = token.market?.pricePercentChange1Day?.value
        return {
          index: tokenSortRank[token.address ?? NATIVE_CHAIN_ID],
          tokenDescription: <TokenDescription token={token} />,
          price: token.market?.price?.value ?? 0,
          testId: `token-table-row-${token.address}`,
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
          fdv: token?.project?.markets?.[0]?.fullyDilutedValuation?.value ?? 0,
          volume: token.market?.volume?.value ?? 0,
          sparkline: (
            <SparklineContainer>
              <ParentSize>
                {({ width, height }) =>
                  sparklines && (
                    <SparklineChart
                      width={width}
                      height={height}
                      tokenData={token}
                      pricePercentChange={token.market?.pricePercentChange?.value}
                      sparklineMap={sparklines}
                    />
                  )
                }
              </ParentSize>
            </SparklineContainer>
          ),
          link: getTokenDetailsURL({
            address: token.address,
            chain: chainIdToBackendName(chainId),
          }),
          linkState: { preloadedLogoSrc: token.project?.logoUrl },
        }
      }) ?? [],
    [chainId, formatDelta, sparklines, tokenSortRank, tokens]
  )

  const showLoadingSkeleton = loading || !!error
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TokenTableValue>()
    return [
      columnHelper.accessor((row) => row.index, {
        id: 'index',
        header: () => (
          <Cell justifyContent="center" minWidth={44}>
            <ThemedText.BodySecondary>#</ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (index) => (
          <Cell justifyContent="center" loading={showLoadingSkeleton} minWidth={44}>
            <ThemedText.BodySecondary>{index.getValue?.()}</ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.tokenDescription, {
        id: 'tokenDescription',
        header: () => (
          <Cell justifyContent="flex-start" width={240} grow>
            <ThemedText.BodySecondary>
              <Trans>Token name</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (tokenDescription) => (
          <Cell justifyContent="flex-start" width={240} loading={showLoadingSkeleton} grow testId="name-cell">
            {tokenDescription.getValue?.()}
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
            <ThemedText.BodyPrimary>
              {/* A simple 0 price indicates the price is not currently available from the api */}
              {price.getValue?.() === 0
                ? '-'
                : formatFiatPrice({ price: price.getValue?.(), type: NumberType.FiatTokenPrice })}
            </ThemedText.BodyPrimary>
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
            <ValueText>{formatNumber({ input: fdv.getValue?.(), type: NumberType.FiatTokenStats })}</ValueText>
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
            <ValueText>{formatNumber({ input: volume.getValue?.(), type: NumberType.FiatTokenStats })}</ValueText>
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
