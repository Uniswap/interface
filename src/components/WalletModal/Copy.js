import React from 'react'
import styled from 'styled-components'
import { useCopyClipboard } from '../../hooks'

import { Link } from '../../theme'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheckCircle } from '@fortawesome/free-regular-svg-icons'

const CopyIcon = styled(Link)`
  color: ${({ theme }) => theme.silverGray};
  flex-shrink: 0;
  margin-right: 1rem;
  margin-left: 0.5rem;
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
`

export default function Copy({ toCopy }) {
  const [isCopied, setCopied] = useCopyClipboard()

  return (
    <CopyIcon onClick={() => setCopied(toCopy)}>
      {isCopied ? (
        <TransactionStatusText>
          <FontAwesomeIcon icon={faCheckCircle} />
          <TransactionStatusText>Copied</TransactionStatusText>
        </TransactionStatusText>
      ) : (
        <TransactionStatusText>
          <FontAwesomeIcon icon={faCopy} />
        </TransactionStatusText>
      )}
    </CopyIcon>
  )
}
