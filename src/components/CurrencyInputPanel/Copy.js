import React from 'react'
import styled from 'styled-components'
import { useCopyClipboard } from '../../hooks'

import { Link } from '../../theme'
import { CheckCircle, Copy } from 'react-feather'

const CopyIcon = styled(Link)`
  color: ${({ theme }) => theme.silverGray};
  flex-shrink: 0;
  margin-left: 0.25rem;
  text-decoration: none;
  :hover,
  :active,
  :focus {
    text-decoration: none;
    color: ${({ theme }) => theme.doveGray};
  }
`
const TransactionStatusText = styled.span`
  margin-left: 0.25rem;
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
`

export default function CopyHelper({ toCopy }) {
  const [isCopied, setCopied] = useCopyClipboard()

  if(toCopy.toString() === 'ETH') {
    return null;
  }

  function handleClick(e) {
    setCopied(toCopy)
    e.stopPropagation()
  }

  return (
    <CopyIcon onClick={e => handleClick(e)}>
      {isCopied ? (
        <TransactionStatusText>
          <CheckCircle size={'16'} />
          <TransactionStatusText>Token Address Copied</TransactionStatusText>
        </TransactionStatusText>
      ) : (
        <TransactionStatusText>
          <Copy size={'16'} />
        </TransactionStatusText>
      )}
    </CopyIcon>
  )
}
