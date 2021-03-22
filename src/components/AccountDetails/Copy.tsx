import React from 'react'
import styled from 'styled-components'
import useCopyClipboard from '../../hooks/useCopyClipboard'

import { LinkStyledButton } from '../../theme'
import { CheckCircle, Copy } from 'react-feather'

const CopyIcon = styled(LinkStyledButton)<{ color?: string; fontSize?: string; paddingLeft?: string }>`
  color: ${({ theme, color }) => color || theme.text3};
  flex-shrink: 0;
  display: flex;
  text-decoration: none;
  font-size: ${({ fontSize }) => (fontSize ? fontSize : '0.825rem')};
  ${({ paddingLeft }) => `padding-left: ${paddingLeft}`};
  :hover,
  :active,
  :focus {
    text-decoration: none;
    color: ${({ theme, color }) => color || theme.text2};
  }
`
const TransactionStatusText = styled.span`
  margin-left: 0.25rem;
  font-size: 0.825rem;
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
`

export default function CopyHelper(props: {
  toCopy: string
  children?: React.ReactNode
  color?: string
  fontSize?: string
  paddingLeft?: string
}) {
  const [isCopied, setCopied] = useCopyClipboard()

  return (
    <CopyIcon
      onClick={() => setCopied(props.toCopy)}
      color={props.color}
      fontSize={props.fontSize}
      paddingLeft={props.paddingLeft}
    >
      {isCopied ? (
        <TransactionStatusText>
          <CheckCircle size={'16'} />
          <TransactionStatusText>Copied</TransactionStatusText>
        </TransactionStatusText>
      ) : (
        <TransactionStatusText>
          <Copy size={'16'} />
        </TransactionStatusText>
      )}
      {isCopied ? '' : props.children}
    </CopyIcon>
  )
}
