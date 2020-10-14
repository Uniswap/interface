import React from 'react'
import { LightCard } from '../../components/Card'
// import { darken } from 'polished'
// import { useTranslation } from 'react-i18next'

import styled from 'styled-components'
import { utils } from 'ethers'

// import { YellowCard } from '../Card'

// import Row, { RowFixed } from '../Row'

const SummaryFrame = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: center;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  gap: 1.3rem;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    grid-template-columns: 1fr 1fr;
  `};
`

const SummaryElement = styled.div`
  display: flex;
  flex-direction: column;
`

const SummaryTitle = styled.div`
  margin-bottom: 1.2rem;
  font-size: 14px;
  color: #111;
  font-weight: 400;
`

const SummaryContent = styled.div`
  display: flex;
  align-items: center;
  font-size: 20px;
  color: #111;
  font-weight: 300;
`

const DotIcon = styled.div`
  font-size: 10px;
  margin-right: 15px;
  color: #1de9b6;
  display: inline-block;
  -webkit-font-smoothing: antialiased;
  &::before {
    content: '●';
  }
`

const BorrowWrap = styled.div`
  font-size: 50%;
  margin: 0px 0px 0px 10px;
  color: grey;
`

function Summary({ allMarkets = [] }: { allMarkets: any }) {
  // const { t } = useTranslation()

  // const [isDark] = useDarkModeManager()
  const suppliedAsset = allMarkets.map((item: any) => {
    return {
      ...item?.[1]
    }
  })
  console.log(suppliedAsset, 'suppliedAsset')
  console.log(utils.formatEther(suppliedAsset[0]?.borrowBalance ? suppliedAsset[0]?.borrowBalance : 0), 'suppliedAsset[0]?.borrowBalance')
  console.log(parseFloat(utils.formatEther(suppliedAsset[0]?.underlyingPrice ? suppliedAsset[0]?.underlyingPrice : 0)), 'suppliedAsset[0]?.underlyingPrice')
  
  function getSupplyTotalBalance() {
    let supplyTotalBalance = 0
    suppliedAsset.forEach((val:any, idx:any, suppliedAsset:any) => {
      supplyTotalBalance += parseFloat(utils.formatEther(val?.supplyBalance ? val?.supplyBalance : 0)) * parseFloat(utils.formatEther(val?.exchangeRateMantissa ? val?.exchangeRateMantissa : 0)) * parseFloat(utils.formatEther(val?.underlyingPrice ? val?.underlyingPrice : 0))
    }, supplyTotalBalance)
    return supplyTotalBalance
  }
  console.log(getSupplyTotalBalance(), 'getSupplyTotalBalance')

  function getBorrowTotalBalance() {
    let borrowTotalBalance = 0
    suppliedAsset.forEach((val:any, idx:any, suppliedAsset:any) => {
      borrowTotalBalance += parseFloat(utils.formatEther(val?.borrowBalance ? val?.borrowBalance : 0)) * parseFloat(utils.formatEther(val?.underlyingPrice ? val?.underlyingPrice : 0))
    }, borrowTotalBalance)
    return borrowTotalBalance
  }
  console.log(getBorrowTotalBalance(), 'getBorrowTotalBalance')

  function getLimit() {
    let collateralFactorMantissa = 0
    suppliedAsset.forEach((val:any, idx:any, suppliedAsset:any) => {
      collateralFactorMantissa += parseFloat(utils.formatEther(val?.supplyBalance ? val?.supplyBalance : 0))
      * parseFloat(utils.formatEther(val?.exchangeRateMantissa
      ? val?.exchangeRateMantissa : 0)) * parseFloat(utils.formatEther(val?.underlyingPrice ? val?.underlyingPrice : 0))
      * parseFloat(utils.formatEther(val?.collateralFactorMantissa ? val?.collateralFactorMantissa : 0))
    }, collateralFactorMantissa)
    return collateralFactorMantissa
  }
  console.log(getLimit(), 'getLimit')
  console.log(getBorrowTotalBalance(), 'getBorrowTotalBalance')
  // const collateralFactorMantissa = parseFloat(utils.formatEther(suppliedAsset[2]?.collateralFactorMantissa ? suppliedAsset[2]?.collateralFactorMantissa : 0)) // eth collateralFactorMantissa

  console.log('summary', allMarkets.length)

  return (
    <LightCard>
      <SummaryFrame>
        <SummaryElement>
          <SummaryTitle>Supply Balance</SummaryTitle>
          <SummaryContent>
            <DotIcon />
            ${(getSupplyTotalBalance()).toFixed(8)}
          </SummaryContent>
        </SummaryElement>
        <SummaryElement>
          <SummaryTitle>Net APY</SummaryTitle>
          <SummaryContent>
            <DotIcon />
            0.00%
          </SummaryContent>
        </SummaryElement>
        <SummaryElement>
          <SummaryTitle>Borrow Balance</SummaryTitle>
          <SummaryContent>
            <DotIcon />
            ${getBorrowTotalBalance().toFixed(8)}
          </SummaryContent>
        </SummaryElement>
        <SummaryElement>
          <SummaryTitle>Borrow Limit</SummaryTitle>
          <SummaryContent>
            <DotIcon />
            ${getLimit().toFixed(2)}
            <BorrowWrap>({((getBorrowTotalBalance() / getLimit()) * 100).toFixed(2)}% Used)</BorrowWrap>
          </SummaryContent>
        </SummaryElement>
      </SummaryFrame>
    </LightCard>
  )
}

export default Summary
