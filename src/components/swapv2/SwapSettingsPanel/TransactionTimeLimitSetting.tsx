import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'
import { Flex, Text, Box } from 'rebass'
import { isMobile } from 'react-device-detect'

import useTheme from 'hooks/useTheme'
import QuestionHelper from 'components/QuestionHelper'
import { useUserTransactionTTL } from 'state/user/hooks'

type Props = {
  className?: string
}

const validateDeadlineString = (str: string): boolean => {
  const value = Number.parseInt(str, 10)

  // must not be longer than 10000 (5 chars)
  if (str.length > '10000'.length) {
    return false
  }

  // must be an integer
  if (Number.isNaN(value) || String(Math.floor(value)) !== str) {
    return false
  }

  // must be in (0, 1000)
  if (0 < value && value < 10000) {
    return true
  }

  return false
}

const TransactionTimeLimitSetting: React.FC<Props> = ({ className }) => {
  const theme = useTheme()

  const [deadline /* in seconds */, setDeadline] = useUserTransactionTTL()
  const [deadlineInput, setDeadlineInput] = useState(String(Math.floor(deadline / 60)))
  const inputRef = useRef<HTMLInputElement>(null)

  const isValid = validateDeadlineString(deadlineInput)

  const handleCommitChange = () => {
    if (!validateDeadlineString(deadlineInput)) {
      return
    }

    const newDeadline /* in seconds */ = parseInt(deadlineInput, 10) * 60
    setDeadline(newDeadline)
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommitChange()
      inputRef.current?.blur()
    }
  }

  useEffect(() => {
    setDeadlineInput(String(Math.floor(deadline / 60)))
  }, [deadline])

  return (
    <Flex justifyContent={'space-between'} alignItems="center" className={className}>
      <Flex alignItems="center">
        <Text
          className="label"
          sx={{
            fontSize: isMobile ? '14px' : '12px',
            color: theme.text,
            fontWeight: 400,
            lineHeight: '16px',
            whiteSpace: 'nowrap',
          }}
        >
          <Trans>Transaction time limit</Trans>
        </Text>
        <QuestionHelper text={t`Transaction will revert if it is pending for longer than the indicated time`} />
      </Flex>

      <Flex
        sx={{
          height: '28px',
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          columnGap: '2px',
          alignItems: 'center',
          backgroundColor: theme.tabBackgound,
          padding: '0 8px',
          borderRadius: '40px',
        }}
      >
        <Box width={60}>
          <input
            ref={inputRef}
            className="input"
            placeholder={String(deadline / 60)}
            value={deadlineInput}
            onChange={e => setDeadlineInput(e.target.value)}
            onBlur={handleCommitChange}
            onKeyUp={handleKeyUp}
            data-valid={isValid}
          />
        </Box>
        <Text fontWeight={500} fontSize="12px" lineHeight={'16px'}>
          <Trans>mins</Trans>
        </Text>
      </Flex>
    </Flex>
  )
}

export default styled(TransactionTimeLimitSetting)`
  .input {
    width: 100%;
    background: transparent;
    font-size: 12px;
    font-weight: 500;
    outline: none;
    border: none;
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
    }
    color: ${({ theme }) => theme.text};
    text-align: right;

    &[data-valid='false'] {
      color: ${({ theme }) => theme.red1};
    }
  }
`
