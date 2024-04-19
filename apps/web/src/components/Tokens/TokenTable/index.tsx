import React, { useCallback } from 'react'
import { Trans } from '@lingui/macro'
import { createColumnHelper } from '@tanstack/react-table'
import { ChainId } from '@jaguarswap/sdk-core'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { TokenData, useV3Tokens, TokenSortMethod } from 'graphql/data/useV3Tokens'
import { OrderDirection, chainIdToBackendName, getTokenDetailsURL, supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { ReactElement, ReactNode, useMemo } from 'react'
import styled from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { ApolloError } from '@apollo/client'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from 'components/Table/styled'
import { exploreSearchStringAtom, filterTimeAtom } from 'components/Tokens/state'
import { MouseoverTooltip } from 'components/Tooltip'
import { atomWithReset, useAtomValue, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { useAtom } from 'jotai'

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

interface TokenTableValue {
  index: number
  tokenDescription: ReactElement
  price: number
  priceChange: ReactElement
  tvl: number
  volume: number
  link: string
  /** Used for pre-loading TDP with logo to extract color from */
  linkState: { preloadedLogoSrc?: string }
}
const sortMethodAtom = atomWithReset<TokenSortMethod>(TokenSortMethod.TVL)
const sortAscendingAtom = atomWithReset<boolean>(false)

function useSetSortMethod(newSortMethod: TokenSortMethod) {
  const [sortMethod, setSortMethod] = useAtom(sortMethodAtom)
  const setSortAscending = useUpdateAtom(sortAscendingAtom)

  return useCallback(() => {
    if (sortMethod === newSortMethod) {
      setSortAscending((sortAscending) => !sortAscending)
    } else {
      setSortMethod(newSortMethod)
      setSortAscending(false)
    }
  }, [sortMethod, setSortMethod, setSortAscending, newSortMethod])
}

function TokenDescription({ token }: { token: TokenData }) {
  return (
    <Row gap="sm">
      <QueryTokenLogo token={token} size="28px" />
      <NameText data-testid="token-name">{token?.name}</NameText>
      <ThemedText.BodySecondary style={{ minWidth: 'fit-content' }}>{token?.symbol}</ThemedText.BodySecondary>
    </Row>
  )
}

export function TopTokensTable() {
  const chainName = validateUrlChainParam(useExploreParams().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)

  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  const { data: tokens, loading: loadingTokens, error } = useV3Tokens({ sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc })

  return (
    <TableWrapper data-testid="top-tokens-explore-table">
      <TokenTable tokens={tokens} loading={loadingTokens} error={error} chainId={chainId} />
    </TableWrapper>
  )
}

const HEADER_TEXT: Record<TokenSortMethod, ReactNode> = {
  [TokenSortMethod.PRICE]: <Trans>Price</Trans>,
  [TokenSortMethod.VOLUME]: <Trans>Volume</Trans>,
  [TokenSortMethod.PRICE_CHANGE]: <Trans>Price Change</Trans>,
  [TokenSortMethod.TVL]: <Trans>TVL</Trans>,
}

export const HEADER_DESCRIPTIONS: Record<TokenSortMethod, ReactNode | undefined> = {
  [TokenSortMethod.PRICE]: undefined,
  [TokenSortMethod.VOLUME]: <Trans>Volume is the amount of the asset that has been traded on Uniswap v3 during the selected time frame.</Trans>,
  [TokenSortMethod.PRICE_CHANGE]: undefined,
  [TokenSortMethod.TVL]: undefined,
}

function TokenTableHeader({ category, isCurrentSortMethod, direction }: { category: TokenSortMethod; isCurrentSortMethod: boolean; direction: OrderDirection }) {
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
  loading,
  error,
  loadMore,
  chainId,
}: {
  tokens?: readonly TokenData[]
  loading: boolean
  error?: ApolloError
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  chainId: ChainId
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
        const tokenSortIndex = i + 1
        return {
          index: tokenSortIndex,
          tokenDescription: <TokenDescription token={token} />,
          price: token.priceUSD,
          testId: `token-table-row-${token?.address}`,
          priceChange: (
            <>
              {token.priceUSDChange}
              {/* <DeltaArrow delta={priceUSDChange} />
              <DeltaText delta={deltpriceUSDChangea1hr}>{formatDelta(priceUSDChange)}</DeltaText> */}
            </>
          ),
          volume: token.volumeUSD,
          tvl: token.tvlUSD,
          link: getTokenDetailsURL({
            address: token.address,
            chain: chainIdToBackendName(chainId),
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
          linkState: { preloadedLogoSrc: token?.project?.logoUrl },
        }
      }) ?? [],
    [chainId, filterString, formatDelta, timePeriod, tokens]
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
              <Trans>Name</Trans>
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
            <TokenTableHeader category={TokenSortMethod.PRICE} isCurrentSortMethod={sortMethod === TokenSortMethod.PRICE} direction={orderDirection} />
          </Cell>
        ),
        cell: (price) => (
          <Cell loading={showLoadingSkeleton} minWidth={133} grow testId="price-cell">
            <ThemedText.BodyPrimary>
              {/* A simple 0 price indicates the price is not currently available from the api */}
              {price.getValue?.() === 0 ? '-' : formatFiatPrice({ price: price.getValue?.(), type: NumberType.FiatTokenPrice })}
            </ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.priceChange, {
        id: 'priceChange',
        header: () => (
          <Cell minWidth={133} grow>
            <TokenTableHeader category={TokenSortMethod.PRICE_CHANGE} isCurrentSortMethod={sortMethod === TokenSortMethod.PRICE_CHANGE} direction={orderDirection} />
          </Cell>
        ),
        cell: (priceChange) => (
          <Cell loading={showLoadingSkeleton} minWidth={133} grow>
            {priceChange.getValue?.()}
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.volume, {
        id: 'volume',
        header: () => (
          <Cell width={133} grow>
            <TokenTableHeader category={TokenSortMethod.VOLUME} isCurrentSortMethod={sortMethod === TokenSortMethod.VOLUME} direction={orderDirection} />
          </Cell>
        ),
        cell: (volume) => (
          <Cell width={133} loading={showLoadingSkeleton} grow testId="volume-cell">
            <ValueText>{formatNumber({ input: volume.getValue?.(), type: NumberType.FiatTokenStats })}</ValueText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.tvl, {
        id: 'tvl',
        header: () => (
          <Cell width={133} grow>
            <TokenTableHeader category={TokenSortMethod.TVL} isCurrentSortMethod={sortMethod === TokenSortMethod.TVL} direction={orderDirection} />
          </Cell>
        ),
        cell: (tvl) => (
          <Cell width={133} loading={showLoadingSkeleton} grow testId="tvl-cell">
            <ValueText>{formatNumber({ input: tvl.getValue?.(), type: NumberType.FiatTokenStats })}</ValueText>
          </Cell>
        ),
      }),
    ]
  }, [formatFiatPrice, formatNumber, orderDirection, showLoadingSkeleton, sortMethod])

  return <Table columns={columns} data={tokenTableValues} loading={loading} error={error} loadMore={loadMore} maxWidth={1200} />
}
