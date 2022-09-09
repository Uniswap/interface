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
import { TimePeriod, TokenData, useTopTokenQuery } from 'graphql/data/TopTokenQuery'
import { TopTokenQuery as query } from 'graphql/data/TopTokenQuery'
import { useAtomValue } from 'jotai/utils'
import { CSSProperties, ReactNode, useCallback, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { fetchQuery } from 'react-relay'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList, ListOnItemsRenderedProps } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import styled from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import { Category, SortDirection } from '../types'
import LoadedRow, { HeaderRow, LoadingRow } from './TokenRow'

const MAX_TOKENS_TO_LOAD = 100
const PAGE_SIZE = 20
const MAX_PAGE = MAX_TOKENS_TO_LOAD / PAGE_SIZE

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 70vh;
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

const TokenDataContainer = styled.div`
  height: 100%;
  width: 100%;
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

const DEFAULT_FILTER_STRING = ''
const DEFAULT_SHOW_FAVORITES = false

const hasNonDefaultFilters = (filterString: string, showFavorites: boolean) =>
  filterString !== DEFAULT_FILTER_STRING || showFavorites !== DEFAULT_SHOW_FAVORITES

function useFilteredTokens(
  tokenData: TokenData[],
  filterString: string,
  showFavorites: boolean,
  nonDefaultFiltersExist: boolean
) {
  const favoriteTokenAddresses = useAtomValue(favoritesAtom)
  const shownTokens =
    showFavorites && tokenData ? tokenData.filter((token) => favoriteTokenAddresses.includes(token.address)) : tokenData

  return useMemo(
    () =>
      nonDefaultFiltersExist
        ? (shownTokens ?? []).filter((token) => {
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
          })
        : tokenData,
    [shownTokens, filterString, tokenData, nonDefaultFiltersExist]
  )
}

const DEFAULT_SORT_CATEGORY = Category.marketCap
const DEFAULT_SORT_DIRECTION = SortDirection.decreasing
const DEFAULT_TIME_PERIOD = 1

const hasNonDefaultSortingParams = (sortCategory: string, sortDirection: string, timePeriod: number) =>
  sortCategory !== DEFAULT_SORT_CATEGORY ||
  sortDirection !== DEFAULT_SORT_DIRECTION ||
  timePeriod !== DEFAULT_TIME_PERIOD

function useSortedTokens(
  tokenData: TokenData[],
  sortCategory: string,
  sortDirection: string,
  timePeriod: TimePeriod,
  nonDefaultSortingParamsExist: boolean
) {
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
      nonDefaultSortingParamsExist
        ? tokenData &&
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
          })
        : tokenData,
    [tokenData, sortDirection, sortCategory, sortFn, timePeriod, nonDefaultSortingParamsExist]
  )
}

function createFetchTokensPromise(
  page: number,
  pageSize: number,
  startIndex: number,
  setTopTokens: (topTokens: TokenData[]) => void,
  setError: (error: any) => void,
  topTokens: TokenData[]
) {
  fetchQuery<TopTokenQueryType>(environment, query, {
    pageSize,
    page,
  })
    .toPromise()
    .then((data) => {
      const newPageTopTokens: TokenData[] = !!data?.topTokenProjects
        ? data.topTokenProjects.map((token) =>
            token?.tokens?.[0].address
              ? {
                  loading: false,
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
      const currentTopTokens = [...topTokens]
      newPageTopTokens.forEach((token, i) => {
        if (currentTopTokens[startIndex + i].loading) currentTopTokens[startIndex + i] = token
      })
      setTopTokens(currentTopTokens)
    })
    .catch((e) => setError(e))
}

function NoTokensState({ message }: { message: ReactNode }) {
  return (
    <GridContainer>
      <HeaderRow />
      <NoTokenDisplay>{message}</NoTokenDisplay>
    </GridContainer>
  )
}

const LoadRow = function TokenRow({ data, index, style }: TokenRowProps) {
  return <LoadingRow style={style} key={index} />
}

export function LoadingTokenTable() {
  return (
    <GridContainer>
      <HeaderRow />
      <TokenDataContainer>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList className="List" height={height} width={width} itemCount={MAX_TOKENS_TO_LOAD} itemSize={70}>
              {LoadRow}
            </FixedSizeList>
          )}
        </AutoSizer>
      </TokenDataContainer>
    </GridContainer>
  )
}

interface TokenRowProps {
  data: TokenData[]
  index: number
  style: CSSProperties
}

export default function TokenTable() {
  const showFavorites = useAtomValue<boolean>(showFavoritesAtom)
  const timePeriod = useAtomValue<TimePeriod>(filterTimeAtom)
  const filterString = useAtomValue(filterStringAtom)
  const sortCategory = useAtomValue(sortCategoryAtom)
  const sortDirection = useAtomValue(sortDirectionAtom)

  const [page, setPage] = useState<number>(1)
  const [topTokens, setTopTokens] = useState<TokenData[]>(
    Array.from({ length: MAX_TOKENS_TO_LOAD }).map((_) => ({ loading: true } as TokenData))
  )
  const [error, setError] = useState<any>(undefined)

  const preloadedTopTokens = useTopTokenQuery(MAX_TOKENS_TO_LOAD, 1) ?? []
  const nonDefaultFiltersExist = hasNonDefaultFilters(filterString, showFavorites)
  const nonDefaultSortingParamsExist = hasNonDefaultSortingParams(sortCategory, sortDirection, timePeriod)
  const usePreloadedTokens = nonDefaultFiltersExist || nonDefaultSortingParamsExist
  const filteredTokens = useFilteredTokens(preloadedTopTokens, filterString, showFavorites, nonDefaultFiltersExist)
  const sortedFilteredTokens = useSortedTokens(
    filteredTokens,
    sortCategory,
    sortDirection,
    timePeriod,
    nonDefaultSortingParamsExist
  )

  const isItemLoaded = (index: number) => index < topTokens.length && topTokens[index].loading === false

  const loadMoreItems = (startIndex: number, stopIndex: number) => {
    if (stopIndex >= page * PAGE_SIZE && page < MAX_PAGE) setPage(page + 1)
    return createFetchTokensPromise(page, PAGE_SIZE, startIndex, setTopTokens, setError, topTokens)
  }

  const Row = function TokenRow({ data, index, style }: TokenRowProps) {
    const tokenData = data[index]
    if (!tokenData || (usePreloadedTokens ? sortedFilteredTokens[index].loading : topTokens[index].loading)) {
      return <LoadingRow style={style} key={index} />
    }
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
  }

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

  if (showFavorites && topTokens?.length === 0) {
    return <NoTokensState message={<Trans>You have no favorited tokens</Trans>} />
  }

  if (!showFavorites && topTokens?.length === 0) {
    return <NoTokensState message={<Trans>No tokens found</Trans>} />
  }

  return (
    <GridContainer>
      <HeaderRow />
      <TokenDataContainer>
        <AutoSizer>
          {({ height, width }) =>
            usePreloadedTokens ? (
              <FixedSizeList
                className="List"
                height={height}
                width={width}
                itemCount={MAX_TOKENS_TO_LOAD}
                itemData={sortedFilteredTokens}
                itemSize={70}
              >
                {Row}
              </FixedSizeList>
            ) : (
              <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={MAX_TOKENS_TO_LOAD} loadMoreItems={loadMoreItems}>
                {({
                  onItemsRendered,
                  ref,
                }: {
                  onItemsRendered: (props: ListOnItemsRenderedProps) => any
                  ref: any
                }) => (
                  <FixedSizeList
                    className="List"
                    height={height}
                    width={width}
                    itemCount={MAX_TOKENS_TO_LOAD}
                    itemData={topTokens}
                    itemSize={70}
                    onItemsRendered={onItemsRendered}
                    ref={ref}
                  >
                    {Row}
                  </FixedSizeList>
                )}
              </InfiniteLoader>
            )
          }
        </AutoSizer>
      </TokenDataContainer>
    </GridContainer>
  )
}
