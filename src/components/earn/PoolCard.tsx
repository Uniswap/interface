import { useCelo } from '@celo/react-celo'
import { formatEther } from '@ethersproject/units'
import { JSBI, TokenAmount } from '@ubeswap/sdk'
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

const COMPOUNDS_PER_YEAR = 2

export const PoolCard: React.FC<Props> = ({ farmSummary, onRemoveImportedFarm }: Props) => {
  const { t } = useTranslation()
  const { address } = useCelo()
  const userAprMode = useIsAprMode()
  const dispatch = useDispatch()
  const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false)
  const token0 = useToken(farmSummary.token0Address) || undefined
  const token1 = useToken(farmSummary.token1Address) || undefined

  const theme = useTheme()

  const stakingContract = useStakingContract(farmSummary.stakingAddress)
  const stakingTokenAddress = useSingleCallResult(stakingContract, 'stakingToken', [])?.result?.[0]
  const stakingToken = useToken(stakingTokenAddress)
  const stakedAmount = useSingleCallResult(stakingContract, 'balanceOf', [address || undefined]).result?.[0]
  const isStaking = Boolean(stakedAmount && stakedAmount.gt('0'))
  const stakedTokenAmount =
    isStaking && stakingToken ? new TokenAmount(stakingToken, JSBI.BigInt(stakedAmount)) : undefined

  const { userValueCUSD, userAmountTokenA, userAmountTokenB } = useLPValue(
    stakedAmount ?? 0,
    farmSummary,
    token0,
    token1,
    stakingToken ?? undefined
  )

  const displayedPercentageReturn = farmSummary.apr
    ? farmSummary.apr.denominator.toString() !== '0'
      ? `${userAprMode ? farmSummary.apr.toFixed(0, { groupSeparator: ',' }) : farmSummary.apy}%`
      : '-'
    : '-'

  const onRemoveFarm = () => {
    setShowRemoveModal(false)
    if (onRemoveImportedFarm) onRemoveImportedFarm(farmSummary.stakingAddress)
  }

  if (
    !farmSummary.isImported &&
    Number(formatEther(farmSummary.rewardsUSDPerYear)) < 100 &&
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
          <CurrencyLogo currency={stakingToken ?? undefined}></CurrencyLogo>
        ) : (
          <DoubleCurrencyLogo currency0={token0} currency1={token1} size={24} />
        )}
        <PoolInfo style={{ marginLeft: '8px' }}>
          {isSingleToken ? (
            <TYPE.white fontWeight={600} fontSize={[18, 24]}>
              {stakingToken?.symbol}
            </TYPE.white>
          ) : (
            <TYPE.white fontWeight={600} fontSize={[18, 24]}>
              {token0?.symbol}-{token1?.symbol}
            </TYPE.white>
          )}
          {farmSummary.apr && farmSummary.apr.greaterThan('0') && farmSummary.tvlUSD?.gt('0') ? (
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
          ) : farmSummary.isImported ? (
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
          ) : null}
        </PoolInfo>
        <StyledInternalLink
          to={`/farm/${isSingleToken ? stakingToken?.address : token0?.address + '/' + token1?.address}/${
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
          statValue={
            farmSummary.tvlUSD
              ? Number(formatEther(farmSummary.tvlUSD)).toLocaleString(undefined, {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })
              : farmSummary.totalStakedAmount
              ? `${Number(farmSummary.totalStakedAmount.toFixed(0)).toLocaleString(undefined, {
                  style: 'decimal',
                  maximumFractionDigits: 0,
                })} ${stakingToken?.symbol}`
              : '-'
          }
        />
        {farmSummary.apr && farmSummary.apr.greaterThan('0') && farmSummary.tvlUSD?.gt('0') ? (
          <div aria-label="Toggle APR/APY" onClick={() => dispatch(updateUserAprMode({ userAprMode: !userAprMode }))}>
            <PoolStatRow
              helperText={
                farmSummary.tvlUSD?.isZero() ? (
                  'Pool is empty'
                ) : (
                  <>
                    Reward APR: {farmSummary.rewardApr?.greaterThan('0') && farmSummary.rewardApr?.toSignificant(4)}%
                    <br />
                    Swap APR: {farmSummary.swapApr?.greaterThan('0') && farmSummary.swapApr?.toSignificant(4)}%<br />
                    <small>APY assumes compounding {COMPOUNDS_PER_YEAR}/year</small>
                    <br />
                  </>
                )
              }
              statName={`${userAprMode ? 'APR' : 'APY'}`}
              statValue={displayedPercentageReturn}
            />
          </div>
        ) : farmSummary.isImported ? (
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
        ) : null}
      </StatContainer>

      {isStaking && (
        <>
          <Break />
          <BottomSection showBackground={true}>
            {stakedTokenAmount && (
              <RowBetween>
                <TYPE.black color={'white'} fontWeight={500}>
                  <span>Your stake</span>
                </TYPE.black>

                <RowFixed>
                  <TYPE.black style={{ textAlign: 'right' }} color={'white'} fontWeight={500}>
                    {userValueCUSD
                      ? '$' + userValueCUSD.toFixed(0, { groupSeparator: ',' })
                      : `${stakedTokenAmount.toFixed(0, { groupSeparator: ',' })} ${stakingToken?.symbol}`}
                  </TYPE.black>
                  {isSingleToken ? (
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

const PoolInfo = styled.div`
  .apr {
    margin-top: 4px;
    display: none;
    ${({ theme }) => theme.mediaWidth.upToSmall`
  display: block;
  `}
  }
`
