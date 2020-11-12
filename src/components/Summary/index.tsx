import { Fraction, JSBI } from '@uniswap/sdk'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { formatData, showDollarValue } from '../../utils'
import MarketBar from '../MarketBar'

const SummaryCard = styled.div`
  background: ${({ theme }) => theme.bg1};
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
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const SummaryTitle = styled.div`
  margin-bottom: 1.2rem;
  font-size: 14px;
  color: ${({ theme }) => theme.text1};
  font-weight: 600;
`

const SummaryContent = styled.div`
  display: flex;
  align-items: center;
  font-size: 20px;
  color: ${({ theme }) => theme.text1};
  font-weight: 400;
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
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 6px;
    margin-right: 4px;
  `};
`

const MarketBarWrap = styled.div`
  display: flex;
  align-items: center;
  padding: 24px 28px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const MarketBarTitle = styled.div`
  font-size: 0.8rem;
  white-space: nowrap;
`

function Summary({
  supplyTotalBalance,
  borrowTotalBalance,
  limit,
  usedLimit,
  netApy,
  totalMarketSize
}: {
  supplyTotalBalance: JSBI
  borrowTotalBalance: JSBI
  limit: JSBI
  usedLimit: Fraction
  netApy: Fraction
  totalMarketSize: JSBI
}) {
  const { t } = useTranslation()

  const formaterSupplyTotalBalance = useMemo(() => {
    return formatData(supplyTotalBalance).toFixed(8)
  }, [supplyTotalBalance])

  const formaterNetAPY = useMemo(() => {
    return netApy.toFixed(2)
  }, [netApy])

  const formaterBorrowTotalBalance = useMemo(() => {
    return formatData(borrowTotalBalance).toFixed(8)
  }, [borrowTotalBalance])

  const formaterMarketSize = useMemo(() => {
    return showDollarValue(totalMarketSize)
  }, [totalMarketSize])

  const formaterRate = useMemo((): number => {
    return Number(usedLimit.toSignificant(4)) ?? 0
  }, [usedLimit])

  const formaterLimit = useMemo(() => {
    return formatData(limit).toFixed(2)
  }, [limit])

  return (
    <SummaryCard>
      <SummaryFrame>
        <SummaryElement>
          <SummaryTitle>{t('supplyBalance')}</SummaryTitle>
          <SummaryContent>
            <DotIcon />${formaterSupplyTotalBalance}
          </SummaryContent>
        </SummaryElement>
        <SummaryElement>
          <SummaryTitle>{t('netAPY')}</SummaryTitle>
          <SummaryContent>
            <DotIcon />
            {formaterNetAPY}%
          </SummaryContent>
        </SummaryElement>
        <SummaryElement>
          <SummaryTitle>{t('borrowBalance')}</SummaryTitle>
          <SummaryContent>
            <DotIcon />${formaterBorrowTotalBalance}
          </SummaryContent>
        </SummaryElement>
        <SummaryElement>
          <SummaryTitle>{t('totalMarketSize')}</SummaryTitle>
          <SummaryContent>
            <DotIcon />${formaterMarketSize}
          </SummaryContent>
        </SummaryElement>
      </SummaryFrame>
      <MarketBarWrap>
        <MarketBarTitle style={{ paddingRight: '6px' }}>{t('borrowLimit')}</MarketBarTitle>
        <MarketBar rate={formaterRate} showRate={true} />
        <MarketBarTitle style={{ paddingLeft: '6px' }}>${formaterLimit}</MarketBarTitle>
      </MarketBarWrap>
    </SummaryCard>
  )
}

export default Summary
