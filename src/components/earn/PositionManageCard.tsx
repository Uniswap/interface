import { Trans } from '@lingui/macro'
import { Pool } from '@uniswap/v3-sdk'
import Badge, { GenericBadge, GreenBadge } from 'components/Badge'
import { ButtonLightGray, ButtonGreySmall, ButtonPrimary, ButtonSmall } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import AppleToggle from 'components/Toggle/AppleToggle'
import { BIG_INT_ZERO } from 'constants/misc'
import { Incentive, useIncentivesForPool } from 'hooks/incentives/useAllIncentives'
import { useIsPositionDeposited } from 'hooks/incentives/useDepositedTokenIds'
import { useToken } from 'hooks/Tokens'
import { usePool } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Lock, Zap } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { HoverText, TYPE } from 'theme'
import { PositionDetails } from 'types/position'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { unwrappedToken } from 'utils/unwrappedToken'
import { Break } from './styled'
import StakingModal, { ClaimModal, UnstakeModal } from './StakingModal'
import RangeStatus from 'components/RangeStatus'
import useCountdownTime from 'hooks/useCountdownTime'

const Wrapper = styled.div<{ open?: boolean }>`
  width: 100%;
  border: 1px solid ${({ theme, open }) => (open ? theme.blue3 : theme.bg3)};
  border-radius: 12px;
  padding: 16px;
`

const HoverRow = styled(RowBetween)`
  :hover {
    cursor: pointer;
    opacity: 0.8;
  }
`

const DynamicSection = styled.div<{ disabled?: boolean }>`
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'inherit')};
`

interface BoostStatusRowProps {
  incentive: Incentive
}

function BoostStatusRow({ incentive }: BoostStatusRowProps) {
  const theme = useTheme()

  const rewardCurrency = incentive.initialRewardAmount.currency
  /**
   * @TODO make these real
   */
  const availableClaim = incentive.initialRewardAmount
  const weeklyRewards = incentive.initialRewardAmount
  const isStaked = false

  const [attemptingUnstake, setAttemptingUnstake] = useState(false)

  // get countdown info if needed to display for future start time
  const startDate = new Date(incentive.startTime * 1000)
  const endDate = new Date(incentive.endTime * 1000)
  const beginsInFuture = incentive.startTime > Date.now() / 1000
  const ended = incentive.endTime < Date.now() / 1000
  const countdownTimeText = useCountdownTime(startDate, endDate)

  const handleToggleStakeOn = () => {
    setAttemptingUnstake(true)
    console.log('toggle on')
  }

  const [showModal, setShowModal] = useState(false)

  return (
    <RowBetween>
      <ClaimModal isOpen={showModal} onDismiss={() => setShowModal(false)} incentives={[incentive]} />
      <RowFixed>
        <CurrencyLogo currency={rewardCurrency} />
        <TYPE.body m="0 12px" fontSize="20px" fontWeight={500}>{`${formatCurrencyAmount(availableClaim, 5)} ${
          rewardCurrency.symbol
        }`}</TYPE.body>
        {}
        {ended ? (
          <GenericBadge style={{ backgroundColor: theme.yellow3 }}>
            <TYPE.body color={theme.black}>
              <Trans>Ended</Trans>
            </TYPE.body>
          </GenericBadge>
        ) : (
          <Badge>{`~ ${formatCurrencyAmount(weeklyRewards, 5)} ${rewardCurrency.symbol} / Week `}</Badge>
        )}
        {beginsInFuture ? (
          <RowFixed style={{ marginLeft: '16px' }}>
            <GreenBadge>
              <TYPE.body fontWeight={700} color={theme.green2} fontSize="12px">
                NEW
              </TYPE.body>
            </GreenBadge>
            <TYPE.main fontSize="12px" fontStyle="italic" ml="8px">
              {countdownTimeText}
            </TYPE.main>
          </RowFixed>
        ) : null}
      </RowFixed>
      <AutoRow gap="8px" width="fit-content">
        {availableClaim.greaterThan(BIG_INT_ZERO) ? (
          <ButtonGreySmall onClick={() => setShowModal(true)}>
            <Trans>Claim</Trans>
          </ButtonGreySmall>
        ) : null}
        <AppleToggle isActive={isStaked && !attemptingUnstake} toggle={handleToggleStakeOn} />
      </AutoRow>
    </RowBetween>
  )
}

interface PositionManageCardProps {
  positionDetails: PositionDetails
  isPositionPage?: boolean
}

