import React from 'react'
import { LightCard } from '../../components/Card'
// import { darken } from 'polished'
// import { useTranslation } from 'react-i18next'

import styled from 'styled-components'

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
  console.log('summary', allMarkets.length)

  return (
    <LightCard>
      <SummaryFrame>
        <SummaryElement>
          <SummaryTitle>Supply Balance</SummaryTitle>
          <SummaryContent>
            <DotIcon />
            $0.00
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
            $0.00
          </SummaryContent>
        </SummaryElement>
        <SummaryElement>
          <SummaryTitle>Borrow Limit</SummaryTitle>
          <SummaryContent>
            <DotIcon />
            $0.00
            <BorrowWrap>(0.00% Used)</BorrowWrap>
          </SummaryContent>
        </SummaryElement>
      </SummaryFrame>
    </LightCard>
  )
}

export default Summary
