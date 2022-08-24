import {
  favoritesAtom,
  filterStringAtom,
  filterTimeAtom,
  showFavoritesAtom,
  sortCategoryAtom,
  sortDirectionAtom,
} from 'components/Tokens/state'
import { TimePeriod, TokenData } from 'graphql/data/TopTokenQuery'
import { useAtomValue } from 'jotai/utils'
import { ReactNode, Suspense, useCallback, useMemo } from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import { Category, SortDirection } from '../types'
import LoadedRow, { HeaderRow, LoadingRow } from './TokenRow'

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  background-color: ${({ theme }) => theme.backgroundModule};
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

export default function TokenTable({ data }: { data: TokenData[] | undefined }) {
  const showFavorites = useAtomValue<boolean>(showFavoritesAtom)
  const timePeriod = useAtomValue<TimePeriod>(filterTimeAtom)
  const filteredTokens = useFilteredTokens(data)
  const sortedFilteredTokens = useSortedTokens(filteredTokens)

  /* loading and error state */
  if (data === null) {
    return (
      <NoTokensState
        message={
          <>
            <AlertTriangle size={16} />
            An error occured loading tokens. Please try again.
          </>
        }
      />
    )
  }

  if (showFavorites && sortedFilteredTokens?.length === 0) {
    return <NoTokensState message="You have no favorited tokens" />
  }

  if (!showFavorites && sortedFilteredTokens?.length === 0) {
    return <NoTokensState message="No tokens found" />
  }

  return (
    <Suspense fallback={<LoadingTokenTable />}>
      <GridContainer>
        <HeaderRow />
        <TokenRowsContainer>
          {sortedFilteredTokens?.map((token, index) => (
            <LoadedRow
              key={token.address}
              tokenAddress={token.address}
              tokenListIndex={index}
              tokenListLength={sortedFilteredTokens.length}
              tokenData={token}
              timePeriod={timePeriod}
            />
          ))}
        </TokenRowsContainer>
      </GridContainer>
    </Suspense>
  )
}
