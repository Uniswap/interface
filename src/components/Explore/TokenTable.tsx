import { TimePeriod } from 'hooks/useTopTokens'
import useTopTokens from 'hooks/useTopTokens'
import React from 'react'
import styled from 'styled-components/macro'

import TokenRow from './TokenRow'
import TokenTableHeader from './TokenTableHeader'

const GridContainer = styled.div`
  display: grid;
  width: 960px;
  background: ${({ theme }) => theme.bg0};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-left: auto;
  margin-right: auto;
  border-radius: 8px;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.bg3};
`

export default function TokenTable() {
  const { data, error, loading } = useTopTokens()
  const timePeriod = TimePeriod.day
  if (error) {
    return <GridContainer>Error Loading Top Token Data</GridContainer>
  }
  if (loading) {
    return <GridContainer>Top Token Data Loading</GridContainer>
  }
  if (data === null) {
    return <GridContainer>No Top Token Data Available</GridContainer>
  }
  const topTokenAddresses = Object.keys(data)
  let listNumber = 0

  const tokenRows = topTokenAddresses.map((tokenAddress) => {
    listNumber += 1
    return (
      <TokenRow
        key={tokenAddress}
        tokenAddress={tokenAddress}
        data={data}
        listNumber={listNumber}
        timePeriod={timePeriod}
      />
    )
  })

  return (
    <GridContainer>
      <TokenTableHeader />
      {tokenRows}
    </GridContainer>
  )
}
