import { Pair } from 'dxswap-sdk'
import React from 'react'
import { Box, Flex, Text } from 'rebass'
import { ButtonError, ButtonPrimary } from '../../../../Button'

interface ConfirmStakingModalFooterProps {
  onConfirm: () => void
  onApprove?: () => void
  stakablePair?: Pair | null
  disabledConfirm: boolean
  disabledApprove?: boolean
  showApprove: boolean
}

export default function ConfirmStakingModalFooter({
  onConfirm,
  onApprove,
  stakablePair,
  disabledConfirm,
  disabledApprove,
  showApprove
}: ConfirmStakingModalFooterProps) {
  return (
    <Flex justifyContent="stretch">
      {showApprove && (
        <Box width="50%" pr="6px">
          <ButtonPrimary onClick={onApprove} disabled={disabledApprove}>
            <Text fontSize={13} fontWeight={600}>
              Approve {stakablePair?.token0.symbol}/{stakablePair?.token1.symbol}
            </Text>
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
