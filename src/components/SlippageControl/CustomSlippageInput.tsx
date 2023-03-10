import { t } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { DEFAULT_SLIPPAGES, MAX_SLIPPAGE_IN_BIPS } from 'constants/index'
import { formatSlippage } from 'utils/slippage'

export const parseSlippageInput = (str: string): number => Math.round(Number.parseFloat(str) * 100)
const getSlippageText = (rawSlippage: number) => {
  const isCustom = !DEFAULT_SLIPPAGES.includes(rawSlippage)
  if (!isCustom) {
    return ''
  }

  return formatSlippage(rawSlippage, false)
}

const EmojiContainer = styled.span`
  flex: 0 0 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
        display: none;
  `}
`

const slippageOptionCSS = css`
  height: 100%;
  padding: 0;
  border-radius: 20px;
  border: 1px solid transparent;

  background-color: ${({ theme }) => theme.tabBackgound};
  color: ${({ theme }) => theme.subText};
  text-align: center;

  font-size: 12px;
  font-weight: 400;
  line-height: 16px;

  outline: none;
  cursor: pointer;

  :hover {
    border-color: ${({ theme }) => theme.bg4};
  }
  :focus {
    border-color: ${({ theme }) => theme.bg4};
  }

  &[data-active='true'] {
    background-color: ${({ theme }) => theme.tabActive};
    color: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.primary};

    font-weight: 500;
  }

  &[data-warning='true'] {
    border-color: ${({ theme }) => theme.warning};
  }
`

const CustomSlippageOption = styled.div`
  ${slippageOptionCSS};

  flex: 0 0 24%;

  display: inline-flex;
  align-items: center;
  padding: 0 4px;
  column-gap: 2px;
  flex: 1;

  transition: all 150ms linear;

  &[data-active='true'] {
    color: ${({ theme }) => theme.text};
    font-weight: 500;
  }

  &[data-warning='true'] {
    border-color: ${({ theme }) => theme.warning};

    ${EmojiContainer} {
      color: ${({ theme }) => theme.warning};
    }
  }
`

const CustomInput = styled.input`
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
  &::placeholder {
    font-size: 12px;
  }
  @media only screen and (max-width: 375px) {
    font-size: 10px;
  }
`

export type Props = {
  rawSlippage: number
  setRawSlippage: (value: number) => void
  isWarning: boolean
  defaultRawSlippage: number
}
const CustomSlippageInput: React.FC<Props> = ({ rawSlippage, setRawSlippage, isWarning, defaultRawSlippage }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // rawSlippage = 10
  // slippage shown to user: = 10 / 10_000 = 0.001 = 0.1%
  const [rawText, setRawText] = useState(getSlippageText(rawSlippage))

  const isCustomOptionActive = !DEFAULT_SLIPPAGES.includes(rawSlippage)

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (value === '') {
      setRawText(value)
      setRawSlippage(defaultRawSlippage)
      return
    }

    const numberRegex = /^(\d+)\.?(\d{1,2})?$/
    if (!value.match(numberRegex)) {
      e.preventDefault()
      return
    }

    const parsedValue = parseSlippageInput(value)
    if (Number.isNaN(parsedValue)) {
      e.preventDefault()
      return
    }

    if (parsedValue > MAX_SLIPPAGE_IN_BIPS) {
      e.preventDefault()
      return
    }

    setRawText(value)
    setRawSlippage(parsedValue)
  }

  const handleCommitChange = () => {
    setRawText(getSlippageText(rawSlippage))
  }

  const handleKeyPressInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key
    if (key === '.' || ('0' <= key && key <= '9')) {
      return
    }

    if (key === 'Enter') {
      handleCommitChange()
      inputRef.current?.blur()
      return
    }

    e.preventDefault()
  }

  useEffect(() => {
    if (inputRef.current !== document.activeElement) {
      setRawText(getSlippageText(rawSlippage))
    }
  }, [rawSlippage])

  return (
    <CustomSlippageOption data-active={isCustomOptionActive} data-warning={isCustomOptionActive && isWarning}>
      {isCustomOptionActive && isWarning && (
        <EmojiContainer>
          <span role="img" aria-label="warning">
            ⚠️
          </span>
        </EmojiContainer>
      )}
      <CustomInput
        ref={inputRef}
        placeholder={t`Custom`}
        value={rawText}
        onChange={handleChangeInput}
        onKeyPress={handleKeyPressInput}
        onBlur={handleCommitChange}
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
  )
}

export default CustomSlippageInput
