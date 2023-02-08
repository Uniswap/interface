import React, { CSSProperties, ReactNode, forwardRef } from 'react'
import { CheckCircle, Copy } from 'react-feather'
import { Flex } from 'rebass'
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

type Props = {
  toCopy: string
  children?: React.ReactNode
  margin?: string
  style?: CSSProperties
  size?: string
  text?: ReactNode
}

const CopyHelper = forwardRef<HTMLDivElement, Props>(function CopyHelper(
  { toCopy, margin, style = {}, size = '14', text },
  ref,
) {
  const [isCopied, setCopied] = useCopyClipboard()

  const onCopy = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    setCopied(toCopy)
  }

  const copyIcon = (
    <TransactionStatusText>{isCopied ? <CheckCircle size={size} /> : <Copy size={size} />}</TransactionStatusText>
  )

  return (
    <CopyIcon ref={ref} onClick={onCopy} margin={margin} style={style}>
      {text ? (
        <Flex>
          {copyIcon}&nbsp;{text}
        </Flex>
      ) : (
        copyIcon
      )}
    </CopyIcon>
  )
})

export default CopyHelper
