import { Pair } from 'dxswap-sdk'
import React from 'react'
import { Box, Flex, Text } from 'rebass'
import { ButtonError, ButtonPrimary } from '../../../../Button'

interface ConfirmStakingModalFooterProps {
  onConfirm: () => void
  onApprove: () => void
  stakablePair?: Pair | null
  disabledConfirm: boolean
  disabledApprove: boolean
}

export default function ConfirmStakingModalFooter({
  onConfirm,
  onApprove,
  stakablePair,
  disabledConfirm,
  disabledApprove
}: ConfirmStakingModalFooterProps) {
  return (
    <Flex>
      <Box pr="6px">
        <ButtonPrimary onClick={onApprove} disabled={disabledApprove}>
          <Text fontSize={13} fontWeight={600}>
            Approve {stakablePair?.token0.symbol}/{stakablePair?.token1.symbol}
          </Text>
        </ButtonPrimary>
      </Box>
      <Box pl="6px">
        <ButtonError onClick={onConfirm} disabled={disabledConfirm}>
          <Text fontSize={13} fontWeight={600}>
            Confirm and stake
          </Text>
        </ButtonError>
      </Box>
    </Flex>
  )
}
