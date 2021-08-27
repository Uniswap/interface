import { Trans } from '@lingui/macro'
import { GreenBadge } from 'components/Badge'
import { ButtonPrimary } from 'components/Button'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Modal from 'components/Modal'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { BIG_INT_SECONDS_IN_WEEK } from 'constants/misc'
import { Incentive } from 'hooks/incentives/useAllIncentives'
import useTheme from 'hooks/useTheme'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { AlertCircle } from 'react-feather'
import styled from 'styled-components/macro'
import { CloseIcon, TYPE } from 'theme'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import Countdown from './Countdown'

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
`

export const DarkerGreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.bg1};
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  incentive: Incentive
}

export default function StakingModal({ isOpen, onDismiss, incentive }: StakingModalProps) {
  const theme = useTheme()
  const startDate = new Date(incentive.startTime * 1000)
  const endDate = new Date(incentive.endTime * 1000)

  const weeklyRewards = incentive.rewardRatePerSecond.multiply(BIG_INT_SECONDS_IN_WEEK)
  const weeklyRewardsUSD = useUSDCValue(weeklyRewards)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <Wrapper>
        <AutoColumn gap="lg">
          <RowBetween>
            <TYPE.body fontSize="20px" fontWeight={600}>
              <Trans>Review Position Staking</Trans>
            </TYPE.body>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <DarkerGreyCard>
            <AutoColumn gap="md">
              <RowBetween>
                <RowFixed>
                  <CurrencyLogo currency={incentive.initialRewardAmount.currency} />
                  <TYPE.body
                    m="0 12px"
                    fontSize="16px"
                  >{`${incentive.initialRewardAmount.currency.symbol} Boost`}</TYPE.body>
                </RowFixed>
                <Countdown exactEnd={endDate} exactStart={startDate} />
              </RowBetween>
              <AutoColumn gap="8px">
                <TYPE.main color={theme.text2} fontWeight={400} fontSize="11px">
                  <Trans>YOUR ESTIMATED REWARDS</Trans>
                </TYPE.main>
                {weeklyRewardsUSD ? (
                  <span>
                    <TYPE.body>{`$${weeklyRewardsUSD.toFixed(2)} per week`}</TYPE.body>
                    <TYPE.body>{`~(${formatCurrencyAmount(weeklyRewards, 4)})`}</TYPE.body>
                  </span>
                ) : (
                  <TYPE.body>{`${formatCurrencyAmount(weeklyRewards, 4)} ${
                    weeklyRewards.currency.symbol
                  } per week`}</TYPE.body>
                )}
              </AutoColumn>
            </AutoColumn>
          </DarkerGreyCard>
          <TYPE.body fontSize="11px" fontWeight={500}>
            <Trans>
              Boosting liquidity deposits your liquidity in the Uniswap Liquidity mining contracts. When boosted, your
              liquidity will continue to earn fees while in range. You must remove boosts to be able to claim fees or
              withdraw liquidity.
            </Trans>
          </TYPE.body>
          <ButtonPrimary padding="8px" $borderRadius="12px">
            <Trans>Join Programs</Trans>
          </ButtonPrimary>
        </AutoColumn>
      </Wrapper>
    </Modal>
  )
}

interface ClaimModalProps {
  incentives: Incentive[]
  isOpen: boolean
  onDismiss: () => void
}

export function ClaimModal({ incentives, isOpen, onDismiss }: ClaimModalProps) {
  /**
   * @TODO
   * real claim amounts
   */

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <Wrapper>
        <AutoColumn gap="md">
          <RowBetween>
            <TYPE.body fontSize="20px" fontWeight={600}>
              <Trans>Claim Rewards</Trans>
            </TYPE.body>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <DarkerGreyCard>
            <AutoColumn gap="md" justify="center">
              <TYPE.body ml="12px" fontSize="11px" fontWeight={400}>
                <Trans>TOTAL UNCLAIMED REWARDS</Trans>
              </TYPE.body>
              {incentives.map((incentive, i) => (
                <AutoRow gap="8px" key={'reward-row' + i} width="fit-content">
                  <CurrencyLogo currency={incentive.initialRewardAmount.currency} size="24px" />
                  <TYPE.body fontSize="20px" fontWeight={500}>
                    {formatCurrencyAmount(incentive.initialRewardAmount, 5)}
                  </TYPE.body>
                  <TYPE.body fontSize="20px" fontWeight={500}>
                    {incentive.initialRewardAmount.currency.symbol}
                  </TYPE.body>
                </AutoRow>
              ))}
            </AutoColumn>
          </DarkerGreyCard>
          <ButtonPrimary padding="8px" $borderRadius="12px">
            <Trans>Claim</Trans>
          </ButtonPrimary>
          <DarkerGreyCard>
            <RowBetween>
              <AlertCircle size={60} />
              <TYPE.body ml="12px" fontSize="12px" fontWeight={500}>
                <Trans>
                  Claiming rewards withdraws the rewards into your wallet. Your liquidity remains staked and will
                  continue to earn fees when in range.
                </Trans>
              </TYPE.body>
            </RowBetween>
          </DarkerGreyCard>
        </AutoColumn>
      </Wrapper>
    </Modal>
  )
}

interface UnstakeModalProps {
  incentives: Incentive[]
  isOpen: boolean
  onDismiss: () => void
}

export function UnstakeModal({ incentives, isOpen, onDismiss }: UnstakeModalProps) {
  /**
   * @TODO
   * real claim amounts
   */

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <Wrapper>
        <AutoColumn gap="md">
          <RowBetween>
            <TYPE.body fontSize="20px" fontWeight={600}>
              <Trans>Unstake Rewards</Trans>
            </TYPE.body>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <GreenBadge style={{ padding: '16px' }}>
            <AutoColumn gap="sm" justify="center">
              <AlertCircle size={20} />
              <TYPE.body fontWeight={500} fontSize="14px" style={{ whiteSpace: 'normal' }} textAlign="center">
                <Trans>
                  You are unstaking your liquidty! You can now remove your position or claim regular liquidity provider
                  fees.
                </Trans>
              </TYPE.body>
            </AutoColumn>
          </GreenBadge>
          <DarkerGreyCard>
            <AutoColumn gap="md" justify="center">
              <TYPE.body ml="12px" fontSize="11px" fontWeight={400}>
                <Trans>TOTAL UNCLAIMED REWARDS</Trans>
              </TYPE.body>
              {incentives.map((incentive, i) => (
                <AutoRow gap="8px" key={'reward-row' + i} width="fit-content">
                  <CurrencyLogo currency={incentive.initialRewardAmount.currency} size="24px" />
                  <TYPE.body fontSize="20px" fontWeight={500}>
                    {formatCurrencyAmount(incentive.initialRewardAmount, 5)}
                  </TYPE.body>
                  <TYPE.body fontSize="20px" fontWeight={500}>
                    {incentive.initialRewardAmount.currency.symbol}
                  </TYPE.body>
                </AutoRow>
              ))}
            </AutoColumn>
          </DarkerGreyCard>
          <ButtonPrimary padding="8px" $borderRadius="12px">
            <Trans>Unstake and Claim</Trans>
          </ButtonPrimary>
        </AutoColumn>
      </Wrapper>
    </Modal>
  )
}
