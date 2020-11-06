import React from 'react'
import styled from 'styled-components'
import useCopyClipboard from '../../hooks/useCopyClipboard'

import { LinkStyledButton } from '../../theme'
import { CheckCircle, Copy } from 'react-feather'

const CopyIcon = styled(LinkStyledButton)`
  color: ${({ theme }) => theme.text4};
  flex-shrink: 0;
  display: flex;
  text-decoration: none;
  font-size: 0.825rem;
  padding: 0;
  :hover,
  :active,
  :focus {
    text-decoration: none;
    color: ${({ theme }) => theme.text2};
  }
`

const TransactionStatus = styled.span`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
`

const TransactionStatusText = styled.span`
  color: ${({ theme }) => theme.text4};
  margin-left: 0.25rem;
  font-size: 0.825rem;
`

const CustomCopy = styled(Copy)`
  color: ${({ theme }) => theme.text5};
`

const CustomCheckCircle = styled(CheckCircle)`
  color: ${({ theme }) => theme.text5};
`

export default function CopyHelper(props: { toCopy: string; children?: React.ReactNode }) {
  const [isCopied, setCopied] = useCopyClipboard()

  return (
    <CopyIcon onClick={() => setCopied(props.toCopy)}>
      {isCopied ? (
        <TransactionStatus>
          <CustomCheckCircle size={'16'} />
          <TransactionStatusText>Copied</TransactionStatusText>
        </TransactionStatus>
      ) : (
        <TransactionStatus>
          <CustomCopy size={'16'} />
        </TransactionStatus>
      )}
      {isCopied ? '' : props.children}
    </CopyIcon>
  )
}
