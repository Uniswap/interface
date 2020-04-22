import React from 'react'
import styled from 'styled-components'
import { withRouter } from 'react-router-dom'

import Modal from '../Modal'
import Loader from '../Loader'
import { Link } from '../../theme'
import { Text } from 'rebass'
import { CloseIcon } from '../../theme/components'
import { RowBetween } from '../Row'
import { CheckCircle } from 'react-feather'
import { ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'

import { useWeb3React } from '../../hooks'
import { getEtherscanLink } from '../../utils'

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 26px;
`

const BottomSection = styled(Section)`
  background-color: ${({ theme }) => theme.bg2};
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`

function ConfirmationModal({
  history,
  isOpen,
  onDismiss,
  hash,
  topContent,
  bottomContent,
  attemptingTxn,
  pendingConfirmation,
  pendingText,
  title = ''
}) {
  const { chainId } = useWeb3React()

  function WrappedOnDismissed(returnToPool = false) {
    if (returnToPool && (history.location.pathname.match('/add') || history.location.pathname.match('/remove'))) {
      history.push('/pool')
    }
    onDismiss()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={WrappedOnDismissed} maxHeight={90}>
      {!attemptingTxn ? (
        <Wrapper>
          <Section>
            <RowBetween>
              <Text fontWeight={500} fontSize={20}>
                {title}
              </Text>
              <CloseIcon onClick={WrappedOnDismissed} />
            </RowBetween>
            {topContent()}
          </Section>
          <BottomSection gap="12px">{bottomContent()}</BottomSection>
        </Wrapper>
      ) : (
        <Wrapper>
          <Section>
            <RowBetween>
              <div />
              <CloseIcon onClick={WrappedOnDismissed} />
            </RowBetween>
            <ConfirmedIcon>
              {pendingConfirmation ? <Loader size="90px" /> : <CheckCircle size={90} color="#27AE60" />}
            </ConfirmedIcon>
            <AutoColumn gap="24px" justify={'center'}>
              <Text fontWeight={500} fontSize={20}>
                {!pendingConfirmation ? 'Transaction Submitted' : 'Waiting For Confirmation'}
              </Text>
              <AutoColumn gap="12px" justify={'center'}>
                <Text fontWeight={600} fontSize={16} color="#2172E5">
                  {pendingText}
                </Text>
              </AutoColumn>
              {!pendingConfirmation && (
                <>
                  <Link href={getEtherscanLink(chainId, hash, 'transaction')}>
                    <Text fontWeight={500} fontSize={14} color="#2172E5">
                      View on Etherscan
                    </Text>
                  </Link>
                  <ButtonPrimary onClick={() => WrappedOnDismissed(true)} style={{ margin: '20px 0' }}>
                    <Text fontWeight={500} fontSize={20}>
                      Close
                    </Text>
                  </ButtonPrimary>
                </>
              )}
              {pendingConfirmation && <div style={{ height: '138px' }} />}
              <Text fontSize={12} color="#565A69">
                {pendingConfirmation
                  ? 'Confirm this transaction in your wallet'
                  : `Estimated time until confirmation: 3 min`}
              </Text>
            </AutoColumn>
          </Section>
        </Wrapper>
      )}
    </Modal>
  )
}

export default withRouter(ConfirmationModal)
