import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'

import QuestionHelper from '../Question'
import NumericalInput from '../NumericalInput'
import { Link } from '../../theme/components'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import { ButtonRadio } from '../Button'
import { useTranslation } from 'react-i18next'
import Row, { RowBetween, RowFixed } from '../Row'

const InputWrapper = styled(RowBetween)`
  width: 200px;
  background-color: ${({ theme }) => theme.bg1};
  border-radius: 8px;
  padding: 4px 8px;
  border: 1px solid transparent;
  border: ${({ active, error, theme }) =>
  error ? '1px solid ' + theme.red1 : active ? '1px solid ' + theme.blue1 : ''};
`

const SLIPPAGE_INDEX = {
  1: 1,
  2: 2,
  3: 3,
  4: 4
}

interface AdvancedSettingsProps {
  setIsOpen: (boolean) => void
  setDeadline: (number) => void
  allowedSlippage: number
  setAllowedSlippage: (number) => void
}

export default function AdvancedSettings({ setIsOpen, setDeadline, allowedSlippage, setAllowedSlippage }: AdvancedSettingsProps) {
  // text translation
  const { t } = useTranslation()

  const [deadlineInput, setDeadlineInput] = useState(20)
  const [slippageInput, setSlippageInput] = useState<string>('')
  const [activeIndex, setActiveIndex] = useState(SLIPPAGE_INDEX[2])

  const [slippageInputError, setSlippageInputError] = useState(null) // error

  const parseCustomInput = useCallback(
    val => {
      const acceptableValues = [/^$/, /^\d{1,2}$/, /^\d{0,2}\.\d{0,2}$/]
      if (val > 5) {
        setSlippageInputError('Your transaction may be front-run.')
      } else {
        setSlippageInputError(null)
      }
      if (acceptableValues.some(a => a.test(val))) {
        setSlippageInput(val)
        setAllowedSlippage(val * 100)
      }
    },
    [setAllowedSlippage]
  )

  function parseCustomDeadline(val) {
    const acceptableValues = [/^$/, /^\d+$/]
    if (acceptableValues.some(re => re.test(val))) {
      setDeadlineInput(val)
      setDeadline(val * 60)
    }
  }

  // update settings based on current slippage selected
  useEffect(() => {
    if (allowedSlippage === 10) {
      setActiveIndex(1)
    } else if (allowedSlippage === 50) {
      setActiveIndex(2)
    } else if (allowedSlippage === 100) {
      setActiveIndex(3)
    } else {
      setActiveIndex(4)
      setSlippageInput('' + (allowedSlippage / 100))
      parseCustomInput(allowedSlippage)
    }
  }, [allowedSlippage, parseCustomInput])

  return (
    <AutoColumn gap="lg">
      <Link
        onClick={() => {
          setIsOpen(false)
        }}
      >
        back
      </Link>
      <RowBetween>
        <TYPE.main>Front-running tolerance</TYPE.main>
        <QuestionHelper text={t('toleranceExplanation')}/>
      </RowBetween>
      <Row>
        <ButtonRadio
          active={SLIPPAGE_INDEX[1] === activeIndex}
          padding="4px 6px"
          borderRadius="8px"
          style={{ marginRight: '16px' }}
          width={'60px'}
          onClick={() => {
            setActiveIndex(SLIPPAGE_INDEX[1])
            setAllowedSlippage(10)
          }}
        >
          0.1%
        </ButtonRadio>
        <ButtonRadio
          active={SLIPPAGE_INDEX[2] === activeIndex}
          padding="4px 6px"
          borderRadius="8px"
          style={{ marginRight: '16px' }}
          width={'180px'}
          onClick={() => {
            setActiveIndex(SLIPPAGE_INDEX[2])
            setAllowedSlippage(50)
          }}
        >
          0.5% (suggested)
        </ButtonRadio>
        <ButtonRadio
          active={SLIPPAGE_INDEX[3] === activeIndex}
          padding="4px"
          borderRadius="8px"
          width={'60px'}
          onClick={() => {
            setActiveIndex(SLIPPAGE_INDEX[3])
            setAllowedSlippage(100)
          }}
        >
          1%
        </ButtonRadio>
      </Row>
      <RowFixed>
        <InputWrapper active={SLIPPAGE_INDEX[4] === activeIndex} error={slippageInputError}>
          <NumericalInput
            align={slippageInput ? 'right' : 'left'}
            value={slippageInput || ''}
            onUserInput={val => {
              parseCustomInput(val)
              setActiveIndex(SLIPPAGE_INDEX[4])
            }}
            placeHolder="Custom"
            onClick={() => {
              setActiveIndex(SLIPPAGE_INDEX[4])
              if (slippageInput) {
                parseCustomInput(slippageInput)
              }
            }}
          />
          %
        </InputWrapper>
        {slippageInputError && (
          <TYPE.error error={true} fontSize={12} style={{ marginLeft: '10px' }}>
            Your transaction may be front-run
          </TYPE.error>
        )}
      </RowFixed>
      <RowBetween>
        <TYPE.main>Adjust deadline (minutes from now)</TYPE.main>
      </RowBetween>
      <RowFixed>
        <InputWrapper>
          <NumericalInput
            value={deadlineInput}
            onUserInput={val => {
              parseCustomDeadline(val)
            }}
          />
        </InputWrapper>
      </RowFixed>
    </AutoColumn>
  )
}
