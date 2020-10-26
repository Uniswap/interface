import { Fraction, JSBI } from '@uniswap/sdk'
import React from 'react'
// import { LightCard } from '../../components/Card'
// import { darken } from 'polished'
// import { useTranslation } from 'react-i18next'

import styled from 'styled-components'
import { formatData } from '../../utils'

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
  supplyTotalBalance,
  borrowTotalBalance,
  limit,
  usedLimit,
  netApy
}: {
  supplyTotalBalance: JSBI
  borrowTotalBalance: JSBI
  limit: JSBI
  usedLimit: Fraction
  netApy: number
}) {
  // const { t } = useTranslation()
  // limit ? ((borrowTotalBalance / limit) * 100).toFixed(2)

  return (
    <SummaryCard>
      <SummaryFrame>
        <SummaryElement>
          <SummaryTitle>Supply Balance</SummaryTitle>
          <SummaryContent>
            <DotIcon />${formatData(supplyTotalBalance).toFixed(8)}
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
            <DotIcon />${formatData(borrowTotalBalance).toFixed(8)}
          </SummaryContent>
        </SummaryElement>
        <SummaryElement>
          <SummaryTitle>Borrow Limit</SummaryTitle>
          <SummaryContent>
            <DotIcon />${formatData(limit).toFixed(2)}
            <BorrowWrap>({usedLimit.toSignificant(4) ?? '0.00'}% Used)</BorrowWrap>
          </SummaryContent>
        </SummaryElement>
      </SummaryFrame>
    </SummaryCard>
  )
}

export default Summary
