import React from 'react'
import styled, { keyframes } from 'styled-components'
import { useWeb3Context } from 'web3-react'
import { useCopyClipboard } from '../../hooks'

import { getEtherscanLink } from '../../utils'
import { Link } from '../../theme'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheckCircle } from '@fortawesome/free-regular-svg-icons'
import { faCircleNotch, faCheck } from '@fortawesome/free-solid-svg-icons'

import { transparentize } from 'polished'

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

const TransactionStatusWrapper = styled.div`
  display: flex;
  align-items: center;
  min-width: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const TransactionWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: space-between;
  width: 100%;
  margin-top: 0.75rem;
  a {
    /* flex: 1 1 auto; */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    max-width: 250px;
  }
`

const TransactionStatusText = styled.span`
  margin-left: 0.25rem;
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const TransactionState = styled.div`
  background-color: ${({ pending, theme }) =>
    pending ? transparentize(0.95, theme.royalBlue) : transparentize(0.95, theme.connectedGreen)};
  border-radius: 1.5rem;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  font-size: 0.75rem;
  border: 1px solid;
  border-color: ${({ pending, theme }) =>
    pending ? transparentize(0.75, theme.royalBlue) : transparentize(0.75, theme.connectedGreen)};

  #pending {
    animation: 2s ${rotate} linear infinite;
  }
  :hover {
    border-color: ${({ pending, theme }) =>
      pending ? transparentize(0, theme.royalBlue) : transparentize(0, theme.connectedGreen)};
  }
`

const ButtonWrapper = styled.div`
  a {
    color: ${({ pending, theme }) => (pending ? theme.royalBlue : theme.connectedGreen)};
  }
`

export default function Info({ hash, pending }) {
  const { networkId } = useWeb3Context()
  const [isCopied, copy] = useCopyClipboard()

  return (
    <TransactionWrapper key={hash}>
      <TransactionStatusWrapper>
        <Link href={getEtherscanLink(networkId, hash, 'transaction')}>{hash} ↗ </Link>

        <CopyIcon onClick={() => copy(hash)}>
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
      </TransactionStatusWrapper>
      {pending ? (
        <ButtonWrapper pending={pending}>
          <Link href={getEtherscanLink(networkId, hash, 'transaction')}>
            <TransactionState pending={pending}>
              <FontAwesomeIcon id="pending" icon={faCircleNotch} />
              <TransactionStatusText>Pending</TransactionStatusText>
            </TransactionState>
          </Link>
        </ButtonWrapper>
      ) : (
        <ButtonWrapper pending={pending}>
          <Link href={getEtherscanLink(networkId, hash, 'transaction')}>
            <TransactionState pending={pending}>
              <FontAwesomeIcon icon={faCheck} />
              <TransactionStatusText>Confirmed</TransactionStatusText>
            </TransactionState>
          </Link>
        </ButtonWrapper>
      )}
    </TransactionWrapper>
  )
}
