import useTopTokens, { TimePeriod } from 'hooks/useTopTokens'
import { useAtom } from 'jotai'
import styled from 'styled-components/macro'

import { MOBILE_MEDIA_BREAKPOINT } from './constants'
import { favoritesAtom, showFavoritesAtom } from './state'
import LoadedRow, { HeaderRow, LoadingRow } from './TokenRow'

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 960px;
  background: ${({ theme }) => theme.bg0};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-left: auto;
  margin-right: auto;
  border-radius: 8px;
  justify-content: center;
  align-items: center;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    padding: 12px 16px;
  }
`
const NoTokenDisplay = styled.div`
  display: flex;
  width: 100%;
  height: 60px;
  color: ${({ theme }) => theme.text3};
  font-size: 16px;
  align-items: center;
  padding: 0px 28px;
`
const TokenRowsContainer = styled.div`
  padding: 4px 12px;
`
const LOADING_ROWS = Array(10)
  .fill(0)
  .map((_item, index) => {
    return <LoadingRow key={`${index}`} />
  })

export default function TokenTable() {
  const { data, error, loading } = useTopTokens()
  const [favoriteTokens] = useAtom(favoritesAtom)
  const [showFavorites] = useAtom(showFavoritesAtom)
  const timePeriod = TimePeriod.day

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
