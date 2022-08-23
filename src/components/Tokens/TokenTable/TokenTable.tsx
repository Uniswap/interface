import {
  favoritesAtom,
  filterStringAtom,
  filterTimeAtom,
  showFavoritesAtom,
  sortCategoryAtom,
  sortDirectionAtom,
} from 'components/Tokens/state'
import { useAllTokens } from 'hooks/Tokens'
import { TimePeriod, TokenData, UseTopTokensResult } from 'hooks/useExplorePageQuery'
import { useAtomValue } from 'jotai/utils'
import { ReactNode, useCallback, useMemo } from 'react'
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

function useFilteredTokens(addresses: string[]) {
  const filterString = useAtomValue(filterStringAtom)
  const favoriteTokens = useAtomValue(favoritesAtom)
  const showFavorites = useAtomValue(showFavoritesAtom)
  const shownTokens = showFavorites ? favoriteTokens : addresses
  const allTokens = useAllTokens()

  return useMemo(
    () =>
      shownTokens.filter((tokenAddress) => {
        const token = allTokens[tokenAddress]
        const tokenName = token?.name ?? ''
        const tokenSymbol = token?.symbol ?? ''

        if (!filterString) {
          return true
        }
        const lowercaseFilterString = filterString.toLowerCase()
        const addressIncludesFilterString = tokenAddress.toLowerCase().includes(lowercaseFilterString)
        const nameIncludesFilterString = tokenName.toLowerCase().includes(lowercaseFilterString)
        const symbolIncludesFilterString = tokenSymbol.toLowerCase().includes(lowercaseFilterString)
        return nameIncludesFilterString || symbolIncludesFilterString || addressIncludesFilterString
      }),
    [allTokens, shownTokens, filterString]
  )
}

function useSortedTokens(addresses: string[], tokenData: Record<string, TokenData> | null) {
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
      addresses.sort((token1Address, token2Address) => {
        if (!tokenData) {
          return 0
        }
        // fix any, delta property
        const token1 = tokenData[token1Address] as any
        const token2 = tokenData[token2Address] as any

        if (!token1 || !token2 || !sortDirection || !sortCategory) {
          return 0
        }
        let a: number
        let b: number
        switch (sortCategory) {
          case Category.marketCap:
            a = token1.marketCap
            b = token2.marketCap
            break
          case Category.percentChange:
            a = token1.delta
            b = token2.delta
            break
          case Category.price:
            a = token1.price
            b = token2.price
            break
          case Category.volume:
            a = token1.volume[timePeriod]
            b = token2.volume[timePeriod]
            break
        }
        return sortFn(a, b)
      }),
    [addresses, tokenData, sortDirection, sortCategory, sortFn, timePeriod]
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

function LoadingTokenTable() {
  return (
    <GridContainer>
      <HeaderRow />
      <TokenRowsContainer>{LOADING_ROWS}</TokenRowsContainer>
    </GridContainer>
  )
}

export default function TokenTable({ data, error, loading }: UseTopTokensResult) {
  const showFavorites = useAtomValue<boolean>(showFavoritesAtom)
  const timePeriod = useAtomValue<TimePeriod>(filterTimeAtom)
  const topTokenAddresses = data ? Object.keys(data) : []
  const filteredTokens = useFilteredTokens(topTokenAddresses)
  const filteredAndSortedTokens = useSortedTokens(filteredTokens, data)

  /* loading and error state */
  if (loading) {
    return <LoadingTokenTable />
  } else if (error || data === null) {
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

  if (showFavorites && filteredAndSortedTokens.length === 0) {
    return <NoTokensState message="You have no favorited tokens" />
  }

  if (!showFavorites && filteredAndSortedTokens.length === 0) {
    return <NoTokensState message="No tokens found" />
  }

  return (
    <GridContainer>
      <HeaderRow />
      <TokenRowsContainer>
        {filteredAndSortedTokens.map((tokenAddress, index) => (
          <LoadedRow
            key={tokenAddress}
            tokenAddress={tokenAddress}
            tokenListIndex={index}
            tokenListLength={filteredAndSortedTokens.length}
            tokenData={data[tokenAddress]}
            timePeriod={timePeriod}
          />
        ))}
      </TokenRowsContainer>
    </GridContainer>
  )
}
