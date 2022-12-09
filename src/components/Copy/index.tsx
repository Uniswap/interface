import React, { CSSProperties } from 'react'
import { CheckCircle, Copy } from 'react-feather'
import styled from 'styled-components'

import useCopyClipboard from 'hooks/useCopyClipboard'

const CopyIcon = styled.div<{ margin?: string }>`
  flex-shrink: 0;
  margin-left: 4px;
  ${({ margin }) => `margin: ${margin};`}
  text-decoration: none;
  :hover,
  :active,
  :focus {
    text-decoration: none;
    opacity: 0.8;
    cursor: pointer;
    color: ${({ theme }) => theme.text2};
  }
`

const TransactionStatusText = styled.span`
  font-size: 0.825rem;
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
`

export default function CopyHelper({
  toCopy,
  margin,
  style = {},
  size = '14',
}: {
  toCopy: string
  children?: React.ReactNode
  margin?: string
  style?: CSSProperties
  size?: string
}) {
  const [isCopied, setCopied] = useCopyClipboard()

  const onCopy = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    setCopied(toCopy)
  }

  return (
    <CopyIcon onClick={onCopy} margin={margin} style={style}>
      {isCopied ? (
        <TransactionStatusText>
          <CheckCircle size={size} />
        </TransactionStatusText>
      ) : (
        <TransactionStatusText>
          <Copy size={size} />
        </TransactionStatusText>
      )}
    </CopyIcon>
  )
}
