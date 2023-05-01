/**
 * TODO(XXXXX)
 * This component is a work in progress.
 */

import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import Expand from 'components/Expand'
import QuestionHelper from 'components/QuestionHelper'
import Row, { RowBetween } from 'components/Row'
import { darken } from 'polished'
import React, { useState } from 'react'
import { useUserSlippageTolerance } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

enum SlippageError {
  InvalidInput = 'InvalidInput',
}

const FancyButton = styled.button`
  color: ${({ theme }) => theme.textPrimary};
  align-items: center;
  height: 2rem;
  border-radius: 36px;
  font-size: 1rem;
  width: auto;
  min-width: 3.5rem;
  border: 1px solid ${({ theme }) => theme.deprecated_bg3};
  outline: none;
  background: ${({ theme }) => theme.deprecated_bg1};
  :hover {
    border: 1px solid ${({ theme }) => theme.deprecated_bg4};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.accentAction};
  }
`

const Option = styled(FancyButton)<{ active: boolean }>`
  margin-right: 8px;
  border-radius: 12px;
  :hover {
    cursor: pointer;
  }
  background-color: ${({ active, theme }) => active && theme.accentAction};
  color: ${({ active, theme }) => (active ? theme.white : theme.textPrimary)};
`

const Input = styled.input`
  background: ${({ theme }) => theme.deprecated_bg1};
  font-size: 16px;
  border-radius: 12px;
  width: auto;
  outline: none;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  color: ${({ theme, color }) => (color === 'red' ? theme.accentFailure : theme.textPrimary)};
  text-align: right;

  ::placeholder {
    color: ${({ theme }) => theme.textTertiary};
  }
`

const OptionCustom = styled(FancyButton)<{ active?: boolean; warning?: boolean }>`
  height: 2rem;
  position: relative;
  padding: 0 0.75rem;
  border-radius: 12px;
  flex: 1;
  border: ${({ theme, active, warning }) =>
    active
      ? `1px solid ${warning ? theme.accentFailure : theme.accentAction}`
      : warning && `1px solid ${theme.accentFailure}`};
  :hover {
    border: ${({ theme, active, warning }) =>
      active && `1px solid ${warning ? darken(0.1, theme.accentFailure) : darken(0.1, theme.accentAction)}`};
  }

  input {
    width: 100%;
    height: 100%;
    border: 0px;
    border-radius: 2rem;
  }
`

const SlippageEmojiContainer = styled.span`
  color: #f3841e;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `}
`

export default function MaxSlippageSettings({ placeholder }: { placeholder: Percent }) {
  const [userSlippageTolerance, setUserSlippageTolerance] = useUserSlippageTolerance()

  const [slippageInput, setSlippageInput] = useState('')
  const [slippageError, setSlippageError] = useState<SlippageError | false>(false)

  const parseSlippageInput = (value: string) => {
    setSlippageInput(value)
    setSlippageError(false)

    if (value.length === 0) {
      setUserSlippageTolerance('auto')
    } else {
      const parsed = Math.floor(Number.parseFloat(value) * 100)

      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5000) {
        setUserSlippageTolerance('auto')
        if (value !== '.') {
          setSlippageError(SlippageError.InvalidInput)
        }
      } else {
        setUserSlippageTolerance(new Percent(parsed, 10_000))
      }
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
          <Trans>Auto</Trans>
        </ThemedText.BodyPrimary>
      }
    >
      <RowBetween>
        <Option
          onClick={() => {
            parseSlippageInput('')
          }}
          active={userSlippageTolerance === 'auto'}
        >
          <Trans>Auto</Trans>
        </Option>
        <OptionCustom active={userSlippageTolerance !== 'auto'} warning={!!slippageError} tabIndex={-1}>
          <RowBetween>
            {tooLow || tooHigh ? (
              <SlippageEmojiContainer>
                <span role="img" aria-label="warning">
                  ⚠️
                </span>
              </SlippageEmojiContainer>
            ) : null}
            <Input
              placeholder={placeholder.toFixed(2)}
              value={
                slippageInput.length > 0
                  ? slippageInput
                  : userSlippageTolerance === 'auto'
                  ? ''
                  : userSlippageTolerance.toFixed(2)
              }
              onChange={(e) => parseSlippageInput(e.target.value)}
              onBlur={() => {
                setSlippageInput('')
                setSlippageError(false)
              }}
              color={slippageError ? 'red' : ''}
            />
            %
          </RowBetween>
        </OptionCustom>
      </RowBetween>
      {slippageError || tooLow || tooHigh ? (
        <RowBetween
          style={{
            fontSize: '14px',
            paddingTop: '7px',
            color: slippageError ? 'red' : '#F3841E',
          }}
        >
          {slippageError ? (
            <Trans>Enter a valid slippage percentage</Trans>
          ) : tooLow ? (
            <Trans>Your transaction may fail</Trans>
          ) : (
            <Trans>Your transaction may be frontrun</Trans>
          )}
        </RowBetween>
      ) : null}
    </Expand>
  )
}
