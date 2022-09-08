import { Trans } from '@lingui/macro'
import {
  favoritesAtom,
  filterStringAtom,
  filterTimeAtom,
  showFavoritesAtom,
  sortCategoryAtom,
  sortDirectionAtom,
} from 'components/Tokens/state'
import type { TopTokenQuery as TopTokenQueryType } from 'graphql/data/__generated__/TopTokenQuery.graphql'
import environment from 'graphql/data/RelayEnvironment'
import { TimePeriod, TokenData } from 'graphql/data/TopTokenQuery'
import { TopTokenQuery as query } from 'graphql/data/TopTokenQuery'
import { useAtomValue } from 'jotai/utils'
import { CSSProperties, ReactNode, Suspense, useCallback, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { fetchQuery } from 'react-relay'
import { FixedSizeList, ListOnItemsRenderedProps } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import styled from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import { Category, SortDirection } from '../types'
import LoadedRow, { HeaderRow, LoadingRow } from './TokenRow'

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-left: auto;
  margin-right: auto;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`
const NoTokenDisplay = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 60px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 16px;
  font-weight: 500;
  align-items: center;
  padding: 0px 28px;
  gap: 8px;
`
const TokenRowsContainer = styled.div`
  width: 100%;
`

function useFilteredTokens(tokens: TokenData[] | undefined) {
  const filterString = useAtomValue(filterStringAtom)
  const favoriteTokenAddresses = useAtomValue(favoritesAtom)
  const showFavorites = useAtomValue(showFavoritesAtom)
  const shownTokens =
    showFavorites && tokens ? tokens.filter((token) => favoriteTokenAddresses.includes(token.address)) : tokens

  return useMemo(
    () =>
      (shownTokens ?? []).filter((token) => {
        if (!token.address) {
          return false
        }
        if (!filterString) {
          return true
        }
        const lowercaseFilterString = filterString.toLowerCase()
        const addressIncludesFilterString = token?.address?.toLowerCase().includes(lowercaseFilterString)
        const nameIncludesFilterString = token?.name?.toLowerCase().includes(lowercaseFilterString)
        const symbolIncludesFilterString = token?.symbol?.toLowerCase().includes(lowercaseFilterString)
        return nameIncludesFilterString || symbolIncludesFilterString || addressIncludesFilterString
      }),
    [shownTokens, filterString]
  )
}

function useSortedTokens(tokenData: TokenData[] | null) {
  const sortCategory = useAtomValue(sortCategoryAtom)
  const sortDirection = useAtomValue(sortDirectionAtom)
  const timePeriod = useAtomValue<TimePeriod>(filterTimeAtom)

  const sortFn = useCallback(
    (a: any, b: any) => {
      if (a > b) {
        return sortDirection === SortDirection.decreasing ? -1 : 1
      } else if (a < b) {
        return sortDirection === SortDirection.decreasing ? 1 : -1
      }
      return 0
    },
    [sortDirection]
  )

  return useMemo(
    () =>
      tokenData &&
      tokenData.sort((token1, token2) => {
        if (!tokenData) {
          return 0
        }
        // fix delta/percent change property
        if (!token1 || !token2 || !sortDirection || !sortCategory) {
          return 0
        }
        let a: number | null | undefined
        let b: number | null | undefined
        switch (sortCategory) {
          case Category.marketCap:
            a = token1.marketCap?.value
            b = token2.marketCap?.value
            break
          case Category.price:
            a = token1.price?.value
            b = token2.price?.value
            break
          case Category.volume:
            a = token1.volume?.[timePeriod]?.value
            b = token2.volume?.[timePeriod]?.value
            break
          case Category.percentChange:
            a = token1.percentChange?.[timePeriod]?.value
            b = token2.percentChange?.[timePeriod]?.value
            break
        }
        return sortFn(a, b)
      }),
    [tokenData, sortDirection, sortCategory, sortFn, timePeriod]
  )
}

function NoTokensState({ message }: { message: ReactNode }) {
  return (
    <GridContainer>
      <HeaderRow />
      <NoTokenDisplay>{message}</NoTokenDisplay>
    </GridContainer>
  )
}

const LOADING_ROWS = Array.from({ length: 100 })
  .fill(0)
  .map((_item, index) => <LoadingRow key={index} />)

export function LoadingTokenTable() {
  return (
    <GridContainer>
      <HeaderRow />
      <TokenRowsContainer>{LOADING_ROWS}</TokenRowsContainer>
    </GridContainer>
  )
}

interface TokenRowProps {
  data: TokenData[]
  index: number
  style: CSSProperties
}

enum TokenRowState {
  LOADING,
  LOADED,
}
const tokenRowStatusMap: Record<string, unknown> = {}

export default function TokenTable() {
  const showFavorites = useAtomValue<boolean>(showFavoritesAtom)
  const timePeriod = useAtomValue<TimePeriod>(filterTimeAtom)

  const [page, setPage] = useState<number>(1)
  const pageSize = 20
  const [topTokens, setTopTokens] = useState<TokenData[]>([])
  const [error, setError] = useState<any>(undefined)
  // const filteredTokens = useFilteredTokens(data)
  // const sortedFilteredTokens = useSortedTokens(filteredTokens)

  if (topTokens.length === 0) {
    setTopTokens(Array.from({ length: 500 }).map((_) => ({} as TokenData)))
  }

  const isItemLoaded = (index: number) => !!tokenRowStatusMap[index]
  const loadMoreItems = (startIndex: number, stopIndex: number) => {
    for (let index = startIndex; index <= stopIndex; index++) {
      tokenRowStatusMap[index] = TokenRowState.LOADING
    }
    if (stopIndex >= page * pageSize) setPage(page + 1)
    console.log('page', page)
    return fetchQuery<TopTokenQueryType>(environment, query, {
      pageSize,
      page,
    })
      .toPromise()
      .then((data) => {
        const newPageTopTokens: TokenData[] = !!data?.topTokenProjects
          ? data.topTokenProjects.map((token) =>
              token?.tokens?.[0].address
                ? {
                    name: token?.name,
                    address: token?.tokens?.[0].address,
                    chain: token?.tokens?.[0].chain,
                    symbol: token?.tokens?.[0].symbol,
                    price: token?.markets?.[0]?.price,
                    marketCap: token?.markets?.[0]?.marketCap,
                    volume: {
                      [TimePeriod.HOUR]: token?.markets?.[0]?.volume1H,
                      [TimePeriod.DAY]: token?.markets?.[0]?.volume1D,
                      [TimePeriod.WEEK]: token?.markets?.[0]?.volume1W,
                      [TimePeriod.MONTH]: token?.markets?.[0]?.volume1M,
                      [TimePeriod.YEAR]: token?.markets?.[0]?.volume1Y,
                      [TimePeriod.ALL]: token?.markets?.[0]?.volumeAll,
                    },
                    percentChange: {
                      [TimePeriod.HOUR]: token?.markets?.[0]?.pricePercentChange1H,
                      [TimePeriod.DAY]: token?.markets?.[0]?.pricePercentChange24h,
                      [TimePeriod.WEEK]: token?.markets?.[0]?.pricePercentChange1W,
                      [TimePeriod.MONTH]: token?.markets?.[0]?.pricePercentChange1M,
                      [TimePeriod.YEAR]: token?.markets?.[0]?.pricePercentChange1Y,
                      [TimePeriod.ALL]: token?.markets?.[0]?.pricePercentChangeAll,
                    },
                  }
                : ({} as TokenData)
            )
          : []
        setTopTokens([...topTokens, ...newPageTopTokens])
      })
      .catch((e) => setError(e))
      .finally(() => {
        for (let index = startIndex; index <= stopIndex; index++) {
          tokenRowStatusMap[index] = TokenRowState.LOADED
        }
      })
  }

  const Row = useCallback(
    function TokenRow({ data, index, style }: TokenRowProps) {
      const tokenData = data[index]
      if (tokenData && tokenRowStatusMap[index] === TokenRowState.LOADED) {
        return (
          <LoadedRow
            style={style}
            key={tokenData.address}
            tokenAddress={tokenData.address}
            tokenListIndex={index}
            tokenListLength={data?.length ?? 0}
            tokenData={tokenData}
            timePeriod={timePeriod}
          />
        )
      } else {
        return <LoadingRow />
      }
    },
    [timePeriod]
  )

  /* loading and error state */
  if (error || !topTokens) {
    return (
      <NoTokensState
        message={
          <>
            <AlertTriangle size={16} />
            <Trans>An error occured loading tokens. Please try again.</Trans>
          </>
        }
      />
    )
  }

  if (showFavorites && topTokens.length === 0) {
    return <NoTokensState message={<Trans>You have no favorited tokens</Trans>} />
  }

  if (!showFavorites && topTokens.length === 0) {
    return <NoTokensState message={<Trans>No tokens found</Trans>} />
  }

  return (
    <Suspense fallback={<LoadingTokenTable />}>
      <GridContainer>
        <HeaderRow />
        <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={topTokens.length} loadMoreItems={loadMoreItems}>
          {({ onItemsRendered, ref }: { onItemsRendered: (props: ListOnItemsRenderedProps) => any; ref: any }) => (
            <FixedSizeList
              className="List"
              height={500}
              width={500}
              itemCount={topTokens.length}
              itemSize={70}
              itemData={topTokens}
              onItemsRendered={onItemsRendered}
              ref={ref}
            >
              {Row}
            </FixedSizeList>
          )}
        </InfiniteLoader>
      </GridContainer>
    </Suspense>
  )
}
