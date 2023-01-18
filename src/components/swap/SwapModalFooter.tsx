import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { Text } from 'rebass'

import React from 'react'
import { ButtonError } from '../Button'
import { AutoRow } from '../Row'
import { SwapCallbackError } from './styleds'

export default function SwapModalFooter({
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
}: {
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
  swapQuoteReceivedDate: Date | undefined
}) {
  return (
    <>
      <AutoRow>
        <ButtonError
          onClick={onConfirm}
          disabled={disabledConfirm}
          style={{ margin: '10px 0 0 0' }}
          id="CONFIRM_SWAP_BUTTON"
        >
          <Text fontSize={20} fontWeight={500}>
            <Trans>Confirm Swap</Trans>
          </Text>
        </ButtonError>
        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )
}
