import { gql, useQuery } from '@apollo/client'
import { useContractKit } from '@celo-tools/use-contractkit'
import { Percent } from '@ubeswap/sdk'
import QuestionHelper from 'components/QuestionHelper'
import { useToken } from 'hooks/Tokens'
import { useStakingContract } from 'hooks/useContract'
import { FarmSummary } from 'pages/Earn/useFarmRegistry'
import { useLPValue } from 'pages/Earn/useLPValue'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useSingleCallResult } from 'state/multicall/hooks'
import { updateUserAprMode } from 'state/user/actions'
import { useIsAprMode } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components'
import { fromWei, toBN, toWei } from 'web3-utils'

import { StyledInternalLink, TYPE } from '../../theme'
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
  farmSummary: FarmSummary
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

export const PoolCard: React.FC<Props> = ({ farmSummary }: Props) => {
  const { t } = useTranslation()
  const { address } = useContractKit()
  const userAprMode = useIsAprMode()
  const dispatch = useDispatch()
  const token0 = useToken(farmSummary.token0Address) || undefined
  const token1 = useToken(farmSummary.token1Address) || undefined
  const { data, loading, error } = useQuery(pairDataGql, {
    variables: { id: farmSummary.lpAddress.toLowerCase() },
  })
  const theme = useTheme()

  const stakingContract = useStakingContract(farmSummary.stakingAddress)
  const stakedAmount = useSingleCallResult(stakingContract, 'balanceOf', [address || undefined]).result?.[0]
  const isStaking = Boolean(stakedAmount && stakedAmount.gt('0'))

  const { userValueCUSD, userAmountTokenA, userAmountTokenB } = useLPValue(stakedAmount ?? 0, farmSummary)
  let swapRewardsUSDPerYear = 0
  if (!loading && !error && data) {
    const lastDayVolumeUsd = data.pair.pairHourData.reduce(
      (acc: number, curr: { hourlyVolumeUSD: string }) => acc + Number(curr.hourlyVolumeUSD),
      0
    )
    swapRewardsUSDPerYear = Math.floor(lastDayVolumeUsd * 365 * 0.0025)
  }
  const rewardApy = new Percent(farmSummary.rewardsUSDPerYear, farmSummary.tvlUSD)
  const swapApy = new Percent(toWei(swapRewardsUSDPerYear.toString()), farmSummary.tvlUSD)
  const apy = new Percent(
    toBN(toWei(swapRewardsUSDPerYear.toString())).add(toBN(farmSummary.rewardsUSDPerYear)).toString(),
    farmSummary.tvlUSD
  )

  let quarterlyAPY: React.ReactNode | undefined = <>🤯</>
  try {
    quarterlyAPY = apy
      ? new Percent(
          Math.floor(parseFloat(apy.divide('2').add('1').toFixed(10)) ** 2 * 1_000_000).toFixed(0),
          '1000000'
        ).toFixed(0, { groupSeparator: ',' })
      : undefined
  } catch (e) {
    console.error('Weekly apy overflow', e)
  }

  return (
    <Wrapper showBackground={isStaking} bgColor={theme.primary1}>
      <CardNoise />

      <TopSection>
        <DoubleCurrencyLogo currency0={token0} currency1={token1} size={24} />
        <PoolInfo style={{ marginLeft: '8px' }}>
          <TYPE.white fontWeight={600} fontSize={[18, 24]}>
            {token0?.symbol}-{token1?.symbol}
          </TYPE.white>
          {apy && apy.greaterThan('0') && (
            <TYPE.small className="apr" fontWeight={400} fontSize={14}>
              {apy.denominator.toString() !== '0' ? `${quarterlyAPY}%` : '-'} APY
            </TYPE.small>
          )}
        </PoolInfo>

        <StyledInternalLink
          to={`/farm/${token0?.address}/${token1?.address}/${farmSummary.stakingAddress}`}
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
          statValue={Number(fromWei(farmSummary.tvlUSD)).toLocaleString(undefined, {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          })}
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
  `}
  }
`
