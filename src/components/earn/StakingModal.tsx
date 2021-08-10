import { Trans } from '@lingui/macro'
import { GreenBadge } from 'components/Badge'
import { ButtonPrimary } from 'components/Button'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import RangeStatus from 'components/RangeStatus'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import AppleToggle from 'components/Toggle/AppleToggle'
import { Incentive } from 'hooks/incentives/useAllIncentives'
import useTheme from 'hooks/useTheme'
import { useCallback } from 'react'
import { AlertCircle } from 'react-feather'
import styled from 'styled-components/macro'
import { CloseIcon, TYPE } from 'theme'
import { PositionDetails } from 'types/position'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
`

const RangeWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 32px 0;
`

export const DarkerGreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.bg1};
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  positionDetails: PositionDetails | undefined
  incentives: Incentive[] | undefined
}

export default function StakingModal({ isOpen, onDismiss, positionDetails, incentives }: StakingModalProps) {
  const theme = useTheme()

  const handleIncentiveToggle = useCallback((incentive: Incentive) => {
    console.log(incentive)
  }, [])

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <Wrapper>
        {!positionDetails || !incentives ? (
          <Loader />
        ) : (
          <AutoColumn gap="sm">
            <RowBetween>
              <TYPE.body fontSize="20px" fontWeight={600}>
                <Trans>Review Position Staking</Trans>
              </TYPE.body>
              <CloseIcon onClick={onDismiss} />
            </RowBetween>
            <RangeWrapper>
              <RangeStatus positionDetails={positionDetails} small={true} />
            </RangeWrapper>
            {incentives.map((incentive, i) => {
              const beginsInFuture = incentive.startTime > Date.now() / 1000
              return (
                <RowBetween key={'incentive-modal-' + i}>
                  <RowFixed>
                    <CurrencyLogo currency={incentive.initialRewardAmount.currency} />
                    <TYPE.body
                      m="0 12px"
                      fontSize="16px"
                    >{`${incentive.initialRewardAmount.currency.symbol} Boost`}</TYPE.body>
                  </RowFixed>
                  <AutoRow gap="8px" width="fit-content">
                    <GreenBadge>
                      <TYPE.body color={theme.green2} fontWeight={600} fontSize="12px">
                        {beginsInFuture ? <Trans>New</Trans> : <Trans>Available</Trans>}
                      </TYPE.body>
                    </GreenBadge>
                    <AppleToggle isActive={true} toggle={() => handleIncentiveToggle(incentive)} />
                  </AutoRow>
                </RowBetween>
              )
            })}
            <TYPE.body fontSize="12px" fontWeight={500} m="12px 0">
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
        )}
      </Wrapper>
    </Modal>
  )
}

interface ClaimModalProps {
  incentives: Incentive[] | undefined
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
        {!incentives ? (
          <Loader />
        ) : (
          <AutoColumn gap="lg">
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
                {incentives.map((incentive, i) => {
                  return (
                    <AutoRow gap="8px" key={'reward-row' + i} width="fit-content">
                      <CurrencyLogo currency={incentive.initialRewardAmount.currency} size="24px" />
                      <TYPE.body fontSize="20px" fontWeight={500}>
                        {formatCurrencyAmount(incentive.initialRewardAmount, 5)}
                      </TYPE.body>
                      <TYPE.body fontSize="20px" fontWeight={500}>
                        {incentive.initialRewardAmount.currency.symbol}
                      </TYPE.body>
                    </AutoRow>
                  )
                })}
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
        )}
      </Wrapper>
    </Modal>
  )
}

interface UnstakeModalProps {
  incentives: Incentive[] | undefined
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
        {!incentives ? (
          <Loader />
        ) : (
          <AutoColumn gap="lg">
            <RowBetween>
              <TYPE.body fontSize="20px" fontWeight={600}>
                <Trans>Unstake and Claim</Trans>
              </TYPE.body>
              <CloseIcon onClick={onDismiss} />
            </RowBetween>
            <GreenBadge style={{ padding: '16px' }}>
              <AutoColumn gap="sm" justify="center">
                <AlertCircle size={20} />
                <TYPE.body fontWeight={500} fontSize="14px" style={{ whiteSpace: 'normal' }} textAlign="center">
                  <Trans>
                    You are unstaking your liquidty! You can now remove your position or claim regular liquidity
                    provider fees.
                  </Trans>
                </TYPE.body>
              </AutoColumn>
            </GreenBadge>
            <DarkerGreyCard>
              <AutoColumn gap="md" justify="center">
                <TYPE.body ml="12px" fontSize="11px" fontWeight={400}>
                  <Trans>TOTAL UNCLAIMED REWARDS</Trans>
                </TYPE.body>
                {incentives.map((incentive, i) => {
                  return (
                    <AutoRow gap="8px" key={'reward-row' + i} width="fit-content">
                      <CurrencyLogo currency={incentive.initialRewardAmount.currency} size="24px" />
                      <TYPE.body fontSize="20px" fontWeight={500}>
                        {formatCurrencyAmount(incentive.initialRewardAmount, 5)}
                      </TYPE.body>
                      <TYPE.body fontSize="20px" fontWeight={500}>
                        {incentive.initialRewardAmount.currency.symbol}
                      </TYPE.body>
                    </AutoRow>
                  )
                })}
              </AutoColumn>
            </DarkerGreyCard>
            <ButtonPrimary padding="8px" $borderRadius="12px">
              <Trans>Unstake and Claim</Trans>
            </ButtonPrimary>
          </AutoColumn>
        )}
      </Wrapper>
    </Modal>
  )
}