export default function PositionManageCard({ positionDetails, isPositionPage }: PositionManageCardProps) {
  const theme = useTheme()

  const { token0: token0Address, token1: token1Address, fee: feeAmount } = positionDetails

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  // incentives for this pool
  const poolAddress = pool ? Pool.getAddress(pool.token0, pool.token1, pool.fee) : undefined
  const { incentives, loading: incentivesLoading } = useIncentivesForPool(poolAddress)

  // toggle open state
  const [open, setOpen] = useState(false)

  // amount of programs where position is staked
  const amountBoosted = incentives
    ? incentives.reduce((accum) => {
        /**
         * @TODO get data about which positions are staked
         */
        accum += 0
        // accum += 1
        return accum
      }, 0)
    : 0

  /**
   * @TODO group incentives based on boosted or now for counts
   */
  // amount of programs where position is not staked
  // const amountAvailable = incentives ? incentives.length - amountBoosted : 0
  const amountAvailable = incentives ? incentives.length : 0

  // check if position is deposited into staker contract
  const isDeposited = useIsPositionDeposited(positionDetails)

  /**
   * @TODO
   */
  const totalUnclaimedUSD = 0.023

  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [showUnstakeModal, setShowUnstakeModal] = useState(false)

  return (
    <Wrapper open={open || isPositionPage}>
      <StakingModal
        isOpen={showStakingModal}
        onDismiss={() => setShowStakingModal(false)}
        incentives={incentives}
        positionDetails={positionDetails}
      />
      <ClaimModal isOpen={showClaimModal} onDismiss={() => setShowClaimModal(false)} incentives={incentives} />
      <UnstakeModal isOpen={showUnstakeModal} onDismiss={() => setShowUnstakeModal(false)} incentives={incentives} />
      {incentives ? (
        isPositionPage ? (
          <RowBetween>
            <RowFixed>
              <Zap strokeWidth="3px" color={theme.blue3} size="16px" />
              <TYPE.body ml="8px" fontWeight={500} color={theme.blue3}>
                Position is Staked
              </TYPE.body>
            </RowFixed>
            <ButtonSmall as={Link} to={'/stake/' + poolAddress}>
              <Trans>Manage</Trans>
            </ButtonSmall>
          </RowBetween>
        ) : (
          <HoverRow onClick={() => setOpen(!open)}>
            <RangeStatus positionDetails={positionDetails} />
            <RowFixed height="36px">
              {amountBoosted > 0 && !open ? (
                <GreenBadge>
                  <RowFixed style={{ flexWrap: 'nowrap' }}>
                    <Zap strokeWidth="3px" color={theme.green2} size="14px" />
                    <TYPE.body ml="4px" fontWeight={700} color={theme.green2} fontSize="12px">
                      <Trans>Boosted</Trans>
                    </TYPE.body>
                    {incentives.map((incentive, i) => (
                      <CurrencyLogo
                        key={'incentive-logo-' + i}
                        size="20px"
                        style={{ marginLeft: '6px' }}
                        currency={incentive.initialRewardAmount.currency}
                      />
                    ))}
                  </RowFixed>
                </GreenBadge>
              ) : null}
              {amountAvailable > 0 && !open ? (
                <GreenBadge>
                  <RowFixed style={{ flexWrap: 'nowrap' }}>
                    <Zap strokeWidth="3px" color={theme.green2} size="14px" />
                    <TYPE.body ml="4px" fontWeight={700} color={theme.green2} fontSize="12px">
                      <Trans>Boosts available</Trans>
                    </TYPE.body>
                    {incentives.map((incentive, i) => (
                      <CurrencyLogo
                        key={'incentive-logo-' + i}
                        size="20px"
                        style={{ marginLeft: '6px' }}
                        currency={incentive.initialRewardAmount.currency}
                      />
                    ))}
                  </RowFixed>
                </GreenBadge>
              ) : null}
              <HoverText>
                {!open ? (
                  <ChevronDown
                    size="28px"
                    color={theme.text3}
                    style={{ marginLeft: '4px' }}
                    onClick={() => setOpen(!open)}
                  />
                ) : (
                  <ChevronUp
                    size="28px"
                    color={theme.text3}
                    style={{ marginLeft: '4px' }}
                    onClick={() => setOpen(!open)}
                  />
                )}
              </HoverText>
            </RowFixed>
          </HoverRow>
        )
      ) : (
        <Loader />
      )}
      {open || isPositionPage ? (
        incentivesLoading ? (
          <Loader />
        ) : !incentives || incentives.length === 0 ? (
          <TYPE.body>No boosts for this pool.</TYPE.body>
        ) : (
          <AutoColumn gap="24px" style={{ marginTop: '20px' }}>
            <Break />
            {isDeposited ? (
              <RowBetween>
                <AutoColumn gap="sm">
                  <TYPE.body fontSize="12px" color={theme.text3}>
                    <Trans>TOTAL UNCLAIMED REWARDS</Trans>
                  </TYPE.body>
                  <TYPE.body fontSize="36px" color={theme.green1} fontWeight={500}>
                    <Trans>${totalUnclaimedUSD}</Trans>
                  </TYPE.body>
                </AutoColumn>
                <AutoRow gap="8px" width="fit-content">
                  <ButtonSmall onClick={() => setShowClaimModal(true)}>
                    <Trans>Claim All</Trans>
                  </ButtonSmall>
                  <ButtonSmall onClick={() => setShowUnstakeModal(true)}>
                    <Trans>Unstake and Claim All</Trans>
                  </ButtonSmall>
                </AutoRow>
              </RowBetween>
            ) : (
              <ButtonPrimary padding="12px" $borderRadius="12px" onClick={() => setShowStakingModal(true)}>
                <RowFixed>
                  <Lock height="16px" style={{ marginRight: '4px' }} />
                  <Trans>Unlock & Join</Trans>
                </RowFixed>
              </ButtonPrimary>
            )}
            <DynamicSection disabled={!isDeposited}>
              <AutoColumn gap="16px">
                {incentives.map((incentive, i) => (
                  <BoostStatusRow key={'boost-status' + i} incentive={incentive} />
                ))}
              </AutoColumn>
            </DynamicSection>
            {isPositionPage ? null : (
              <ButtonLightGray as={Link} to={'/pool/' + positionDetails.tokenId}>
                <Trans>View position details →</Trans>
              </ButtonLightGray>
            )}
          </AutoColumn>
        )
      ) : null}
    </Wrapper>
  )
}
