import { TimePeriod } from 'hooks/useTopTokens'
import useTopTokens from 'hooks/useTopTokens'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import React from 'react'
import styled from 'styled-components/macro'

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
  padding: 4px 0px 8px 0px;

  @media only screen and (max-width: 410px) {
    padding: 12px 16px;
  }
`
const NoTokenDisplay = styled.div`
  display: flex;
  width: 100%;
  height: 60px;
  color: ${({ theme }) => theme.text2};
  font-size: 16px;
  align-items: center;
  padding: 0px 28px;
`
const LOADING_ROWS = Array(10)
  .fill(0)
  .map((item, index) => {
    return <LoadingRow key={`${index}`} />
  })

const favoritesAtom = atomWithStorage('favorites', [])

export default function TokenTable({ showFavorites }: { showFavorites: boolean }) {
  const { data, error, loading } = useTopTokens()
  const [favoriteTokens, updateFavoriteTokens] = useAtom(favoritesAtom)
  const timePeriod = TimePeriod.day

  /* loading and error state */
  if (loading) {
    return (
      <GridContainer>
        <HeaderRow timeframe={timePeriod} />
        {LOADING_ROWS}
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
  const showTokens = showFavorites && favoriteTokens ? favoriteTokens : topTokenAddresses
  const tokenRows = showTokens.map((tokenAddress, index) => {
    return (
      <LoadedRow
        key={tokenAddress}
        tokenAddress={tokenAddress}
        data={data}
        listNumber={index + 1}
        timePeriod={timePeriod}
        favoriteTokens={favoriteTokens}
        updateFavoriteTokens={updateFavoriteTokens}
      />
    )
  })
  return (
    <GridContainer>
      <HeaderRow timeframe={timePeriod} />
      {tokenRows}
    </GridContainer>
  )
}
