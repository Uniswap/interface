import { Trans } from '@lingui/macro'
import { Pool } from '@uniswap/v3-sdk'
import Badge, { GreenBadge } from 'components/Badge'
import { ButtonLightGray, ButtonGreySmall, ButtonPrimary, ButtonSmall } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import AppleToggle from 'components/Toggle/AppleToggle'
import { BIG_INT_ZERO } from 'constants/misc'
import { BigNumber } from 'ethers'
import { Incentive, useIncentivesForPool } from 'hooks/incentives/useAllIncentives'
import { DepositedTokenIdsState, useDepositedTokenIds } from 'hooks/incentives/useDepositedTokenIds'
import { useToken } from 'hooks/Tokens'
import { usePool } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import { useActiveWeb3React } from 'hooks/web3'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Lock, Zap } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { HoverText, TYPE } from 'theme'
import { PositionDetails } from 'types/position'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { unwrappedToken } from 'utils/unwrappedToken'
import { Break } from './styled'
import StakingModal from './StakingModal'
import RangeStatus from 'components/RangeStatus'

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
  user-select: ${({ disabled }) => (disabled ? 'none' : 'inherit')};
`

interface BoostStatusRowProps {
  incentive: Incentive
  positionDetails: PositionDetails
}

function BoostStatusRow({ incentive, positionDetails }: BoostStatusRowProps) {
  const rewardCurrency = incentive.initialRewardAmount.currency
  /**
   * @TODO make these real
   */
  const availableClaim = incentive.initialRewardAmount
  const weeklyRewards = incentive.initialRewardAmount
  const isStaked = false

  const [attemptingUnstake, setAttemptingUnstake] = useState(false)

  const handleToggleStakeOn = () => {
    setAttemptingUnstake(true)
    console.log('toggle on')
  }

  const handleToggleStakeOff = () => {
    console.log('toggle on')
  }

  return (
    <RowBetween>
      <RowFixed>
        <CurrencyLogo currency={rewardCurrency} />
        <TYPE.body m="0 12px" fontSize="20px">{`${formatCurrencyAmount(availableClaim, 5)} ${
          rewardCurrency.symbol
        }`}</TYPE.body>
        <Badge>{`~ ${formatCurrencyAmount(weeklyRewards, 5)} ${rewardCurrency.symbol} / Week `}</Badge>
      </RowFixed>
      <AutoRow gap="8px" width="fit-content">
        {availableClaim.greaterThan(BIG_INT_ZERO) ? (
          <ButtonGreySmall>
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
}

export default function PositionManageCard({ positionDetails }: PositionManageCardProps) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()

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
    ? incentives.reduce((accum, incentive) => {
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

  const { state, tokenIds } = useDepositedTokenIds(account)

  // check if position is deposited into staker contract
  const isDeposited = Boolean(
    state === DepositedTokenIdsState.LOADED &&
      tokenIds &&
      tokenIds.find((id) => BigNumber.from(id.toString()).eq(positionDetails.tokenId))
  )

  /**
   * @TODO
   */
  const totalUnclaimedUSD = 0.023

  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)

  return (
    <Wrapper open={open}>
      <StakingModal
        isOpen={showStakingModal}
        onDismiss={() => setShowStakingModal(false)}
        incentives={incentives}
        positionDetails={positionDetails}
      />
      {incentives ? (
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
      ) : (
        <Loader />
      )}
      {open ? (
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
                  <ButtonSmall>
                    <Trans>Claim All</Trans>
                  </ButtonSmall>
                  <ButtonSmall>
                    <Trans>Unstake</Trans>
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
                  <BoostStatusRow key={'boost-status' + i} incentive={incentive} positionDetails={positionDetails} />
                ))}
              </AutoColumn>
            </DynamicSection>
            <ButtonLightGray as={Link} to={'/pool/' + positionDetails.tokenId}>
              <Trans>View position details →</Trans>
            </ButtonLightGray>
          </AutoColumn>
        )
      ) : null}
    </Wrapper>
  )
}
