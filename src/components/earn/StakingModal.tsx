import { Trans } from '@lingui/macro'
import { GreenBadge } from 'components/Badge'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import RangeStatus from 'components/RangeStatus'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import AppleToggle from 'components/Toggle/AppleToggle'
import { incentiveToIncentiveId } from 'hooks/incentives/incentiveKeyToIncentiveId'
import { Incentive } from 'hooks/incentives/useAllIncentives'
import useTheme from 'hooks/useTheme'
import { useCallback } from 'react'
import styled from 'styled-components/macro'
import { CloseIcon, TYPE } from 'theme'
import { PositionDetails } from 'types/position'

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
              const currentKey = incentiveToIncentiveId(incentive)
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
                        <Trans>Available</Trans>
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

interface ClaimRewardsModalProps {
  incentive: Incentive
  isOpen: boolean
  onDismiss: () => void
}

export function ClaimRewardsModal({ incentive, isOpen, onDismiss }: ClaimRewardsModalProps) {
  return <Wrapper></Wrapper>
}
