import { gql, useQuery } from '@apollo/client'
import { useContractKit } from '@celo-tools/use-contractkit'
import { JSBI, Percent, TokenAmount } from '@ubeswap/sdk'
import CurrencyLogo from 'components/CurrencyLogo'
import { useToken } from 'hooks/Tokens'
import { useStakingContract } from 'hooks/useContract'
import { FarmSummary } from 'pages/Earn/useFarmRegistry'
import { useLPValue } from 'pages/Earn/useLPValue'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useSingleCallResult } from 'state/multicall/hooks'
import { updateUserAprMode } from 'state/user/actions'
import { useIsAprMode } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components'
import { fromWei, toBN, toWei } from 'web3-utils'

import { BIG_INT_SECONDS_IN_WEEK } from '../../constants'
import { CloseIcon, StyledInternalLink, TYPE } from '../../theme'
import { ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed } from '../Row'
import PoolStatRow from './PoolStats/PoolStatRow'
import RemoveFarmModal from './RemoveFarmModal'
import StakedAmountsHelper, { SingleStakedAmountsHelper } from './StakedAmountsHelper'
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
  overflow: unset;
  position: relative;
  background: ${({ bgColor }) => `radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor} 0%, #212429 100%) `};
  color: ${({ theme, showBackground }) => (showBackground ? theme.white : theme.text1)} !important;
  ${({ showBackground }) =>
    showBackground &&
    `  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);`}
`

const RemoveCardSection = styled.div`
  position: absolute;
  right: -10px;
  top: -10px;
  z-index: 10000;
  background: #252525;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  cursor: pointer;
  color: white;
  :hover {
    background: #2f2f2f;
  }
