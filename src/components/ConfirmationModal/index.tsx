import React, { useCallback } from 'react'
import styled from 'styled-components'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import Modal from '../Modal'
import Loader from '../Loader'
import { Link } from '../../theme'
import { Text } from 'rebass'
import { CloseIcon } from '../../theme/components'
import { RowBetween } from '../Row'
import { ArrowUpCircle } from 'react-feather'
import { ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'

import { useWeb3React } from '../../hooks'
import { getEtherscanLink } from '../../utils'

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 24px;
`

const BottomSection = styled(Section)`
  background-color: ${({ theme }) => theme.bg2};
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`

interface ConfirmationModalProps extends RouteComponentProps<{}> {
  isOpen: boolean
  onDismiss: () => void
  hash: string
  topContent: () => React.ReactChild
  bottomContent: () => React.ReactChild
  attemptingTxn: boolean
  pendingConfirmation: boolean
  pendingText: string
  title?: string
}

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
                           }: ConfirmationModalProps) {
  const { chainId } = useWeb3React()

  const dismissAndReturn = useCallback(() => {
    if (history.location.pathname.match('/add') || history.location.pathname.match('/remove')) {
      history.push('/pool')
    }
    onDismiss()
  }, [onDismiss, history])

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      {!attemptingTxn ? (
        <Wrapper>
          <Section>
            <RowBetween>
              <Text fontWeight={500} fontSize={20}>
                {title}
              </Text>
              <CloseIcon onClick={onDismiss}/>
            </RowBetween>
            {topContent()}
          </Section>
          <BottomSection gap="12px">{bottomContent()}</BottomSection>
        </Wrapper>
      ) : (
        <Wrapper>
          <Section>
            <RowBetween>
              <div/>
              <CloseIcon onClick={onDismiss}/>
            </RowBetween>
            <ConfirmedIcon>
              {pendingConfirmation ? (
                <Loader size="90px"/>
              ) : (
                <ArrowUpCircle strokeWidth={0.5} size={90} color="#ff007a"/>
              )}
            </ConfirmedIcon>
            <AutoColumn gap="12px" justify={'center'}>
              <Text fontWeight={500} fontSize={20}>
                {!pendingConfirmation ? 'Transaction Submitted' : 'Waiting For Confirmation'}
              </Text>
              <AutoColumn gap="12px" justify={'center'}>
                <Text fontWeight={600} fontSize={14} color="" textAlign="center" style={{ width: '70%' }}>
                  {pendingText}
                </Text>
              </AutoColumn>
              {!pendingConfirmation && (
                <>
                  <Link href={getEtherscanLink(chainId, hash, 'transaction')}>
                    <Text fontWeight={500} fontSize={14} color="#ff007a">
                      View on Etherscan
                    </Text>
                  </Link>
                  <ButtonPrimary onClick={dismissAndReturn} style={{ margin: '20px 0 0 0' }}>
                    <Text fontWeight={500} fontSize={20}>
                      Close
                    </Text>
                  </ButtonPrimary>
                </>
              )}
              {/* {pendingConfirmation && <div style={{ height: '138px' }} />} */}
              <Text fontSize={12} color="#565A69" textAlign="center">
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
