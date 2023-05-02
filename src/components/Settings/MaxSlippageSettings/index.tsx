import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import Expand from 'components/Expand'
import QuestionHelper from 'components/QuestionHelper'
import Row, { RowBetween } from 'components/Row'
import React, { useState } from 'react'
import { useUserSlippageTolerance } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { Input, InputContainer } from '../Input'

enum SlippageError {
  InvalidInput = 'InvalidInput',
}

const Option = styled(Row)<{ isActive: boolean }>`
  width: auto;
  cursor: pointer;
  padding: 6px 12px;
  text-align: center;
  gap: 4px;
  border-radius: 12px;
  background: ${({ isActive, theme }) => (isActive ? theme.backgroundInteractive : 'transparent')};
  pointer-events: ${({ isActive }) => isActive && 'none'};
`

const Switch = styled(Row)`
  width: auto;
  padding: 4px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
`

const NUMBER_WITH_MAX_TWO_DECIMAL_PLACES = /^(?:\d*\.\d{0,2}|\d+)$/

export default function MaxSlippageSettings({ placeholder }: { placeholder: Percent }) {
  const [userSlippageTolerance, setUserSlippageTolerance] = useUserSlippageTolerance()

  // If user has previously entered a custom deadline, we want to show that value in the input field
  // instead of a placeholder by defualt
  const [slippageInput, setSlippageInput] = useState(
    userSlippageTolerance !== 'auto' && !userSlippageTolerance.equalTo(placeholder)
      ? userSlippageTolerance.toFixed(2)
      : ''
  )
  const [slippageError, setSlippageError] = useState<SlippageError | false>(false)

  const parseSlippageInput = (value: string) => {
    // Do not allow non-numerical characters in the input field or more than two decimals
    if (value.length > 0 && !NUMBER_WITH_MAX_TWO_DECIMAL_PLACES.test(value)) {
      return
    }

    setSlippageInput(value)
    setSlippageError(false)

    // If the input is empty, set the slippage to the default
    if (value.length === 0) {
      setUserSlippageTolerance('auto')
      return
    }

    if (value === '.') {
      return
    }

    // Parse user input and set the slippage if valid, error otherwise
    try {
      const parsed = Math.floor(Number.parseFloat(value) * 100)
      if (parsed > 5000) {
        setSlippageError(SlippageError.InvalidInput)
      } else {
        setUserSlippageTolerance(new Percent(parsed, 10_000))
      }
    } catch (e) {
      setSlippageError(SlippageError.InvalidInput)
    }
  }

  const tooLow = userSlippageTolerance !== 'auto' && userSlippageTolerance.lessThan(new Percent(5, 10_000))
  const tooHigh = userSlippageTolerance !== 'auto' && userSlippageTolerance.greaterThan(new Percent(1, 100))

  return (
    <Expand
      header={
        <Row width="auto">
          <ThemedText.BodySecondary>
            <Trans>Max slippage</Trans>
          </ThemedText.BodySecondary>
          <QuestionHelper
            text={
              <Trans>Your transaction will revert if the price changes unfavorably by more than this percentage.</Trans>
            }
          />
        </Row>
      }
      button={
        <ThemedText.BodyPrimary>
          {userSlippageTolerance === 'auto' ? <Trans>Auto</Trans> : `${userSlippageTolerance.toFixed(2)}%`}
        </ThemedText.BodyPrimary>
      }
    >
      <RowBetween gap="md">
        <Switch>
          <Option
            onClick={() => {
              // Reset the input field when switching to auto
              setSlippageInput('')
              setUserSlippageTolerance('auto')
            }}
            isActive={userSlippageTolerance === 'auto'}
          >
            <ThemedText.BodyPrimary>
              <Trans>Auto</Trans>
            </ThemedText.BodyPrimary>
          </Option>
          <Option
            onClick={() => {
              // Use placeholder value as default custom slippage
              setUserSlippageTolerance(placeholder)
            }}
            isActive={userSlippageTolerance !== 'auto'}
          >
            <ThemedText.BodyPrimary>
              <Trans>Custom</Trans>
            </ThemedText.BodyPrimary>
          </Option>
        </Switch>
        <InputContainer gap="md" error={!!slippageError}>
          <Input
            placeholder={placeholder.toFixed(2)}
            value={slippageInput}
            onChange={(e) => parseSlippageInput(e.target.value)}
            onBlur={() => {
              // When the input field is blurred, reset the input field to the current slippage tolerance
              setSlippageInput(userSlippageTolerance !== 'auto' ? userSlippageTolerance.toFixed(2) : '')
              setSlippageError(false)
            }}
          />
          <ThemedText.BodyPrimary>
            <Trans>%</Trans>
          </ThemedText.BodyPrimary>
        </InputContainer>
      </RowBetween>
      {tooLow || tooHigh ? (
        <RowBetween
          style={{
            fontSize: '14px',
            paddingTop: '7px',
            color: '#F3841E',
          }}
        >
          {tooLow ? <Trans>Your transaction may fail</Trans> : <Trans>Your transaction may be frontrun</Trans>}
        </RowBetween>
      ) : null}
    </Expand>
  )
}
