import React, { useEffect, useRef, useState } from 'react'
import { Box, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

type Props = {
  className?: string
  page: number
  lastPage: number
  setPage: (p: number) => void
}

const isValidInteger = (s: string): boolean => {
  const numberRegex = /^\d+$/
  return !!s.match(numberRegex)
}

// This is to make the input auto-resize on typing
const getInputWidth = (n: number): number => {
  const minWidth = 48 /* px */
  const maxWidth = 120 /* px */

  const minChar = 3
  const pxPerChar = 8

  return Math.min(minWidth + Math.max(n - minChar, 0) * pxPerChar, maxWidth)
}

export const Input = styled.input`
  outline: none;
  border: none;
  background-color: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.primary};
  overflow: hidden;
  text-overflow: ellipsis;

  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  text-align: center;

  border-radius: 20px;
  padding: 8px 12px;

  ::placeholder {
    color: ${({ theme }) => theme.subText};
  }

  -webkit-appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
`

const PaginationInputOnMobile: React.FC<Props> = ({ className, page, lastPage, setPage }) => {
  const theme = useTheme()
  const [inputValue, setInputValue] = useState(String(page))
  const inputRef = useRef<HTMLInputElement>(null)

  const minCharLength = Math.max(inputValue.length, String(page).length)
  const width = getInputWidth(minCharLength)

  const handleCommitChange = () => {
    if (!isValidInteger(inputValue)) {
      setInputValue(String(page))
      return
    }

    const newPage = parseInt(inputValue)
    if (Number.isNaN(newPage)) {
      setInputValue(String(page))
      return
    }

    if (newPage <= 0 || newPage > lastPage) {
      setInputValue(String(page))
      return
    }

    setPage(newPage)
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommitChange()
      inputRef.current?.blur()
    }
  }

  useEffect(() => {
    setInputValue(String(page))
  }, [page])

  return (
    <div className={className}>
      <Box
        sx={{
          display: 'inline-flex',
          width: 'min-content',
          alignItems: 'center',
        }}
      >
        <Input
          ref={inputRef}
          value={inputValue}
          type="number"
          onChange={e => setInputValue(e.target.value)}
          onBlur={handleCommitChange}
          onKeyUp={handleKeyUp}
          style={{
            width: `${width}px`,
          }}
        />
      </Box>
      <Text
        color={theme.subText}
        sx={{
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
        }}
      >
        /
      </Text>
      <Text
        color={theme.subText}
        sx={{
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
        }}
      >
        {lastPage}
      </Text>
    </div>
  )
}

export default styled(PaginationInputOnMobile)`
  display: inline-flex;
  column-gap: 8px;
  width: min-content;
  align-items: center;
  margin: 0 4px;
`
