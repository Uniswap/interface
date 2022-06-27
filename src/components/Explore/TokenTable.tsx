import { TimePeriod } from 'hooks/useTopTokens'
import useTopTokens from 'hooks/useTopTokens'
import React from 'react'
import styled from 'styled-components/macro'

import TokenRow, { headerRow } from './TokenRow'

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 360px;
  max-width: 960px;
  background: ${({ theme }) => theme.bg0};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-left: auto;
  margin-right: auto;
  border-radius: 8px;
  justify-content: center;
`

export default function TokenTable() {
  const { data, error, loading } = useTopTokens()
  const timePeriod = TimePeriod.day
  if (error) {
    return <GridContainer style={{ padding: '4px 0px' }}>Error Loading Top Token Data</GridContainer>
  }
  if (loading) {
    return <GridContainer style={{ padding: '4px 0px' }}>Top Token Data Loading</GridContainer>
  }
  if (data === null) {
    return <GridContainer style={{ padding: '4px 0px' }}>No Top Token Data Available</GridContainer>
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
      {headerRow()}
      <div style={{ padding: '4px 0px' }}>{tokenRows}</div>
    </GridContainer>
  )
}
