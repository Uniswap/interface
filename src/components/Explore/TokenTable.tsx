import { TimePeriod } from 'hooks/useTopTokens'
import useTopTokens from 'hooks/useTopTokens'
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

  @media only screen and (max-width: 390px) {
    padding: 20px 16px;
  }
`
const LOADING_ROWS = Array(10)
  .fill(0)
  .map((item, index) => {
    return <LoadingRow key={`${index}`} />
  })

export default function TokenTable() {
  const { data, error, loading } = useTopTokens()
  const timePeriod = TimePeriod.day
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

  const topTokenAddresses = Object.keys(data)
  const tokenRows = topTokenAddresses.map((tokenAddress, index) => {
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
      {tokenRows}
    </GridContainer>
  )
}