`

const TopSection = styled.div<{ singleToken: boolean }>`
  display: grid;
  grid-template-columns: ${({ singleToken }) => (singleToken ? '28px 1fr 120px' : '48px 1fr 120px')};
  grid-gap: 0px;
  align-items: center;
  padding: 1rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall<{ singleToken: boolean }>`
    grid-template-columns: ${({ singleToken }) => (singleToken ? '28px 1fr 96px' : '48px 1fr 96px')};
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
  onRemoveImportedFarm?: (farmAddress: string) => void
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
const COMPOUNDS_PER_YEAR = 2

export const PoolCard: React.FC<Props> = ({ farmSummary, onRemoveImportedFarm }: Props) => {
  const { t } = useTranslation()
  const { address } = useContractKit()
  const userAprMode = useIsAprMode()
  const dispatch = useDispatch()
  const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false)
  const token0 = useToken(farmSummary.token0Address) || undefined
  const token1 = useToken(farmSummary.token1Address) || undefined
  const { data, loading, error } = useQuery(pairDataGql, {
    variables: { id: farmSummary.lpAddress.toLowerCase() },
  })
  const theme = useTheme()

  const stakingContract = useStakingContract(farmSummary.stakingAddress)
  const stakedAmount = useSingleCallResult(stakingContract, 'balanceOf', [address || undefined]).result?.[0]
  const isStaking = Boolean(stakedAmount && stakedAmount.gt('0'))
  const stakedTokenAmount =
    isStaking && farmSummary.token0Address === farmSummary.token1Address && token0
      ? new TokenAmount(token0, JSBI.BigInt(stakedAmount))
      : undefined

  const { userValueCUSD, userAmountTokenA, userAmountTokenB } = useLPValue(stakedAmount ?? 0, farmSummary)
  let swapRewardsUSDPerYear = 0
  if (!loading && !error && data && data.pair) {
    const lastDayVolumeUsd = data.pair.pairHourData.reduce(
      (acc: number, curr: { hourlyVolumeUSD: string }) => acc + Number(curr.hourlyVolumeUSD),
      0
    )
    swapRewardsUSDPerYear = Math.floor(lastDayVolumeUsd * 365 * 0.0025)
  }
  const rewardApr = new Percent(farmSummary.rewardsUSDPerYear, farmSummary.tvlUSD)
  const swapApr = new Percent(toWei(swapRewardsUSDPerYear.toString()), farmSummary.tvlUSD)
  const apr = new Percent(
    toBN(toWei(swapRewardsUSDPerYear.toString())).add(toBN(farmSummary.rewardsUSDPerYear)).toString(),
    farmSummary.tvlUSD
  )

  let compoundedAPY: React.ReactNode | undefined = <>🤯</>
  if (!farmSummary.isImported) {
    try {
      compoundedAPY = annualizedPercentageYield(apr, COMPOUNDS_PER_YEAR)
    } catch (e) {
      console.error('apy calc overflow', farmSummary.farmName, e)
    }
  }

  const displayedPercentageReturn =
    apr.denominator.toString() !== '0'
      ? `${userAprMode ? apr.toFixed(0, { groupSeparator: ',' }) : compoundedAPY}%`
      : '-'

  const onRemoveFarm = () => {
    setShowRemoveModal(false)
    if (onRemoveImportedFarm) onRemoveImportedFarm(farmSummary.stakingAddress)
  }

  if (
    !farmSummary.isImported &&
    Number(fromWei(farmSummary.rewardsUSDPerYear)) < 100 &&
    !userValueCUSD?.greaterThan('0')
  ) {
    return null
  }

  const isSingleToken = !!token0 && !!token1 && token0.address === token1.address

  return (
    <Wrapper showBackground={isStaking} bgColor={farmSummary.isImported ? theme.bg5 : theme.primary1}>
      <RemoveFarmModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={() => onRemoveFarm()}
      />
      {farmSummary.isImported && !isStaking && (
        <RemoveCardSection>
          <CloseIcon onClick={() => setShowRemoveModal(true)} />
        </RemoveCardSection>
      )}
      <CardNoise />

      <TopSection singleToken={isSingleToken}>
        {isSingleToken ? (
          <CurrencyLogo currency={token0}></CurrencyLogo>
        ) : (
          <DoubleCurrencyLogo currency0={token0} currency1={token1} size={24} />
        )}
        <PoolInfo style={{ marginLeft: '8px' }}>
          {isSingleToken ? (
            <TYPE.white fontWeight={600} fontSize={[18, 24]}>
              {token0?.symbol}
            </TYPE.white>
          ) : (
            <TYPE.white fontWeight={600} fontSize={[18, 24]}>
              {token0?.symbol}-{token1?.symbol}
            </TYPE.white>
          )}
          {farmSummary.isImported ? (
            <>
              {farmSummary.totalRewardRates
                ?.filter((rewardRate) => rewardRate.greaterThan('0'))
                .map((rewardRate, idx) => (
                  <span key={idx}>
                    <TYPE.white>
                      <TYPE.small className="apr" fontWeight={400} fontSize={14}>
                        {rewardRate.multiply(BIG_INT_SECONDS_IN_WEEK)?.toSignificant(4, { groupSeparator: ',' }) +
                          ' ' +
                          rewardRate.token.symbol +
                          ' / Week'}{' '}
                        {'Pool Rate'}
                      </TYPE.small>
                    </TYPE.white>
                  </span>
                ))}
            </>
          ) : apr && apr.greaterThan('0') ? (
            <span
              aria-label="Toggle APR/APY"
              onClick={() => dispatch(updateUserAprMode({ userAprMode: !userAprMode }))}
            >
              <TYPE.white>
                <TYPE.small className="apr" fontWeight={400} fontSize={14}>
                  {displayedPercentageReturn} {userAprMode ? 'APR' : 'APY'}
                </TYPE.small>
              </TYPE.white>
            </span>
          ) : null}
        </PoolInfo>
        <StyledInternalLink
          to={`/farm/${isSingleToken ? token0?.address : token0?.address + '/' + token1?.address}/${
            farmSummary.stakingAddress
          }`}
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
        {farmSummary.isImported ? (
          <PoolStatRow
            statName={`Pool Rate`}
            statArrayValue={farmSummary.totalRewardRates
              ?.filter((rewardRate) => rewardRate.greaterThan('0'))
              .map(
                (rewardRate) =>
                  rewardRate.multiply(BIG_INT_SECONDS_IN_WEEK)?.toSignificant(4, { groupSeparator: ',' }) +
                  ' ' +
                  rewardRate.token.symbol +
                  ' / Week'
              )}
          />
        ) : apr && apr.greaterThan('0') ? (
          <div aria-label="Toggle APR/APY" onClick={() => dispatch(updateUserAprMode({ userAprMode: !userAprMode }))}>
            <PoolStatRow
              helperText={
                farmSummary.tvlUSD === '0' ? (
                  'Pool is empty'
                ) : (
                  <>
                    Reward APR: {rewardApr?.greaterThan('0') && rewardApr?.toSignificant(4)}%<br />
                    Swap APR: {swapApr?.greaterThan('0') && swapApr?.toSignificant(4)}%<br />
                    <small>APY assumes compounding {COMPOUNDS_PER_YEAR}/year</small>
                    <br />
                  </>
                )
              }
              statName={`${userAprMode ? 'APR' : 'APY'}`}
              statValue={displayedPercentageReturn}
            />
          </div>
        ) : null}
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
                    {'$' + userValueCUSD.toFixed(0, { groupSeparator: ',' })}
                  </TYPE.black>
                  {stakedTokenAmount ? (
                    <SingleStakedAmountsHelper userAmountToken={stakedTokenAmount} />
                  ) : (
                    <StakedAmountsHelper userAmountTokenA={userAmountTokenA} userAmountTokenB={userAmountTokenB} />
                  )}
                </RowFixed>
              </RowBetween>
            )}
          </BottomSection>
        </>
      )}
    </Wrapper>
  )
}

// formula is 1 + ((nom/compoundsPerYear)^compoundsPerYear) - 1
function annualizedPercentageYield(nominal: Percent, compounds: number) {
  const ONE = 1
  const divideNominalByNAddOne = nominal.divide(BigInt(compounds)).add(BigInt(ONE))
  if (Number(divideNominalByNAddOne.denominator) === 0 && Number(divideNominalByNAddOne.numerator) === 0) return '0'
  // multiply 100 to turn decimal into percent, to fixed since we only display integer
  return ((Number(divideNominalByNAddOne.toFixed(10)) ** compounds - ONE) * 100).toFixed(0)
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
