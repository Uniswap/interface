import useTopTokens from 'hooks/useTopTokens'
import { useAtomValue } from 'jotai/utils'
import styled from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from './constants'
import { favoritesAtom, filterTimeAtom, showFavoritesAtom } from './state'
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
  width: 100%;
  height: 60px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 16px;
  align-items: center;
  padding: 0px 28px;
`
const TokenRowsContainer = styled.div`
  padding: 4px 0px;
`
const LOADING_ROWS = Array(10)
  .fill(0)
  .map((_item, index) => {
    return <LoadingRow key={`${index}`} />
  })

export default function TokenTable() {
  const { data, error, loading } = useTopTokens()
  const favoriteTokens = useAtomValue(favoritesAtom)
  const showFavorites = useAtomValue(showFavoritesAtom)
  const timePeriod = useAtomValue(filterTimeAtom)

  /* loading and error state */
  if (loading) {
    return (
      <GridContainer>
        <HeaderRow timeframe={timePeriod} />
        <TokenRowsContainer>{LOADING_ROWS}</TokenRowsContainer>
      </GridContainer>
    )
  } else if (error || data === null) {
    return <GridContainer>Error Loading Top Token Data</GridContainer>
  }
  /* if no favorites tokens */
  if (showFavorites && favoriteTokens.length === 0) {
    return (
      <GridContainer>
        <HeaderRow timeframe={timePeriod} />
        <NoTokenDisplay>No Favorited Tokens</NoTokenDisplay>
      </GridContainer>
    )
  }

  const topTokenAddresses = Object.keys(data)
  const showTokens = showFavorites ? favoriteTokens : topTokenAddresses
  const tokenRows = showTokens.map((tokenAddress, index) => {
    return (
      <LoadedRow
        key={tokenAddress}
        tokenAddress={tokenAddress}
        data={data}
        listNumber={index + 1}
        timePeriod={timePeriod}
      />
    )
  })
  return (
    <GridContainer>
      <HeaderRow timeframe={timePeriod} />
      <TokenRowsContainer>{tokenRows}</TokenRowsContainer>
    </GridContainer>
  )
}
