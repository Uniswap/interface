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

export default function Loan() {
  // const DataRow = styled(RowBetween)`
  //   ${({ theme }) => theme.mediaWidth.upToSmall`
  //   flex-direction: column;
  // `};
  // `

  let cTokenList: [number, string, string, number, string, string, string, string][] = [
    [42, '0x4a77faee9650b09849ff459ea1476eab01606c7a', '0x482dC9bB08111CB875109B075A40881E48aE02Cd', 18, 'cBAT', 'Compound BAT', 'BAT', 'Basic Attention Token'], // bat
    [42, '0x4a92e71227d294f041bd82dd8f78591b75140d63', '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede', 6, 'cUSDC', 'Compound USDC', 'USDC', 'USD Coin'], // usdc
    [42, '0x41b5844f4680a8c38fbb695b7f9cfd1f64474a72', '0xd0A1E359811322d97991E03f863a0C30C2cF029C', 18, 'cETH', 'Compound ETH', 'WETH', 'Wrapped Ether'] // eth
  ]
  let result = useCTokens(cTokenList, undefined)
  console.log('rrrresult', result)
  
  return (
    <PageWrapper gap="lg" justify="center">
      <Summary></Summary>
      <MarketsWrap>
        <SupplyMarkets></SupplyMarkets>
        <BorrowMarkets></BorrowMarkets>
      </MarketsWrap>
    </PageWrapper>
  )
}
