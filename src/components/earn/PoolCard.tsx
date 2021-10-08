import { Percent } from '@ubeswap/sdk'
import QuestionHelper from 'components/QuestionHelper'
import { useStakingPoolValue } from 'pages/Earn/useStakingPoolValue'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAnnualRewardDollars } from 'state/stake/useAnnualRewardDollars'
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
import PoolStatRow from './PoolStats/PoolStatRow'
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

interface Props {
  stakingInfo: StakingInfo
}

export const PoolCard: React.FC<Props> = ({ stakingInfo }: Props) => {
  const { t } = useTranslation()
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
  const dollarRewardPerYear = useAnnualRewardDollars(stakingInfo.rewardTokens, stakingInfo.totalRewardRates)
  const apyFraction =
    stakingInfo.active && valueOfTotalStakedAmountInCUSD && !valueOfTotalStakedAmountInCUSD.equalTo('0')
      ? dollarRewardPerYear?.divide(valueOfTotalStakedAmountInCUSD)
      : undefined
  const apy = apyFraction ? new Percent(apyFraction.numerator, apyFraction.denominator) : undefined

  // let weeklyAPY: React.ReactNode | undefined = <>🤯</>
  let quarterlyAPY: React.ReactNode | undefined = <>🤯</>
  try {
    // weeklyAPY = apy
    //   ? new Percent(
    //       Math.floor(parseFloat(apy.divide('52').add('1').toFixed(10)) ** 52 * 1_000_000).toFixed(0),
    //       '1000000'
    //     ).toFixed(0, { groupSeparator: ',' })
    //   : undefined
    quarterlyAPY = apy
      ? new Percent(
          Math.floor(parseFloat(apy.divide('2').add('1').toFixed(10)) ** 2 * 1_000_000).toFixed(0),
          '1000000'
        ).toFixed(0, { groupSeparator: ',' })
      : undefined
  } catch (e) {
    console.error('Weekly apy overflow', e)
  }

  // TODO: add back in
  // const showNextPoolRate =
  //   (stakingInfo.active && stakingInfo.nextPeriodRewards.equalTo('0')) ||
  //   (stakingInfo.active &&
  //     // If the next rate is >=1_000 change from previous rate, then show it
  //     Math.abs(
  //       parseFloat(
  //         stakingInfo.totalRewardRate
  //           ?.multiply(BIG_INT_SECONDS_IN_WEEK)
  //           .subtract(stakingInfo.nextPeriodRewards)
  //           .toFixed(0) ?? 0
  //       )
  //     ) >= 1_000) ||
  //   (!stakingInfo.active && stakingInfo.nextPeriodRewards.greaterThan('0'))

  return (
    <Wrapper showBackground={isStaking} bgColor={backgroundColor}>
      <CardNoise />

      <TopSection>
        <DoubleCurrencyLogo currency0={token0} currency1={token1} size={24} />
        <PoolInfo style={{ marginLeft: '8px' }}>
          <TYPE.white fontWeight={600} fontSize={[18, 24]}>
            {token0.symbol}-{token1.symbol}
          </TYPE.white>
          {apy && apy.greaterThan('0') && (
            <TYPE.small className="apr" fontWeight={400} fontSize={14}>
              {apy.denominator.toString() !== '0' ? `${apy.toFixed(0, { groupSeparator: ',' })}%` : '-'} APR
            </TYPE.small>
          )}
        </PoolInfo>

        <StyledInternalLink
          to={`/farm/${currencyId(token0)}/${currencyId(token1)}/${stakingInfo.stakingRewardAddress}`}
          style={{ width: '100%' }}
        >
          <ButtonPrimary padding="8px" borderRadius="8px">
            {isStaking ? t('manage') : t('deposit')}
          </ButtonPrimary>
        </StyledInternalLink>
      </TopSection>

      <StatContainer>
        <PoolStatRow
          statName={t('totalDeposited')}
          statValue={
            valueOfTotalStakedAmountInCUSD
              ? `$${valueOfTotalStakedAmountInCUSD.toFixed(0, {
                  groupSeparator: ',',
                })}`
              : '-'
          }
        />
        {stakingInfo.active &&
          stakingInfo.totalRewardRates.map((totalRewardRate, idx) => {
            return (
              <React.Fragment key={idx}>
                <PoolStatRow
                  statName={totalRewardRate.token.symbol + ` ${t('rate')}`}
                  statValue={
                    stakingInfo.active
                      ? `${totalRewardRate?.multiply(BIG_INT_SECONDS_IN_WEEK)?.toFixed(0, { groupSeparator: ',' })} ${
                          totalRewardRate.token.symbol
                        } / week`
                      : `0 ${totalRewardRate.token.symbol} / week`
                  }
                />
              </React.Fragment>
            )
          })}
        {apy && apy.greaterThan('0') && (
          <PoolStatRow
            helperText={<>Compounded semiannually</>}
            statName={stakingInfo.rewardTokens.length > 1 ? 'Combined APY' : 'APY'}
            statValue={apy.denominator.toString() !== '0' ? `${quarterlyAPY}%` : '-'}
          />
        )}

        {/*
          TODO: Add back in
          showNextPoolRate && (
          <RowBetween>
            <RowFixed>
              <TYPE.white>Next pool rate</TYPE.white>
              <LightQuestionHelper text="The rate of emissions this pool will receive on the next rewards refresh." />
            </RowFixed>
            <TYPE.white>
              {`${stakingInfo.nextPeriodRewards.toFixed(0, {
                groupSeparator: ',',
              })} ${stakingInfo.nextPeriodRewards.token.symbol} / week`}
            </TYPE.white>
          </RowBetween>
        )*/}
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
                {(stakingInfo.rewardRates
                  ? stakingInfo.rewardRates
                      .map(
                        (rewardRate) =>
                          `${rewardRate.multiply(BIG_INT_SECONDS_IN_WEEK).toSignificant(4, { groupSeparator: ',' })} ${
                            rewardRate.token.symbol
                          }`
                      )
                      .join(' + ')
                  : '-') + ' / week'}
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

const PoolInfo = styled.div`
  .apr {
    margin-top: 4px;
    display: none;
    ${({ theme }) => theme.mediaWidth.upToSmall`
  display: block;
  `}
  }
`
