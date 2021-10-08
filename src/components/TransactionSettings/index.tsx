import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { L2_CHAIN_IDS } from 'constants/chains'
import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import { useActiveWeb3React } from 'hooks/web3'
import { darken } from 'polished'
import { useContext, useState } from 'react'
import { useSetUserSlippageTolerance, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import styled, { ThemeContext } from 'styled-components/macro'

import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'

enum SlippageError {
  InvalidInput = 'InvalidInput',
}

enum DeadlineError {
  InvalidInput = 'InvalidInput',
}

const FancyButton = styled.button`
  color: ${({ theme }) => theme.text1};
  align-items: center;
  height: 2rem;
  border-radius: 36px;
  font-size: 1rem;
  width: auto;
  min-width: 3.5rem;
  border: 1px solid ${({ theme }) => theme.bg3};
  outline: none;
  background: ${({ theme }) => theme.bg1};
  :hover {
    border: 1px solid ${({ theme }) => theme.bg4};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1};
  }
`

const Option = styled(FancyButton)<{ active: boolean }>`
  margin-right: 8px;
  :hover {
    cursor: pointer;
  }
  background-color: ${({ active, theme }) => active && theme.primary1};
  color: ${({ active, theme }) => (active ? theme.white : theme.text1)};
`

const Input = styled.input`
  background: ${({ theme }) => theme.bg1};
  font-size: 16px;
  width: auto;
  outline: none;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  color: ${({ theme, color }) => (color === 'red' ? theme.red1 : theme.text1)};
  text-align: right;
`

const OptionCustom = styled(FancyButton)<{ active?: boolean; warning?: boolean }>`
  height: 2rem;
  position: relative;
  padding: 0 0.75rem;
  flex: 1;
  border: ${({ theme, active, warning }) =>
    active ? `1px solid ${warning ? theme.red1 : theme.primary1}` : warning && `1px solid ${theme.red1}`};
  :hover {
    border: ${({ theme, active, warning }) =>
      active && `1px solid ${warning ? darken(0.1, theme.red1) : darken(0.1, theme.primary1)}`};
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
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;  
  `}
`

interface TransactionSettingsProps {
  placeholderSlippage: Percent // varies according to the context in which the settings dialog is placed
}

export default function TransactionSettings({ placeholderSlippage }: TransactionSettingsProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const userSlippageTolerance = useUserSlippageTolerance()
  const setUserSlippageTolerance = useSetUserSlippageTolerance()

  const [deadline, setDeadline] = useUserTransactionTTL()

  const [slippageInput, setSlippageInput] = useState('')
  const [slippageError, setSlippageError] = useState<SlippageError | false>(false)

  const [deadlineInput, setDeadlineInput] = useState('')
  const [deadlineError, setDeadlineError] = useState<DeadlineError | false>(false)

  function parseSlippageInput(value: string) {
    // populate what the user typed and clear the error
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

  function parseCustomDeadline(value: string) {
    // populate what the user typed and clear the error
    setDeadlineInput(value)
    setDeadlineError(false)

    if (value.length === 0) {
      setDeadline(DEFAULT_DEADLINE_FROM_NOW)
    } else {
      try {
        const parsed: number = Math.floor(Number.parseFloat(value) * 60)
        if (!Number.isInteger(parsed) || parsed < 60 || parsed > 180 * 60) {
          setDeadlineError(DeadlineError.InvalidInput)
        } else {
          setDeadline(parsed)
        }
      } catch (error) {
        console.error(error)
        setDeadlineError(DeadlineError.InvalidInput)
      }
    }
  }

  const showCustomDeadlineRow = Boolean(chainId && !L2_CHAIN_IDS.includes(chainId))

  return (
    <AutoColumn gap="md">
      <AutoColumn gap="sm">
        <RowFixed>
          <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
            <Trans>Slippage tolerance</Trans>
          </TYPE.black>
          <QuestionHelper
            text={
              <Trans>Your transaction will revert if the price changes unfavorably by more than this percentage.</Trans>
            }
          />
        </RowFixed>
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
                placeholder={placeholderSlippage.toFixed(2)}
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
      </AutoColumn>

      {showCustomDeadlineRow && (
        <AutoColumn gap="sm">
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              <Trans>Transaction deadline</Trans>
            </TYPE.black>
            <QuestionHelper
              text={<Trans>Your transaction will revert if it is pending for more than this period of time.</Trans>}
            />
          </RowFixed>
          <RowFixed>
            <OptionCustom style={{ width: '80px' }} warning={!!deadlineError} tabIndex={-1}>
              <Input
                placeholder={(DEFAULT_DEADLINE_FROM_NOW / 60).toString()}
                value={
                  deadlineInput.length > 0
                    ? deadlineInput
                    : deadline === DEFAULT_DEADLINE_FROM_NOW
                    ? ''
                    : (deadline / 60).toString()
                }
                onChange={(e) => parseCustomDeadline(e.target.value)}
                onBlur={() => {
                  setDeadlineInput('')
                  setDeadlineError(false)
                }}
                color={deadlineError ? 'red' : ''}
              />
            </OptionCustom>
            <TYPE.body style={{ paddingLeft: '8px' }} fontSize={14}>
              <Trans>minutes</Trans>
            </TYPE.body>
          </RowFixed>
        </AutoColumn>
      )}
    </AutoColumn>
  )
}
