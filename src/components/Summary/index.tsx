import React from 'react'
// import { LightCard } from '../../components/Card'
// import { darken } from 'polished'
// import { useTranslation } from 'react-i18next'

import styled from 'styled-components'
import { utils } from 'ethers'

// import { YellowCard } from '../Card'

// import Row, { RowFixed } from '../Row'

const SummaryCard = styled.div`
  background: #ffffff;
  box-shadow: 0px 2px 4px rgba(16, 21, 24, 0.05);
  border-radius: 4px;
  width: 100%;
`

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
  padding: 24px 28px;
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

function Summary({
  allMarkets = [],
  supplyTotalBalance,
  borrowTotalBalance,
  limit,
  netApy
}: {
  allMarkets: any
  supplyTotalBalance: any
  borrowTotalBalance: any
  limit: any
  netApy: any
}) {
  // const { t } = useTranslation()

  // const [isDark] = useDarkModeManager()
  const suppliedAsset = allMarkets.map((item: any) => {
    return {
      ...item?.[1]
    }
  })
  console.log(suppliedAsset, 'suppliedAsset')
  console.log(
    utils.formatEther(suppliedAsset[0]?.borrowBalance ? suppliedAsset[0]?.borrowBalance : 0),
    'suppliedAsset[0]?.borrowBalance'
  )
  console.log(
    utils.formatEther(suppliedAsset[0]?.liquidity ? suppliedAsset[0]?.liquidity : 0),
    'suppliedAsset[0]?.liquidity'
  )
  console.log(
    parseFloat(utils.formatEther(suppliedAsset[0]?.underlyingPrice ? suppliedAsset[0]?.underlyingPrice : 0)),
    'suppliedAsset[0]?.underlyingPrice'
  )

  return (
    <SummaryCard>
      <SummaryFrame>
        <SummaryElement>
          <SummaryTitle>Supply Balance</SummaryTitle>
          <SummaryContent>
            <DotIcon />${supplyTotalBalance?.toFixed(2)}
          </SummaryContent>
        </SummaryElement>
        <SummaryElement>
          <SummaryTitle>Net APY</SummaryTitle>
          <SummaryContent>
            <DotIcon />
            {netApy?.toFixed(2)}%
          </SummaryContent>
        </SummaryElement>
        <SummaryElement>
          <SummaryTitle>Borrow Balance</SummaryTitle>
          <SummaryContent>
            <DotIcon />${borrowTotalBalance.toFixed(2)}
          </SummaryContent>
        </SummaryElement>
        <SummaryElement>
          <SummaryTitle>Borrow Limit</SummaryTitle>
          <SummaryContent>
            <DotIcon />${limit?.toFixed(2)}
            <BorrowWrap>({limit ? ((borrowTotalBalance / limit) * 100).toFixed(2) : '0.00'}% Used)</BorrowWrap>
          </SummaryContent>
        </SummaryElement>
      </SummaryFrame>
    </SummaryCard>
  )
}

export default Summary
