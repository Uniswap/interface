import { Trans } from '@lingui/macro'
import ProgressBar from '@ramonak/react-progress-bar'
import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { ReactNode, useState } from 'react'
import { Text } from 'rebass'
import { ThemedText } from 'theme'

import { ButtonError } from '../Button'
import QuestionHelper from '../QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import { SwapCallbackError } from './styleds'

export default function SwapModalFooter({
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
}: {
  trade: Trade<Currency, Currency, TradeType>
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  disabledConfirm: boolean
}) {
  const [progressBarValue, setProgressBarValue] = useState<number>(0)
  const [vdfReady, setVdfReady] = useState<boolean>(false)

  return (
    <>
      <RowBetween>
        <RowFixed>
          <ThemedText.Black fontSize={14} fontWeight={400} color={'#565A69'}>
            {'VDF Generation'}
          </ThemedText.Black>
          <QuestionHelper text="Your VDF is currently being generated. Once the VDF is generated, you will be able to confirm your swap. Please wait for the progress bar to reach the end." />
        </RowFixed>
        <RowFixed>
          {vdfReady ? (
            <ThemedText.Blue fontSize={14}>{'Ready'}</ThemedText.Blue>
          ) : (
            <ThemedText.Blue fontSize={14}>{'In Progress'}</ThemedText.Blue>
          )}
        </RowFixed>
      </RowBetween>

      <ProgressBar
        completed={progressBarValue}
        labelSize={'12px'}
        transitionDuration={'0.2s'}
        labelAlignment={'outside'}
        labelColor={'#6a1b9a'}
      />
      <AutoRow>
        <ButtonError
          onClick={onConfirm}
          disabled={disabledConfirm}
          style={{ margin: '10px 0 0 0' }}
          id="confirm-swap-or-send"
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
