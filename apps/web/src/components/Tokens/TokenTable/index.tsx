import { Trans } from '@lingui/macro'
import { createColumnHelper } from '@tanstack/react-table'
import { ChainId } from '@uniswap/sdk-core'
import { ParentSize } from '@visx/responsive'
import SparklineChart from 'components/Charts/SparklineChart'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { SparklineMap, TopToken, useTopTokens } from 'graphql/data/TopTokens'
import {
  chainIdToBackendName,
  getTokenDetailsURL,
  supportedChainIdFromGQLChain,
  validateUrlChainParam,
} from 'graphql/data/util'
import { ReactElement, useMemo } from 'react'
import styled from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { ApolloError } from '@apollo/client'
import { useExploreParams } from 'pages/Explore/redirects'
import { DeltaArrow, DeltaText } from '../TokenDetails/Delta'

const TableWrapper = styled.div`
  margin: 0 auto;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
`

export const NameText = styled(ThemedText.BodyPrimary)`
  ${EllipsisStyle}
`

const SparklineContainer = styled.div`
  width: 124px;
  height: 40px;
`

interface TokenTableValues {
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
      <NameText>{token.name}</NameText>
      <ThemedText.BodySecondary>{token.symbol}</ThemedText.BodySecondary>
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

  const tokenTableValues: TokenTableValues[] | undefined = useMemo(
    () =>
      tokens?.map((token) => {
        const delta1hr = token.market?.pricePercentChange1Hour?.value
        const delta1d = token.market?.pricePercentChange1Day?.value
        return {
          index: tokenSortRank[token.address ?? 'NATIVE'],
          tokenDescription: <TokenDescription token={token} />,
          price: token.market?.price?.value ?? 0,
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
            isInfoExplorePageEnabled: true,
          }),
          linkState: { preloadedLogoSrc: token.project?.logoUrl },
        }
      }) ?? [],
    [chainId, formatDelta, sparklines, tokenSortRank, tokens]
  )

  const showLoadingSkeleton = loading || !!error
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TokenTableValues>()
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
          <Cell justifyContent="flex-start" width={240} loading={showLoadingSkeleton} grow>
            {tokenDescription.getValue?.()}
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.price, {
        id: 'price',
        header: () => (
          <Cell minWidth={133} grow>
            <ThemedText.BodySecondary>
              <Trans>Price</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (price) => (
          <Cell loading={showLoadingSkeleton} minWidth={133} grow>
            <ThemedText.BodySecondary>
              {/* A simple 0 price indicates the price is not currently available from the api */}
              {price.getValue?.() === 0
                ? '-'
                : formatFiatPrice({ price: price.getValue?.(), type: NumberType.FiatTokenPrice })}
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.percentChange1hr, {
        id: 'percentChange1hr',
        header: () => (
          <Cell minWidth={133} grow>
            <ThemedText.BodySecondary>
              <Trans>1 hour</Trans>
            </ThemedText.BodySecondary>
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
            <ThemedText.BodySecondary>
              <Trans>1 day</Trans>
            </ThemedText.BodySecondary>
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
          <Cell minWidth={133} grow>
            <ThemedText.BodySecondary>
              <Trans>FDV</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (fdv) => (
          <Cell loading={showLoadingSkeleton} minWidth={133} grow>
            <ThemedText.BodySecondary>
              {formatNumber({ input: fdv.getValue?.(), type: NumberType.FiatTokenStats })}
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.volume, {
        id: 'volume',
        header: () => (
          <Cell minWidth={133} grow>
            <ThemedText.BodySecondary>
              <Trans>Volume</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (volume) => (
          <Cell minWidth={133} loading={showLoadingSkeleton} grow>
            <ThemedText.BodySecondary>
              {formatNumber({ input: volume.getValue?.(), type: NumberType.FiatTokenStats })}
            </ThemedText.BodySecondary>
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
  }, [formatFiatPrice, formatNumber, showLoadingSkeleton])

  return <Table columns={columns} data={tokenTableValues} loading={loading} error={error} loadMore={loadMore} />
}
