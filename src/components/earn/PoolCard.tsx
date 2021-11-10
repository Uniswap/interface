import { gql, useQuery } from '@apollo/client'
import { useContractKit } from '@celo-tools/use-contractkit'
import { ChainId, cUSD, Percent, TokenAmount } from '@ubeswap/sdk'
import QuestionHelper from 'components/QuestionHelper'
import { useStakingPoolValue } from 'pages/Earn/useStakingPoolValue'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useAnnualRewardDollars } from 'state/stake/useAnnualRewardDollars'
import { updateUserAprMode } from 'state/user/actions'
import { useIsAprMode } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components'
import { toWei } from 'web3-utils'

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

const pairDataGql = gql`
  query getPairHourData($id: String!) {
    pair(id: $id) {
      pairHourData(first: 24, orderBy: hourStartUnix, orderDirection: desc) {
        hourStartUnix
        hourlyVolumeUSD
      }
    }
  }
`

export const PoolCard: React.FC<Props> = ({ stakingInfo }: Props) => {
  const { t } = useTranslation()
  const { network } = useContractKit()
  const userAprMode = useIsAprMode()
  const dispatch = useDispatch()
  const [token0, token1] = stakingInfo.tokens
  const { data, loading, error } = useQuery(pairDataGql, {
    variables: { id: stakingInfo.stakingToken.address.toLowerCase() },
  })
  const theme = useTheme()

  const isStaking = Boolean(stakingInfo.stakedAmount && stakingInfo.stakedAmount.greaterThan('0'))

  // get the USD value of staked WETH
  const {
    valueCUSD: valueOfTotalStakedAmountInCUSD,
    userValueCUSD,
    userAmountTokenA,
    userAmountTokenB,
  } = useStakingPoolValue(stakingInfo)
  const annualFarmRewards = useAnnualRewardDollars(stakingInfo.rewardTokens, stakingInfo.totalRewardRates)
  let annualSwapFees
  if (!loading && !error && data) {
    const lastDayVolumeUsd = data.pair.pairHourData.reduce(
      (acc: number, curr: { hourlyVolumeUSD: string }) => acc + Number(curr.hourlyVolumeUSD),
      0
    )
    const yearlyVolumeUsd = lastDayVolumeUsd * 365
    annualSwapFees = new TokenAmount(
      cUSD[network.chainId as unknown as ChainId],
      toWei(Math.floor(yearlyVolumeUsd * 0.0025).toString())
    )
  }
  const rewardApyFraction =
    stakingInfo.active && valueOfTotalStakedAmountInCUSD && !valueOfTotalStakedAmountInCUSD.equalTo('0')
      ? annualFarmRewards?.divide(valueOfTotalStakedAmountInCUSD)
      : undefined
  const swapApyFraction =
    stakingInfo.active && valueOfTotalStakedAmountInCUSD && !valueOfTotalStakedAmountInCUSD.equalTo('0')
      ? annualSwapFees?.divide(valueOfTotalStakedAmountInCUSD)
      : undefined

  const rewardApy = rewardApyFraction
    ? new Percent(rewardApyFraction.numerator, rewardApyFraction.denominator)
    : undefined
  const swapApy = swapApyFraction ? new Percent(swapApyFraction.numerator, swapApyFraction.denominator) : undefined
  const apy =
    rewardApyFraction && swapApyFraction
      ? new Percent(
          swapApyFraction.add(rewardApyFraction).numerator,
          swapApyFraction.add(rewardApyFraction).denominator
        )
      : undefined

  // let weeklyAPY: React.ReactNode | undefined = <>🤯</>
  let quarterlyAPY: React.ReactNode | undefined = <>🤯</>
  try {
    // weeklyAPY = apy
    //   ? new Percent(
    //       Math.floor(parseFloat(apy.divide('52').add('1').toFixed(10)) ** 52 * 1_000_000 - 1_000_000).toFixed(0),
    //       '1000000'
    //     ).toFixed(0, { groupSeparator: ',' })
    //   : undefined
    quarterlyAPY = apy
      ? new Percent(
          Math.floor(parseFloat(apy.divide('2').add('1').toFixed(10)) ** 2 * 1_000_000 - 1_000_000).toFixed(0),
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
    <Wrapper showBackground={isStaking} bgColor={theme.primary1}>
      <CardNoise />

      <TopSection>
        <DoubleCurrencyLogo currency0={token0} currency1={token1} size={24} />
        <PoolInfo style={{ marginLeft: '8px' }}>
          <TYPE.white fontWeight={600} fontSize={[18, 24]}>
            {token0.symbol}-{token1.symbol}
          </TYPE.white>
          <div onClick={() => dispatch(updateUserAprMode({ userAprMode: !userAprMode }))}>
            {apy &&
              apy.greaterThan('0') &&
              (userAprMode ? (
                <TYPE.small className="apr" fontWeight={400} fontSize={14}>
                  {apy.denominator.toString() !== '0' ? `${apy.toFixed(0, { groupSeparator: ',' })}%` : '-'} APR
                </TYPE.small>
              ) : (
                <TYPE.small className="apr" fontWeight={400} fontSize={14}>
                  {apy.denominator.toString() !== '0' ? `${quarterlyAPY}%` : '-'} APY
                </TYPE.small>
              ))}
          </div>
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
        {apy && apy.greaterThan('0') && (
          <div onClick={() => dispatch(updateUserAprMode({ userAprMode: !userAprMode }))}>
            <PoolStatRow
              helperText={
                <>
                  Reward APR: {rewardApy?.toSignificant(4)}%<br />
                  Swap APR: {swapApy?.toSignificant(4)}%<br />
                </>
              }
              statName={`${userAprMode ? 'APR' : 'APY'}`}
              statValue={
                apy.denominator.toString() !== '0'
                  ? `${userAprMode ? apy.toFixed(0, { groupSeparator: ',' }) : quarterlyAPY}%`
                  : '-'
              }
            />
          </div>
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
    color: white;
  `}
  }
`
