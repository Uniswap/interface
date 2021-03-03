import React, { useEffect, useState } from 'react'
import { Box, Flex } from 'rebass'
import { Pair, TokenAmount } from 'dxswap-sdk'
import PoolSummary from './PoolSummary'
import RewardSummary from './RewardSummary'
import { Card, Divider } from '../../../styleds'
import { ButtonPrimary } from '../../../../Button'
import { useTokenBalance } from '../../../../../state/wallet/hooks'
import { ApprovalState, useApproveCallback } from '../../../../../hooks/useApproveCallback'
import { useStakingRewardsDistributionFactoryContract } from '../../../../../hooks/useContract'
import BigNumber from 'bignumber.js'
import { useActiveWeb3React } from '../../../../../hooks'

interface PreviewProps {
  liquidityPair: Pair | null
  apy: BigNumber
  startTime: Date | null
  endTime: Date | null
  timelocked: boolean
  reward: TokenAmount | null
  onCreate: () => void
}

export default function PreviewAndCreate({
  liquidityPair,
  startTime,
  endTime,
  timelocked,
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
      return 'Insuffucient balance'
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
    <Flex flexDirection="column">
      <Box mb="40px">
        <Card>
          <Flex justifyContent="stretch" width="100%">
            <PoolSummary
              liquidityPair={liquidityPair}
              startTime={startTime}
              endTime={endTime}
              timelocked={timelocked}
            />
            <Box mx="18px">
              <Divider />
            </Box>
            <RewardSummary reward={reward} apy={apy} />
          </Flex>
        </Card>
      </Box>
      <Box>
        <Card>
          <Flex justifyContent="stretch" width="100%">
            <Box width="100%">
              <ButtonPrimary
                disabled={
                  areButtonsDisabled ||
                  approvalState === ApprovalState.PENDING ||
                  approvalState === ApprovalState.APPROVED
                }
                onClick={approveCallback}
              >
                {getApproveButtonMessage()}
              </ButtonPrimary>
            </Box>
            <Box mx="18px">
              <Divider />
            </Box>
            <Box width="100%">
              <ButtonPrimary
                disabled={areButtonsDisabled || approvalState !== ApprovalState.APPROVED}
                onClick={onCreate}
              >
                {getConfirmButtonMessage()}
              </ButtonPrimary>
            </Box>
          </Flex>
        </Card>
      </Box>
    </Flex>
  )
}
