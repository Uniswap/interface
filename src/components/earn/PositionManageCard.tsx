import { Trans } from '@lingui/macro'
import Badge from 'components/Badge'
import { ButtonSmall } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { BIG_INT_ZERO } from 'constants/misc'
import { Incentive } from 'hooks/incentives/useAllIncentives'
import useTheme from 'hooks/useTheme'
import { useMemo, useState } from 'react'
import { Zap } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { PositionDetails } from 'types/position'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import StakingModal, { ClaimModal, UnstakeModal } from './StakingModal'
import RangeStatus from 'components/RangeStatus'
import { BigNumber } from 'ethers'

const Wrapper = styled.div`
  width: 100%;
`

const PositionWrapper = styled.div<{ staked?: boolean }>`
  width: 100%;
  border: 1px solid ${({ theme, staked }) => (staked ? theme.blue3 : theme.bg3)};
  border-radius: 12px;
  padding: 16px;
`

interface BoostStatusRowProps {
  incentive: Incentive
  positionDetails: PositionDetails
  unstaked?: boolean
  isPositionPage?: boolean
}

function BoostStatusRow({ incentive, positionDetails, unstaked, isPositionPage }: BoostStatusRowProps) {
  const theme = useTheme()

  const rewardCurrency = incentive.initialRewardAmount.currency

  const availableClaim = incentive.initialRewardAmount
  const weeklyRewards = incentive.initialRewardAmount
  const totalUnclaimedUSD = 0

  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [showUnstakeModal, setShowUnstakeModal] = useState(false)

  // if unstaked - show minimal UI
  if (unstaked) {
    return (
      <PositionWrapper>
        <RowBetween>
          <RangeStatus positionDetails={positionDetails} />
          <ButtonSmall>
            <Trans>Stake Position</Trans>
          </ButtonSmall>
        </RowBetween>
      </PositionWrapper>
    )
  }

  return (
    <PositionWrapper staked={true}>
      <RowBetween>
        <StakingModal
          isOpen={showStakingModal}
          onDismiss={() => setShowStakingModal(false)}
          incentives={[incentive]}
          positionDetails={positionDetails}
        />
        <ClaimModal isOpen={showClaimModal} onDismiss={() => setShowClaimModal(false)} incentives={[incentive]} />
        <UnstakeModal isOpen={showUnstakeModal} onDismiss={() => setShowUnstakeModal(false)} incentives={[incentive]} />
        <AutoColumn gap="16px" style={{ width: '100%' }}>
          {isPositionPage ? (
            <RowBetween>
              <RowFixed>
                <Zap strokeWidth="3px" color={theme.blue3} size="16px" />
                <TYPE.body ml="8px" fontWeight={500} color={theme.blue3}>
                  Position is Staked
                </TYPE.body>
              </RowFixed>
              <ButtonSmall as={Link} to={'/stake/' + incentive.poolAddress}>
                <Trans>Manage</Trans>
              </ButtonSmall>
            </RowBetween>
          ) : null}
          {isPositionPage ? null : <RangeStatus positionDetails={positionDetails} />}
          <TYPE.body fontSize="11px" color={theme.text3}>
            <Trans>UNCLAIMED REWARDS</Trans>
          </TYPE.body>
          <RowBetween>
            <RowFixed>
              <TYPE.body fontSize="24px" color={theme.green1} fontWeight={500}>
                <Trans>
                  {totalUnclaimedUSD
                    ? '$' + totalUnclaimedUSD
                    : `${formatCurrencyAmount(availableClaim, 5)} ${rewardCurrency.symbol}`}
                </Trans>
              </TYPE.body>
              <Badge style={{ margin: '0 12px' }}>
                <CurrencyLogo currency={rewardCurrency} size="20px" />
                <TYPE.body m="0 12px" fontSize="15px" fontWeight={500}>
                  {`~ ${formatCurrencyAmount(weeklyRewards, 5)} ${rewardCurrency.symbol} / Week `}
                </TYPE.body>
              </Badge>
            </RowFixed>
            <AutoRow gap="8px" width="fit-content">
              {availableClaim.greaterThan(BIG_INT_ZERO) ? (
                <ButtonSmall onClick={() => setShowClaimModal(true)}>
                  <Trans>Claim</Trans>
                </ButtonSmall>
              ) : null}
              <ButtonSmall onClick={() => setShowUnstakeModal(true)}>
                <Trans>Unstake</Trans>
              </ButtonSmall>
            </AutoRow>
          </RowBetween>
        </AutoColumn>
      </RowBetween>
    </PositionWrapper>
  )
}

interface PositionManageCardProps {
  positionDetails: PositionDetails
  isPositionPage?: boolean
}

export default function PositionManageCard({ positionDetails, isPositionPage }: PositionManageCardProps) {
  const { stakes } = positionDetails

  // filter incentives that are staked and unstaked
  const [staked, unstaked] = useMemo(
    () =>
      stakes.slice(0, 1).reduce(
        (accum: Incentive[][], stake) => {
          if (stake.liquidity.gt(BigNumber.from(0))) {
            accum[0].push(stake.incentive)
          } else {
            accum[1].push(stake.incentive)
          }
          return accum
        },
        [[], []]
      ),
    [stakes]
  )

  return (
    <Wrapper>
      <AutoColumn gap="16px">
        {staked.map((incentive, i) => (
          <BoostStatusRow
            key={'boost-status' + i}
            incentive={incentive}
            positionDetails={positionDetails}
            isPositionPage={isPositionPage}
          />
        ))}
        {unstaked.map((incentive, i) => {
          return (
            <BoostStatusRow
              key={'boost-status' + i}
              incentive={incentive}
              positionDetails={positionDetails}
              unstaked={true}
              isPositionPage={isPositionPage}
            />
          )
        })}
      </AutoColumn>
    </Wrapper>
  )
}
