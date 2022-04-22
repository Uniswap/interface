import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components/macro'

const MessageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20rem;
`

const Message = styled.h2`
  color: ${({ theme }) => theme.secondary1};
`

export default function Web3ReactManager({ children }: { children: JSX.Element }) {
  const { isActive } = useWeb3React()

  // if the account context isn't active
  if (!isActive) {
    return (
      <MessageWrapper>
        <Message>
          <Trans>
            Oops! An unknown error occurred. Please refresh the page, or visit from another browser or device.
          </Trans>
        </Message>
      </MessageWrapper>
    )
  }

  return children
}
