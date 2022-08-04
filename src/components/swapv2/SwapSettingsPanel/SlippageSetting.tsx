import React, { useState, useRef } from 'react'
import { t, Trans } from '@lingui/macro'
import styled, { css } from 'styled-components'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'

import QuestionHelper from 'components/QuestionHelper'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { MAX_SLIPPAGE_IN_BIPS } from 'constants/index'
import useTheme from 'hooks/useTheme'

const DefaultSlippages = [10, 50, 100]

const parseSlippageInput = (str: string): number => Math.round(Number.parseFloat(str) * 100)

// isValid = true means it's OK to process with the number with an extra parse
// isValid = true with message means warning
// isValid = false with/without message means error
const validateSlippageInput = (str: string): { isValid: boolean; message?: string } => {
  if (str === '') {
    return {
      isValid: true,
    }
  }

  const numberRegex = /^\s*([0-9]+)(\.\d+)?\s*$/
  if (!str.match(numberRegex)) {
    return {
      isValid: false,
      message: t`Enter a valid slippage percentage`,
    }
  }

  const rawSlippage = parseSlippageInput(str)
  if (Number.isNaN(rawSlippage)) {
    return {
      isValid: false,
      message: t`Enter a valid slippage percentage`,
    }
  }

  if (rawSlippage < 0) {
    return {
      isValid: false,
      message: t`Enter a valid slippage percentage`,
    }
  } else if (rawSlippage < 50) {
    return {
      isValid: true,
      message: t`Your transaction may fail`,
    }
  } else if (rawSlippage > MAX_SLIPPAGE_IN_BIPS) {
    return {
      isValid: false,
      message: t`Enter a smaller slippage percentage`,
    }
  } else if (rawSlippage > 500) {
    return {
      isValid: true,
      message: t`Your transaction may be frontrun`,
    }
  }

  return {
    isValid: true,
  }
}

const EmojiContainer = styled.span`
  flex: 0 0 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
        display: none;
  `}
`

const SlippageOptionCSS = css`
  flex: 0 0 24%;
  height: 100%;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 20px;

  background-color: ${({ theme }) => theme.tabBackgound};
  color: ${({ theme }) => theme.subText};
  text-align: center;

  font-size: 12px;
  font-weight: 400;
  line-height: 16px;

  outline: none;
  cursor: pointer;

  :hover {
    border: 1px solid ${({ theme }) => theme.bg4};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.primary};
  }

  &[data-active='true'] {
    background-color: ${({ theme }) => theme.tabActive};
    color: ${({ theme }) => theme.text};

    font-weight: 500;
  }
`
const DefaultSlippageOption = styled.button`
  ${SlippageOptionCSS}
`

const CustomSlippageOption = styled.div`
  ${SlippageOptionCSS}

  display: inline-flex;
  align-items: center;
  padding: 0 4px;
  column-gap: 2px;

  input {
    width: 100%;
    height: 100%;
    border: 0px;
    border-radius: inherit;

    color: inherit;
    background: transparent;
    outline: none;
    text-align: right;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
    }
  }

  &[data-active='true'] {
    color: ${({ theme }) => theme.text};
    font-weight: 500;
  }

  &[data-warning='true'] {
    border: 1px solid;
    border-color: ${({ theme }) => theme.warning};

    ${EmojiContainer} {
      color: ${({ theme }) => theme.warning};
    }
  }

  &[data-error='true'] {
    border: 1px solid;
    border-color: ${({ theme }) => theme.red1};
  }
`

const Message = styled.div`
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;

  &[data-warning='true'] {
    color: ${({ theme }) => theme.warning};
  }

  &[data-error='true'] {
    color: ${({ theme }) => theme.red1};
  }
`

const SlippageSetting: React.FC = () => {
  const theme = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)

  // rawSlippage = 10
  // slippage = 10 / 10_000 = 0.001 = 0.1%
  const [rawSlippage, setRawSlippage] = useUserSlippageTolerance()

  const isCustomOptionActive = !DefaultSlippages.includes(rawSlippage)
  const [slippageInput, setSlippageInput] = useState(isCustomOptionActive ? (rawSlippage / 100).toFixed(2) : '')
  const { isValid, message } = validateSlippageInput(slippageInput)

  const isWarning = isValid && !!message
  const isError = !isValid

  const handleCommitChange = () => {
    if (!isValid || slippageInput === '') {
      return
    }

    const newRawSlippage = parseSlippageInput(slippageInput)
    if (Number.isNaN(newRawSlippage)) {
      return
    }

    setRawSlippage(newRawSlippage)
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommitChange()
      inputRef.current?.blur()
    }
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        rowGap: '8px',
      }}
    >
      <Flex
        sx={{
          alignItems: 'center',
        }}
      >
        <Text
          sx={{
            fontSize: isMobile ? '14px' : '12px',
            color: theme.text,
            fontWeight: 400,
            lineHeight: '16px',
          }}
        >
          <Trans>Max Slippage</Trans>
        </Text>
        <QuestionHelper
          text={t`Transaction will revert if there is an adverse rate change that is higher than this %`}
        />
      </Flex>

      <Flex
        sx={{
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '100%',
          height: '28px',
          borderRadius: '20px',
          background: theme.tabBackgound,
          padding: '2px',
        }}
      >
        {DefaultSlippages.map(slp => (
          <DefaultSlippageOption
            key={slp}
            onClick={() => {
              setSlippageInput('')
              setRawSlippage(slp)
            }}
            data-active={rawSlippage === slp}
          >
            {slp / 100}%
          </DefaultSlippageOption>
        ))}

        <CustomSlippageOption
          data-active={isCustomOptionActive}
          data-warning={isCustomOptionActive && isWarning}
          data-error={isCustomOptionActive && isError}
        >
          {isCustomOptionActive && isWarning && (
            <EmojiContainer>
              <span role="img" aria-label="warning">
                ⚠️
              </span>
            </EmojiContainer>
          )}
          <input
            ref={inputRef}
            placeholder={t`Custom`}
            value={slippageInput}
            onChange={e => setSlippageInput(e.target.value)}
            onBlur={handleCommitChange}
            onKeyUp={handleKeyUp}
          />
          <Text
            as="span"
            sx={{
              flex: '0 0 12px',
            }}
          >
            %
          </Text>
        </CustomSlippageOption>
      </Flex>

      {!!message && (
        <Message data-warning={isWarning} data-error={isError}>
          {message}
        </Message>
      )}
    </Flex>
  )
}

export default SlippageSetting
