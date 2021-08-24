import { Pair } from '@swapr/sdk'
import React from 'react'
import { Box, Flex, Text } from 'rebass'
import { ApprovalState } from '../../../../../../hooks/useApproveCallback'
import { Dots } from '../../../../../../pages/Pools/styleds'
import { ButtonError, ButtonPrimary } from '../../../../../Button'

interface ConfirmStakingModalFooterProps {
  onConfirm: () => void
  onApprove?: () => void
  stakablePair?: Pair | null
  disabledConfirm: boolean
  approvalState?: ApprovalState
  showApprove?: boolean
}

export default function ConfirmStakingModalFooter({
  onConfirm,
  onApprove,
  stakablePair,
  disabledConfirm,
  approvalState,
  showApprove
}: ConfirmStakingModalFooterProps) {
  return (
    <Flex justifyContent="stretch">
      {showApprove && (
        <Box width="50%" pr="6px">
          <ButtonPrimary onClick={onApprove} disabled={approvalState === ApprovalState.APPROVED}>
            {approvalState === ApprovalState.PENDING && (
              <Dots>
                Approving {stakablePair?.token0.symbol}/{stakablePair?.token1.symbol}
              </Dots>
            )}
            {approvalState === ApprovalState.APPROVED &&
              `${stakablePair?.token0.symbol}/${stakablePair?.token1.symbol} APPROVED`}
            {approvalState !== ApprovalState.PENDING &&
              approvalState !== ApprovalState.APPROVED &&
              `Approve ${stakablePair?.token0.symbol}/${stakablePair?.token1.symbol}`}
          </ButtonPrimary>
        </Box>
      )}
      <Box width={showApprove ? '50%' : '100%'} pl={showApprove ? '6px' : '0'}>
        <ButtonError onClick={onConfirm} disabled={disabledConfirm}>
          <Text fontSize={13} fontWeight={600}>
            Confirm
          </Text>
        </ButtonError>
      </Box>
    </Flex>
  )
}
