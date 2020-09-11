import React, { useContext, useEffect, useState } from 'react'
import { Text } from 'rebass'
import { CustomTitle } from '../../utils/customTitle'

import styled, { ThemeContext } from 'styled-components'

import { SwapPoolTabs } from '../../components/NavigationTabs'

import { Wrapper } from '../../components/swap/styleds'

import YieldCroInputPanel from '../../components/YieldCroInputPanel'
import YieldFiatInputPanel from '../../components/YieldIFiatInputPanel'
import YieldYearRadio from '../../components/YieldYearRadio'
import { RowBetween } from '../../components/Row'
import { useCalculatorState, useCalculatorActionHandlers } from '../../state/calculator/hooks'
import { Field } from '../../state/calculator/actions'
import Calculator, { emptyResult } from '../../state/calculator/domain'
import { CalculatorResult } from '../../state/calculator/reducer'
import { MouseoverTooltip } from '../../components/Tooltip'
import Question from '../../components/Stake/QuestionTooltip'
import { ExternalLink } from '../../theme'
import { useTranslation } from 'react-i18next'

const YieldBody = styled.div`
  position: relative;
  max-width: 800px;
  width: 100%;
  background: ${({ theme }) => theme.bg1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 30px;
  padding: 1rem;
`

const YieldColumn = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
  `};
`

const ContentWrapper = styled.div`
  color: ${({ theme }) => theme.text3};
  position: relative;
  max-width: 366px;
  width: 100%;
  background: ${({ theme }) => theme.bg1};
  border-radius: 30px;
  padding: 1rem;
`

const InfoWrapper = styled.div`
  color: ${({ theme }) => theme.text3};
  position: relative;
  max-width: 366px;
  width: 100%;
  background: ${({ theme }) => theme.primary4};
  border-radius: 30px;
  padding: 24px;
`

const InfoColumn = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const ResultContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
`

const InfoContainer = styled.div`
  width: 40%;
`

function AnnualizedCroReward({ reward }: { reward: string }) {
  if (reward.length > 13) {
    const displayedReward = `${reward.substring(0, 11)}...`
    return (
      <MouseoverTooltip text={`${reward} CRO`}>
        <Text fontSize={40}>{displayedReward} CRO</Text>
      </MouseoverTooltip>
    )
  }
  return <Text fontSize={40}>{reward} CRO</Text>
}

export default function Yield() {
  const theme = useContext(ThemeContext)
  const { t } = useTranslation()
  const state = useCalculatorState()
  const {
    [Field.STAKE_YEAR]: stakeYear,
    [Field.TOTAL_LIQUIDITY_PROVIDED_USD]: totalLiquidityProvidedUsd,
    [Field.TOTAL_STAKED_AMOUNT_CRO]: totalStakedAmountCro
  } = state
  const { onStakedCroAmountInput, onLiquidityProvidedUsdAmount, onStakeYear } = useCalculatorActionHandlers()

  const [result, setResult] = useState<CalculatorResult>(emptyResult)
  useEffect(() => {
    const newResult = Calculator.computeResult(state)
    setResult(newResult)
  }, [state])

  return (
    <>
      <CustomTitle titleStr={'APY Calculator | DeFi Swap'}></CustomTitle>
      <YieldBody>
        <SwapPoolTabs active={'apy'} />
        <Wrapper id="yield-page">
          <YieldColumn>
            <ContentWrapper>
              <RowBetween marginBottom="16px">
                <Text color={theme.text3} fontSize={[22]} fontWeight={500}>
                  Calculate Yield
                </Text>
              </RowBetween>
              <YieldFiatInputPanel
                id="total-liquidity-provided"
                label="Total Liquidity Provided"
                value={totalLiquidityProvidedUsd}
                onUserInput={onLiquidityProvidedUsdAmount}
                currency={'USD'}
              />
              <YieldCroInputPanel
                id="total-staked-amount"
                label="Total Staked Amount"
                value={totalStakedAmountCro}
                onUserInput={onStakedCroAmountInput}
              />
              <YieldYearRadio id="yield-year-radio" value={stakeYear} onUserInput={onStakeYear} />
            </ContentWrapper>
            <InfoWrapper>
              <RowBetween marginBottom="24px">
                <Text fontSize={[18]} fontWeight={500}>
                  Estimated{' '}
                  <span role="img" aria-label="rocket">
                    🚀
                  </span>{' '}
                  Boosted Yield
                  <Question
                    text={
                      <>
                        {t('apy_tooltip_1')}
                        <ExternalLink
                          href={`https://help.crypto.com/en/articles/4429871-how-is-my-accrued-cro-defi-yield-calculated-on-defi-swap`}
                        >
                          {t('apy_tooltip_faq')}
                        </ExternalLink>
                        {t('apy_tooltip_2')}
                      </>
                    }
                  />
                </Text>
              </RowBetween>
              <InfoColumn>
                <InfoContainer>
                  <Text color={theme.primary1} fontSize={14}>
                    Forecast APY
                  </Text>
                  <Text color={theme.primary1} fontSize={40}>
                    {result.newApyPercent}%
                  </Text>
                </InfoContainer>
              </InfoColumn>
              <RowBetween marginTop="24px">
                <ResultContainer>
                  <Text fontSize={14}>Annualized CRO DeFi Yield</Text>
                  <AnnualizedCroReward reward={result.annualizedCroRewards} />
                </ResultContainer>
              </RowBetween>
            </InfoWrapper>
          </YieldColumn>
        </Wrapper>
      </YieldBody>
    </>
  )
}
