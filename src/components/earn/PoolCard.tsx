import { Percent } from '@ubeswap/sdk'
import QuestionHelper, { LightQuestionHelper } from 'components/QuestionHelper'
import { useStakingPoolValue } from 'pages/Earn/useStakingPoolValue'
import React from 'react'
import styled from 'styled-components'
import { BIG_INT_SECONDS_IN_WEEK } from '../../constants'
import { useColor } from '../../hooks/useColor'
import { StakingInfo } from '../../state/stake/hooks'
import { StyledInternalLink, TYPE } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed } from '../Row'
import { Break, CardNoise } from './styled'

const StatContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1rem;
  margin-right: 1rem;
  margin-left: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  display: none;
`};
`

const Wrapper = styled(AutoColumn)<{ showBackground: boolean; bgColor: any }>`
  border-radius: 12px;
  width: 100%;
  overflow: hidden;
  position: relative;
  background: ${({ bgColor }) => `radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor} 0%, #212429 100%) `};
  color: ${({ theme, showBackground }) => (showBackground ? theme.white : theme.text1)} !important;
  ${({ showBackground }) =>
    showBackground &&
    `  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);`}
`

const TopSection = styled.div`
  display: grid;
  grid-template-columns: 48px 1fr 120px;
  grid-gap: 0px;
  align-items: center;
  padding: 1rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 48px 1fr 96px;
  `};
`

const BottomSection = styled.div<{ showBackground: boolean }>`
  padding: 12px 16px;
  opacity: ${({ showBackground }) => (showBackground ? '1' : '0.4')};
  border-radius: 0 0 12px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  z-index: 1;
`

export default function PoolCard({ stakingInfo }: { stakingInfo: StakingInfo }) {
  const [token0, token1] = stakingInfo.tokens

  const isStaking = Boolean(stakingInfo.stakedAmount && stakingInfo.stakedAmount.greaterThan('0'))

  // get the color of the token
  const token = token0.symbol?.startsWith('m') ? token1 : token0
  const backgroundColor = useColor(token)

  // get the USD value of staked WETH
  const {
    valueCUSD: valueOfTotalStakedAmountInCUSD,
    userValueCUSD,
    userAmountTokenA,
    userAmountTokenB,
  } = useStakingPoolValue(stakingInfo)
  const apyFraction = valueOfTotalStakedAmountInCUSD
    ? stakingInfo.dollarRewardPerYear?.divide(valueOfTotalStakedAmountInCUSD)
    : undefined
  const apy = apyFraction ? new Percent(apyFraction.numerator, apyFraction.denominator) : undefined

  return (
    <Wrapper showBackground={isStaking} bgColor={backgroundColor}>
      <CardNoise />

      <TopSection>
        <DoubleCurrencyLogo currency0={token0} currency1={token1} size={24} />
        <TYPE.white fontWeight={600} fontSize={24} style={{ marginLeft: '8px' }}>
          {token0.symbol}-{token1.symbol}
        </TYPE.white>

        <StyledInternalLink to={`/farm/${currencyId(token0)}/${currencyId(token1)}`} style={{ width: '100%' }}>
          <ButtonPrimary padding="8px" borderRadius="8px">
            {isStaking ? 'Manage' : 'Deposit'}
          </ButtonPrimary>
        </StyledInternalLink>
      </TopSection>

      <StatContainer>
        <RowBetween>
          <TYPE.white> Total deposited</TYPE.white>
          <TYPE.white>
            {valueOfTotalStakedAmountInCUSD
              ? `$${valueOfTotalStakedAmountInCUSD.toFixed(0, {
                  groupSeparator: ',',
                })}`
              : '-'}
          </TYPE.white>
        </RowBetween>
        <RowBetween>
          <TYPE.white> Pool rate </TYPE.white>
          <TYPE.white>
            {stakingInfo
              ? stakingInfo.active
                ? `${stakingInfo.totalRewardRate
                    ?.multiply(BIG_INT_SECONDS_IN_WEEK)
                    ?.toFixed(0, { groupSeparator: ',' })} UBE / week`
                : '0 UBE / week'
              : '-'}
          </TYPE.white>
        </RowBetween>
        {apy && apy.greaterThan('0') && (
          <RowBetween>
            <RowFixed>
              <TYPE.white>APR</TYPE.white>
              <LightQuestionHelper text="The annualized, non-compounding rate of rewards based on the current value of UBE relative to the tokens in this pool." />
            </RowFixed>
            <TYPE.white>
              {apy && apy.denominator.toString() !== '0' ? `${apy.toFixed(0, { groupSeparator: ',' })}%` : '-'}
            </TYPE.white>
          </RowBetween>
        )}

        {!stakingInfo.active && (
          <RowBetween>
            <RowFixed>
              <TYPE.white>Next pool rate</TYPE.white>
              <LightQuestionHelper text="The rate of emissions this pool will receive on the next rewards refresh." />
            </RowFixed>
            <TYPE.white>
              {`${stakingInfo.nextPeriodRewards.toFixed(0, {
                groupSeparator: ',',
              })} UBE / week`}
            </TYPE.white>
          </RowBetween>
        )}
      </StatContainer>

      {isStaking && (
        <>
          <Break />
          <BottomSection showBackground={true}>
            <RowBetween>
              <TYPE.black color={'white'} fontWeight={500}>
                <span>Your rate</span>
              </TYPE.black>

              <TYPE.black style={{ textAlign: 'right' }} color={'white'} fontWeight={500}>
                <span role="img" aria-label="wizard-icon" style={{ marginRight: '0.5rem' }}>
                  ⚡
                </span>
                {stakingInfo
                  ? stakingInfo.active
                    ? `${stakingInfo.rewardRate
                        ?.multiply(BIG_INT_SECONDS_IN_WEEK)
                        ?.toSignificant(4, { groupSeparator: ',' })} UBE / week`
                    : '0 UBE / week'
                  : '-'}
              </TYPE.black>
            </RowBetween>
            {userValueCUSD && (
              <RowBetween>
                <TYPE.black color={'white'} fontWeight={500}>
                  <span>Your stake</span>
                </TYPE.black>

                <RowFixed>
                  <TYPE.black style={{ textAlign: 'right' }} color={'white'} fontWeight={500}>
                    ${userValueCUSD.toFixed(0, { groupSeparator: ',' })}
                  </TYPE.black>
                  <QuestionHelper
                    text={`${userAmountTokenA?.toFixed(0, { groupSeparator: ',' })} ${
                      userAmountTokenA?.token.symbol
                    }, ${userAmountTokenB?.toFixed(0, { groupSeparator: ',' })} ${userAmountTokenB?.token.symbol}`}
                  />
                </RowFixed>
              </RowBetween>
            )}
          </BottomSection>
        </>
      )}
    </Wrapper>
  )
}
