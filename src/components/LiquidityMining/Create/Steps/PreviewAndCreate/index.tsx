import React, { useEffect, useState } from 'react'
import { Box, Flex } from 'rebass'
import { Pair, Percent, TokenAmount } from '@swapr/sdk'
import PoolSummary from './PoolSummary'
import RewardSummary from './RewardSummary'
import { Card, Divider } from '../../../styleds'
import { ButtonPrimary } from '../../../../Button'
import { useTokenBalance } from '../../../../../state/wallet/hooks'
import { ApprovalState, useApproveCallback } from '../../../../../hooks/useApproveCallback'
import { useStakingRewardsDistributionFactoryContract } from '../../../../../hooks/useContract'
import { useActiveWeb3React } from '../../../../../hooks'
import styled from 'styled-components'

const FlexContainer = styled(Flex)`
  ${props => props.theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
  `}
`

const ResponsiveContainer = styled(Box)<{ flex1?: boolean }>`
  flex: ${props => (props.flex1 ? 1 : 'auto')};
  ${props => props.theme.mediaWidth.upToExtraSmall`
    margin-top: 16px !important;
  `}
`

interface PreviewProps {
  liquidityPair: Pair | null
  apy: Percent
  startTime: Date | null
  endTime: Date | null
  timelocked: boolean
  stakingCap: TokenAmount | null
  reward: TokenAmount | null
  onCreate: () => void
}

export default function PreviewAndCreate({
  liquidityPair,
  startTime,
  endTime,
  timelocked,
  stakingCap,
  reward,
  apy,
  onCreate
}: PreviewProps) {
  const { account } = useActiveWeb3React()
  const userBalance = useTokenBalance(account || undefined, reward?.token)
  const stakingRewardsDistributionFactoryContract = useStakingRewardsDistributionFactoryContract()
  const [approvalState, approveCallback] = useApproveCallback(
    reward ?? undefined,
    stakingRewardsDistributionFactoryContract?.address
  )
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false)

  const getApproveButtonMessage = () => {
    if (!account) {
      return 'Connect your wallet'
    }
    if (userBalance && reward && reward.greaterThan('0') && userBalance.lessThan(reward)) {
      return 'Insufficient balance'
    }
    return 'Approve reward token'
  }

  const getConfirmButtonMessage = () => {
    if (!account) {
      return 'Connect your wallet'
    }
    if (userBalance && reward && reward.greaterThan('0') && userBalance.lessThan(reward)) {
      return 'Insuffucient balance'
    }
    return 'Deposit & create'
  }

  useEffect(() => {
    setAreButtonsDisabled(
      !!(!account || !reward || !reward.token || reward.equalTo('0') || (userBalance && userBalance.lessThan(reward)))
    )
  }, [account, reward, userBalance])

  return (
    <Flex flexDirection="column" style={{ zIndex: -1 }}>
      <Box mb="40px">
        <Card>
          <FlexContainer justifyContent="stretch" width="100%">
            <PoolSummary
              liquidityPair={liquidityPair}
              startTime={startTime}
              endTime={endTime}
              timelocked={timelocked}
              stakingCap={stakingCap}
            />
            <Box mx="18px">
              <Divider />
            </Box>
            <ResponsiveContainer flex1>
              <RewardSummary reward={reward} apy={apy} />
            </ResponsiveContainer>
          </FlexContainer>
        </Card>
      </Box>
      <Box>
        <Card>
          <FlexContainer justifyContent="stretch" width="100%">
            <Box width="100%">
              <ButtonPrimary
                disabled={areButtonsDisabled || approvalState !== ApprovalState.NOT_APPROVED}
                onClick={approveCallback}
              >
                {getApproveButtonMessage()}
              </ButtonPrimary>
            </Box>
            <Box mx="18px">
              <Divider />
            </Box>
            <ResponsiveContainer width="100%">
              <ButtonPrimary
                disabled={areButtonsDisabled || approvalState !== ApprovalState.APPROVED}
                onClick={onCreate}
              >
                {getConfirmButtonMessage()}
              </ButtonPrimary>
            </ResponsiveContainer>
          </FlexContainer>
        </Card>
      </Box>
    </Flex>
  )
}
