import { TimePeriod } from 'hooks/useTopTokens'
import useTopTokens from 'hooks/useTopTokens'
import React from 'react'
import styled from 'styled-components/macro'

import TokenRow, { HeaderRow } from './TokenRow'

//   min-width: 360px;
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

export default function TokenTable() {
  const { data, error, loading } = useTopTokens()
  const timePeriod = TimePeriod.day
  if (loading) {
    return <GridContainer>Top Token Data Loading</GridContainer>
  } else if (error || data === null) {
    return <GridContainer>Error Loading Top Token Data</GridContainer>
  }

  const topTokenAddresses = Object.keys(data)
  const tokenRows = topTokenAddresses.map((tokenAddress, index) => {
    return (
      <TokenRow
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
