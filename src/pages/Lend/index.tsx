import React from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'

import Summary from '../../components/Summary'
import SupplyMarkets from '../../components/SupplyMarkets'
import BorrowMarkets from '../../components/BorrowMarkets'
import { useCTokens } from '../../data/CToken'
// import { RowBetween } from '../../components/Row'
// import Loader from '../../components/Loader'

const PageWrapper = styled(AutoColumn)`
  max-width: 1280px;
  width: 75%;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 80%;
  `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
  `};
`

const MarketsWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  justify-content: space-between;
  align-items: start;
  flex-direction: row;
  gap: 1.3rem;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    grid-template-columns: 1fr;
  `};
`

// const TopSection = styled(AutoColumn)`
//   max-width: 1200px;
//   width: 100%;
//   background-color: ${({ theme }) => theme.bg1};
// `

export default function Lend() {
  // const DataRow = styled(RowBetween)`
  //   ${({ theme }) => theme.mediaWidth.upToSmall`
  //   flex-direction: column;
  // `};
  // `

  const allMarkets = useCTokens()
  console.log('loan', allMarkets)

  return (
    <PageWrapper gap="lg" justify="center">
      <Summary allMarkets={allMarkets}></Summary>
      <MarketsWrap>
        <SupplyMarkets allMarkets={allMarkets}></SupplyMarkets>
        <BorrowMarkets allMarkets={allMarkets}></BorrowMarkets>
      </MarketsWrap>
    </PageWrapper>
  )
}
